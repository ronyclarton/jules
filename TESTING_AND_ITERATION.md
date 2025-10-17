# MVP Testing and Iteration Framework

This document outlines the framework for ensuring the quality of the MVP, gathering feedback, and iterating on the product in a data-driven manner.

## 1. Testing Strategy

Our testing strategy is multi-layered to catch issues at different levels of the application.

*   **Unit Tests:**
    *   **Objective:** To verify that individual functions and components work correctly in isolation.
    *   **Tools:**
        *   **Backend:** `pytest` for Python services, `jest` for the Node.js service.
        *   **Frontend:** `jest` and `React Testing Library` for React components.
    *   **Coverage:** Focus on business logic, utility functions, and complex component states. Aim for > 80% code coverage on critical logic.

*   **Integration Tests:**
    *   **Objective:** To verify the interactions between different services.
    *   **Examples:**
        *   Does the `User Service` correctly create an entry in the PostgreSQL database upon registration?
        *   Does the `Generation Service` successfully dispatch a job to the Celery/Redis queue?
    *   **Tools:** Tests will be written using the same frameworks (`pytest`, `jest`) but will interact with live test instances of databases and message brokers.

*   **End-to-End (E2E) Tests:**
    *   **Objective:** To simulate a complete user journey from start to finish, ensuring the entire system works cohesively.
    *   **Tool:** **Playwright**.
    *   **Core Test Scenario:**
        1.  A test user signs up and logs in.
        2.  The user navigates to the "Magic Canvas".
        3.  The user enters a text prompt and clicks "Generate".
        4.  The test asserts that the UI enters a "processing" state.
        5.  The test polls the status endpoint until it receives a "complete" status (the AI pipeline will have a mock or fast-path version for testing).
        6.  The test asserts that a 3D model is rendered in the viewer and a "Download" button is visible.

*   **Manual Quality Assurance (QA):**
    *   Before the beta launch, the internal team will conduct a thorough manual QA pass on the core user flow across major browsers (Chrome, Firefox, Safari).

## 2. Deployment & Beta Launch

*   **Environments:**
    *   **Staging:** A production-like environment for testing new changes. Deploys to staging will be automated on every merge to the `develop` branch.
    *   **Production:** The live environment for users. Deploys will be triggered manually from the `main` branch after successful verification on staging.
*   **Beta Launch Strategy:**
    *   An invite-only beta will be conducted for the first 2-4 weeks.
    *   We will recruit ~100 users from relevant communities (e.g., design students, hobbyist forums) to gather high-quality initial feedback.

## 3. Analytics & Monitoring

This is the foundation of our "Measure" and "Learn" cycles.

*   **Quantitative Analytics:**
    *   **Tool:** **PostHog** (provides analytics, session replay, and feature flags in one open-source package).
    *   **Key Events to Track:**
        *   `User Signed Up`
        *   `User Logged In`
        *   `Generation Started`
        *   `Generation Succeeded`
        *   `Generation Failed`
        *   `Model Downloaded`
*   **Qualitative Feedback:**
    *   **Tools:**
        *   A simple, non-intrusive feedback widget in the app (e.g., using **Tally.so**).
        *   A dedicated **Discord server** for beta testers to foster community and gather in-depth feedback.
*   **System Monitoring:**
    *   **Tools:** **Prometheus** for system metrics, **Grafana** for dashboards, and **Loki** for log aggregation.
    *   **What to Monitor:** API latency (p95, p99), error rates, service uptime, and resource utilization of the AI workers.

## 4. Iteration Process: The 2-Week Sprint Cycle

We will operate in a continuous feedback loop.

1.  **Review (Day 1):** The product team reviews analytics and qualitative feedback from the previous sprint, comparing results against our MVP success metrics.
2.  **Prioritize (Day 1):** Based on the review, the team prioritizes the most impactful bug fixes, performance improvements, and feature tweaks for the next sprint. The focus remains on achieving the MVP goals.
3.  **Plan (Day 2):** The engineering team breaks down the prioritized items into a sprint backlog of technical tasks.
4.  **Build (Days 2-9):** The team develops and tests the features.
5.  **Deploy (Day 10):** Changes are deployed to production.
6.  **Measure & Learn:** The cycle begins anew, with the team monitoring the impact of the new changes.

This framework ensures that we maintain high quality while systematically learning from our users, allowing us to evolve the platform intelligently and efficiently.