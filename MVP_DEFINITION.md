# Minimum Viable Product (MVP) Definition

## 1. Primary Goal

To validate that our core AI pipeline can transform a simple user prompt into a high-quality, technically sound 3D asset, delivering an empowering "Illusion of Mastery" experience to first-time, non-technical users.

## 2. Scope & Core Features

The MVP will focus exclusively on the core creation flow.

### User-Facing Features:

*   **User Authentication:**
    *   Simple email/password signup and login.
*   **The "Magic Canvas" Interface:**
    *   A clean, minimal single-page application.
    *   A prominent text input field for the user's prompt ("What do you want to create?").
    *   An interactive 3D viewer (using Three.js) to display the generated model.
    *   A simple "Download" button for the final asset.
*   **Simplified Onboarding:**
    *   A hard-coded, non-adaptive "Invisible Tutorial" that uses tooltips to guide the user through their very first creation (e.g., "1. Type your idea here", "2. See your creation!", "3. Download your model").

### Backend & AI Pipeline:

*   **Text-to-3D Generation:**
    *   Integration with a single, state-of-the-art open-source text-to-3D model (e.g., a fine-tuned version of Shap-E or a similar diffusion model).
*   **Automated Refinement Pipeline (The Core Differentiator):**
    *   **This is the most critical technical component to validate.**
    *   An automated, server-side process that takes the raw model output and performs:
        1.  **Auto-Retopology:** To create a clean, usable mesh.
        2.  **Auto-UV Unwrapping:** To prepare the model for texturing.
*   **Asset Delivery:**
    *   The refined model will be delivered to the user for download in a standard, web-friendly format (`.glb`).
*   **Basic Database:**
    *   A PostgreSQL database to store user accounts and the metadata of their created models (linking assets to the creator).

## 3. Explicitly Excluded from MVP

To maintain focus, the following features will be intentionally excluded. They will be prioritized in future iterations based on MVP feedback.

*   **No Advanced AI:**
    *   No dynamic user profiling or adaptive UI. The "Illusion Engine" is v0.1 and consists only of the simplified onboarding.
    *   No AI texturing, image-to-3D, or prompt enhancement.
*   **No Monetization or Tiers:**
    *   The platform is entirely free to use. No "Pro" or "Enterprise" features.
*   **No Community or Collaboration:**
    *   No user galleries, sharing, commenting, or real-time collaboration.
*   **No Complex User Management:**
    *   No user profiles, settings, or project management dashboards.
*   **No Private Workspaces:**
    *   All generated models are owned by the platform, as per the free tier's Terms of Service.

## 4. Success Metrics

We will measure the MVP's success against clear, measurable targets:

*   **Activation Rate:**
    *   **Target:** > 60% of new users successfully generate and download at least one model during their first session.
*   **Time-to-Value:**
    *   **Target:** The median time from signup to first model download is less than 3 minutes.
*   **Technical Quality Validation (Internal):**
    *   **Target:** > 80% of generated assets are deemed "technically sound" (clean topology, no major artifacts, usable UVs) by our internal review.
*   **Qualitative Feedback (User Surveys):**
    *   **Target:** Achieve a Net Promoter Score (NPS) of 50+ from a cohort of beta testers.
    *   **Key Question:** "On a scale of 1-10, how much did you feel like a creative expert while using the platform?" - Target score > 7.

This tightly scoped MVP allows us to focus our resources on the most innovative and riskiest parts of the vision, ensuring we build a solid foundation based on validated user value and technical feasibility.