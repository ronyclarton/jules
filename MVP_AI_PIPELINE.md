# Core AI Pipeline Design for MVP

This document details the design and implementation plan for the MVP's Core AI Pipeline. The pipeline is an asynchronous, server-side process responsible for all heavy-duty AI and 3D processing tasks.

## 1. Guiding Principles

*   **Pragmatism over Perfection:** For the MVP, we will leverage existing, well-supported open-source models and tools wherever possible. The goal is to build a functional end-to-end pipeline quickly.
*   **Automation is Key:** The entire pipeline must be fully automated, requiring no manual intervention from the user or a developer.
*   **Encapsulation:** The pipeline will be packaged within a single Docker container to simplify dependencies and deployment.

## 2. Pipeline Stages & Technology Choices

The pipeline consists of three main stages, executed sequentially as a background job managed by Celery.

### Stage 1: Text-to-3D Generation

*   **Objective:** Generate a raw 3D mesh from a user's text prompt.
*   **Selected Model:** **OpenAI's Shap-E**.
*   **Justification:**
    *   **Direct Mesh Output:** Unlike many other models that produce NeRFs or Gaussian Splats, Shap-E can directly generate explicit meshes. This significantly simplifies the pipeline for the MVP by removing the need for a complex surface reconstruction step (e.g., marching cubes).
    *   **Speed:** It's relatively fast, which is crucial for a good user experience.
    *   **Quality:** It produces coherent and recognizable shapes, providing a strong base for the subsequent refinement stages.
*   **Process:**
    1.  The Celery worker receives the text prompt.
    2.  It uses the pre-loaded Shap-E model to generate the 3D asset.
    3.  The output, a high-polygon and potentially messy mesh, is saved temporarily as `raw_model.obj`.

### Stage 2: Automated Refinement (Retopology & UV Unwrapping)

*   **Objective:** Convert the raw mesh into a technically sound, usable asset.
*   **Selected Tool:** **Blender (Headless)**.
*   **Justification:**
    *   **Powerful & Scriptable:** Blender is the industry standard for 3D modeling and has a powerful Python API (`bpy`) that allows for full automation of its internal tools.
    *   **All-in-One Solution:** It contains excellent, mature tools for both retopology (`QuadriFlow Remesh`) and UV unwrapping (`Smart UV Project`), consolidating our dependencies.
    *   **Container-Friendly:** Blender can be run in a "headless" mode (without a GUI) inside a Docker container, making it perfect for a server-side pipeline.
*   **Process:**
    1.  A Python script, executed by the Celery worker, invokes Blender.
    2.  The script performs the following actions using the `bpy` API:
        *   Deletes the default scene and imports `raw_model.obj`.
        *   Applies the **QuadriFlow Remesh** modifier to the object. A target polygon count (e.g., 5,000-10,000 polygons) will be set to ensure the output is lightweight and performant.
        *   Applies the **Smart UV Project** function to the newly created mesh to automatically generate UV maps.
        *   Exports the final, refined model in the `.glb` format, which is the standard for web 3D and packages textures and other data into a single file. The output is saved as `refined_model.glb`.

### Stage 3: Asset Storage & Status Update

*   **Objective:** Store the final asset and notify the system of completion.
*   **Process:**
    1.  The Celery worker uploads the `refined_model.glb` to our designated AWS S3 (or GCS) bucket.
    2.  Upon successful upload, the worker updates the corresponding record in the `models` table in our PostgreSQL database. It sets the `status` to `complete` and populates the `asset_url` with the S3 URL of the new file.

## 3. Implementation Plan

*   **The "AI Worker" Docker Image:**
    *   A custom Dockerfile will be created to build our main AI worker image.
    *   It will have a Python base and install all necessary libraries: `torch`, `shap-e`, `celery`, `redis`, etc.
    *   Crucially, it will also download and install a specific version of **Blender**.
*   **Celery Task Definition:**
    *   A single Celery task, `generate_3d_model_task`, will be defined.
    *   This task will encapsulate the logic for all three stages described above.
    *   The **Generation Service (FastAPI)** will be responsible for calling this task with a text prompt and returning the `task_id` to the frontend.
*   **Error Handling:**
    *   The Celery task will include `try...except` blocks to catch potential failures at any stage (e.g., model generation error, Blender script failure).
    *   If an error occurs, the task will update the model's `status` in the database to `failed` so the user can be notified.

This pipeline design is robust, pragmatic, and directly addresses the highest-risk technical challenges of the MVP. By successfully implementing this, we will have validated the core of our platform's value proposition.