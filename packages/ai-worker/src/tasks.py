import os
import subprocess
import time
import psycopg2
import torch
import boto3

from celery import Celery
from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
from shap_e.models.download import load_model, load_config
from shap_e.util.notebooks import create_pan_cameras, decode_latent_mesh, write_mesh

# --- Celery Configuration ---
celery_app = Celery(
    'tasks',
    broker=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

# --- AI Model Loading ---
# This is done globally when the worker starts to avoid reloading on every task.
print("Loading AI models...")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
xm = load_model('transmitter', device=device)
model = load_model('text300M', device=device)
diffusion = diffusion_from_config(load_config('diffusion'))
print("AI models loaded.")

# --- Database Connection ---
def get_db_connection():
    return psycopg2.connect(os.environ.get("DATABASE_URL"))

def update_model_status(model_id, status, asset_url=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if asset_url:
        cursor.execute(
            "UPDATE models SET status = %s, asset_url = %s WHERE id = %s",
            (status, asset_url, model_id)
        )
    else:
        cursor.execute(
            "UPDATE models SET status = %s WHERE id = %s",
            (status, model_id)
        )
    conn.commit()
    cursor.close()
    conn.close()


# --- Main Celery Task ---
@celery_app.task(name='ai_worker.tasks.generate_3d_model_task')
def generate_3d_model_task(model_id: str, prompt: str):
    """
    The main task that runs the full AI pipeline.
    """
    print(f"Starting task for model_id: {model_id} with prompt: '{prompt}'")

    try:
        # 1. Update status to 'processing'
        update_model_status(model_id, 'processing')

        # --- Stage 1: Text-to-3D Generation (Shap-E) ---
        print("Stage 1: Generating raw mesh with Shap-E...")
        batch_size = 1
        guidance_scale = 15.0

        latents = diffusion.sample_latents(
            batch_size=batch_size,
            model_kwargs=dict(texts=[prompt] * batch_size),
            diffusion=diffusion,
            guidance_scale=guidance_scale,
            model=model,
            progress=True,
            clip_denoised=True,
            use_fp16=True,
            use_karras=True,
            karras_steps=64,
            sigma_min=1e-3,
            sigma_max=160,
            s_churn=0,
        )

        raw_mesh_path = f"/app/temp_{model_id}_raw.obj"
        with open(raw_mesh_path, 'w') as f:
            decode_latent_mesh(xm, latents[0]).stream_mesh(f)
        print(f"Raw mesh saved to {raw_mesh_path}")

        # --- Stage 2: Refinement (Blender) ---
        print("Stage 2: Refining mesh with Blender...")
        refined_mesh_path = f"/app/temp_{model_id}_refined.glb"

        # This script will be created separately
        blender_script_path = "/app/src/refine_script.py"

        command = [
            'blender',
            '--background',
            '--python', blender_script_path,
            '--',
            '--input', raw_mesh_path,
            '--output', refined_mesh_path
        ]

        subprocess.run(command, check=True)
        print(f"Refined mesh saved to {refined_mesh_path}")

        # --- Stage 3: Asset Storage (S3) ---
        print("Stage 3: Uploading asset to storage...")
        # Placeholder for S3 upload
        # In a real setup, you would use boto3 to upload the file.
        # s3_client = boto3.client('s3')
        # s3_client.upload_file(refined_mesh_path, 'your-s3-bucket', f'models/{model_id}.glb')
        # asset_url = f'https://your-s3-bucket.s3.amazonaws.com/models/{model_id}.glb'

        # For the MVP, we'll just use a placeholder URL.
        # This assumes the file will be served from the container for now.
        asset_url = f"http://placeholder.url/models/{model_id}.glb"
        print(f"Asset URL: {asset_url}")

        # 4. Update status to 'complete'
        update_model_status(model_id, 'complete', asset_url)
        print(f"Task for model_id: {model_id} completed successfully.")

    except Exception as e:
        print(f"Error processing task for model_id: {model_id}. Error: {e}")
        update_model_status(model_id, 'failed')
    finally:
        # Clean up temporary files
        if os.path.exists(raw_mesh_path):
            os.remove(raw_mesh_path)
        if os.path.exists(refined_mesh_path):
            os.remove(refined_mesh_path)
        print(f"Cleaned up temporary files for model_id: {model_id}")

    return {"status": "Task complete", "model_id": model_id}