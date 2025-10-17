# MVP Technical Architecture

This document outlines the technical architecture for the Minimum Viable Product (MVP). The design prioritizes rapid development, clear separation of concerns, and future scalability.

## 1. System Architecture: Pragmatic Microservices

For the MVP, we will use a simplified microservices architecture. This gives us the benefits of separation without the overhead of a complex, fully distributed system.

```
┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │
│  Frontend (SPA) ├──────►│   API Gateway   │
│ (React/Next.js) │       │  (e.g., Kong)   │
│                 │       │                 │
└─────────────────┘       └───────┬───┬─────┘
                                  │   │
                                  ▼   ▼
                      ┌───────────┐ ┌───────────────┐
                      │           │ │               │
                      │ User Svc. │ │ Generation Svc. │
                      │ (Node.js) │ │   (Python)    │
                      │           │ │               │
                      └─────┬─────┘ └───────┬───────┘
                            │               │
                            ▼               ▼
                   ┌────────────┐   ┌─────────────────┐
                   │            │   │                 │
                   │ PostgreSQL │   │   AI Pipeline   │
                   │ (User Data)│   │ (Background Job)│
                   │            │   │                 │
                   └────────────┘   └─────────────────┘
                                           │
                                           ▼
                                    ┌───────────┐
                                    │           │
                                    │ S3 Bucket │
                                    │(3D Assets)│
                                    │           │
                                    └───────────┘
```

**Workflow:**

1.  **User Request:** The user interacts with the Single-Page Application (SPA).
2.  **API Gateway:** All requests go through the API Gateway, which handles routing, authentication, and rate limiting.
3.  **User Service:** Handles user signup, login, and profile information. It communicates directly with the PostgreSQL database.
4.  **Generation Service:** Receives the text prompt from the user. It initiates the AI Pipeline as a background job and immediately returns a `job_id` to the user. The frontend will poll this service with the `job_id` to check for completion.
5.  **AI Pipeline:** This is a series of asynchronous tasks (likely managed by a job queue like Celery with Redis) that performs the heavy lifting:
    *   Text-to-3D generation.
    *   Auto-retopology.
    *   Auto-UV unwrapping.
    *   Saves the final asset to the S3 bucket.
    *   Updates the status of the job in the Generation Service.
6.  **Asset Delivery:** Once the job is complete, the Generation Service provides a signed URL to the final asset in the S3 bucket, which the user can download.

## 2. Technology Stack

This stack is chosen for its maturity, large talent pool, and suitability for the tasks at hand.

*   **Frontend:**
    *   **Framework:** **React** with **Next.js**. Next.js provides server-side rendering (good for future SEO) and a great developer experience.
    *   **3D Viewer:** **Three.js** and **@react-three/fiber**. The standard for web-based 3D.
    *   **UI Components:** A simple library like **Chakra UI** or **shadcn/ui** for rapid development.
*   **Backend:**
    *   **API Gateway:** **Kong** or **AWS API Gateway**.
    *   **User Service:** **Node.js** with **Fastify**. Excellent for high-performance, I/O-heavy operations like handling many user requests.
    *   **Generation Service:** **Python** with **FastAPI**. The standard for wrapping AI/ML models in a clean API.
    *   **Job Queue:** **Celery** with **Redis** to manage the asynchronous AI Pipeline jobs.
*   **Databases & Storage:**
    *   **Primary Database:** **PostgreSQL**. Robust, reliable, and perfect for structured user and model data.
    *   **Asset Storage:** **AWS S3** or Google Cloud Storage.
*   **Deployment & Infrastructure:**
    *   **Containerization:** **Docker**.
    *   **Orchestration:** **Docker Compose** for local development and initial deployment. This is simpler than Kubernetes for the MVP. We will migrate to Kubernetes (EKS/GKE) in a later phase.
    *   **CI/CD:** **GitHub Actions** for automated testing and deployment.
    *   **Cloud Provider:** **AWS** or **GCP**.

## 3. Database Schemas

These are the initial, simplified schemas for the MVP.

```sql
-- users: Stores user authentication and basic info.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- models: Metadata for each generated 3D asset.
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    prompt TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- e.g., pending, processing, complete, failed
    asset_url VARCHAR(255), -- URL to the final .glb file in S3
    thumbnail_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A simple trigger to update the 'updated_at' timestamp on change.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON models FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

## 4. Initial Infrastructure & CI/CD Plan

*   **Infrastructure as Code (IaC):** We will use **Terraform** to define our cloud resources (databases, S3 buckets, etc.). This ensures our infrastructure is reproducible and version-controlled.
*   **CI/CD Pipeline (GitHub Actions):**
    1.  **On Push to `main`:**
        *   Run linters and unit tests for both frontend and backend services.
        *   Build Docker images for each service.
        *   Push Docker images to a container registry (e.g., Docker Hub, AWS ECR).
    2.  **Manual Trigger (Deploy to Production):**
        *   A manual approval step to deploy.
        *   The action will SSH into the production server and run `docker-compose up -d --build` to pull the latest images and restart the services.
        *   Run database migrations.

This architecture is robust enough to support the MVP and designed with clear pathways for scaling. For example, the `Generation Service` and its `AI Pipeline` can be scaled independently of the `User Service` as demand grows. The move from Docker Compose to Kubernetes will be a natural evolution post-MVP.