# MVP Application Build Structure

This document breaks down the development of the MVP application into specific tasks for each component. This serves as a work plan for the engineering team.

## 1. Project Setup & Scaffolding

*   **Task 1: Monorepo Setup.**
    *   Initialize a monorepo (e.g., using `npm workspaces` or `pnpm`) to manage the frontend and backend services in a single repository.
    *   Directory structure:
        ```
        /
        ├── packages/
        │   ├── frontend/       (Next.js App)
        │   ├── user-service/   (Node.js/Fastify App)
        │   ├── generation-service/ (Python/FastAPI App)
        │   └── common/         (Shared types/interfaces, e.g., TypeScript)
        └── docker-compose.yml
        ```
*   **Task 2: Docker Compose Configuration.**
    *   Create a `docker-compose.yml` file to orchestrate all services for local development: `frontend`, `user-service`, `generation-service`, `postgres`, `redis`, and the `ai-worker`.

## 2. Backend Development

### 2.1. User Service (Node.js / Fastify)

*   **Task 1: Service Initialization.**
    *   Set up a new Fastify project with TypeScript.
    *   Establish a connection to the PostgreSQL database (using a library like `node-postgres`).
*   **Task 2: Database Migrations.**
    *   Implement a migration system (e.g., using `node-pg-migrate`) to manage the `users` table schema.
*   **Task 3: API Endpoints.**
    *   `POST /register`: Create a new user. Hash password using `bcrypt`.
    *   `POST /login`: Authenticate a user. Return a JSON Web Token (JWT).
*   **Task 4: Authentication Middleware.**
    *   Create a JWT-based authentication middleware to protect future endpoints.

### 2.2. Generation Service (Python / FastAPI)

*   **Task 1: Service Initialization.**
    *   Set up a new FastAPI project.
    *   Configure the Celery client to connect to the Redis broker.
*   **Task 2: API Endpoints.**
    *   `POST /generate`:
        *   Requires authentication (receives JWT from API Gateway).
        *   Accepts a JSON body with a `prompt` string.
        *   Creates a new record in the `models` table with `status: 'pending'`.
        *   Dispatches the `generate_3d_model_task` to the Celery queue with the `model_id` and `prompt`.
        *   Returns the `model_id` to the client.
    *   `GET /models/{model_id}/status`:
        *   Requires authentication.
        *   Queries the `models` table for the status of the job.
        *   Returns the status (`pending`, `processing`, `complete`, `failed`) and, if complete, the `asset_url`.

## 3. Frontend Development (React / Next.js)

*   **Task 1: Project Setup.**
    *   Initialize a new Next.js project with TypeScript.
    *   Set up state management (e.g., using `Zustand` or `React Context`) for user authentication state.
*   **Task 2: Pages & Routing.**
    *   `/login`: A simple login/register form.
    *   `/`: The main "Magic Canvas" page. This page should be protected, redirecting to `/login` if the user is not authenticated.
*   **Task 3: API Client.**
    *   Create a simple, typed API client (using `fetch` or `axios`) to interact with the backend services. It should handle attaching the JWT to authenticated requests.
*   **Task 4: "Magic Canvas" UI.**
    *   Implement the main UI with a large text input for the prompt and a "Generate" button.
    *   Integrate the `@react-three/fiber` and `@react-three/drei` libraries to create the 3D viewer component.
    *   The viewer should be able to load and display a `.glb` model from a URL.
*   **Task 5: Generation Flow Logic.**
    1.  User clicks "Generate". The `POST /generate` request is sent.
    2.  The UI enters a "loading" or "processing" state.
    3.  The frontend starts polling the `GET /models/{model_id}/status` endpoint every 3-5 seconds.
    4.  When the status is `complete`, the polling stops.
    5.  The `asset_url` is passed to the 3D viewer component, which loads the model.
    6.  A "Download" button appears, linking to the `asset_url`.

## 4. Illusion Engine v0.1: The "Invisible Tutorial"

*   **Task 1: Implement Tooltip System.**
    *   This will be a simple, hard-coded sequence of events for the MVP.
    *   Use a state machine or a simple counter in the main page component to track the user's progress through the onboarding.
*   **Task 2: Tutorial Sequence.**
    1.  **State 0 (Initial):** A tooltip points to the text prompt with the message: "Type your idea here to begin!"
    2.  **State 1 (After prompt is typed):** The tooltip moves to the "Generate" button: "Now, let's bring it to life!"
    3.  **State 2 (During processing):** A message appears in the viewer area: "Our AI is crafting your creation..."
    4.  **State 3 (Model loaded):** A tooltip points to the "Download" button: "Your masterpiece is ready! Download it here."
    5.  **State 4 (Complete):** All tooltips are hidden. The user is now free to create more models.

This structured plan ensures that all necessary components are built in a logical order, with clear dependencies between the frontend and backend teams. It provides a concrete roadmap to deliver the full MVP functionality within the target timeframe.