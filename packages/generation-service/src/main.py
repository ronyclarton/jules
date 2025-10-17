import os
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from celery import Celery
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional

# --- App & Celery Configuration ---
app = FastAPI()

celery_app = Celery(
    'tasks',
    broker=os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

# --- Database Connection ---
def get_db_connection():
    conn = psycopg2.connect(os.environ.get("DATABASE_URL"))
    return conn

# --- Pydantic Models ---
class GenerationRequest(BaseModel):
    prompt: str
    # In a real app, we'd get the user_id from the JWT token
    # For the MVP, we'll pass it in the request for simplicity.
    user_id: str

class ModelStatus(BaseModel):
    id: str
    status: str
    asset_url: Optional[str] = None


# --- API Endpoints ---
@app.post("/generate", status_code=202)
async def start_generation(request: GenerationRequest):
    """
    Starts the 3D model generation task.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Create a new model record in the database
        cursor.execute(
            "INSERT INTO models (user_id, prompt) VALUES (%s, %s) RETURNING id",
            (request.user_id, request.prompt)
        )
        model_id = cursor.fetchone()['id']
        conn.commit()
        cursor.close()
        conn.close()

        # Dispatch the task to the AI worker
        celery_app.send_task(
            "ai_worker.tasks.generate_3d_model_task",
            args=[model_id, request.prompt]
        )

        return {"model_id": model_id, "status": "pending"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/{model_id}/status", response_model=ModelStatus)
async def get_model_status(model_id: str):
    """
    Checks the status of a generation task.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute(
            "SELECT id, status, asset_url FROM models WHERE id = %s",
            (model_id,)
        )
        model_record = cursor.fetchone()
        cursor.close()
        conn.close()

        if not model_record:
            raise HTTPException(status_code=404, detail="Model not found")

        return model_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))