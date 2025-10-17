# 1. Base Image
# Using a specific python version for stability
FROM python:3.9-slim

# 2. Install system dependencies for Blender
RUN apt-get update && apt-get install -y \
    wget \
    xz-utils \
    libfontconfig1 \
    libxrender1 \
    libgl1-mesa-glx \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# 3. Set Blender Version and Download URL
ENV BLENDER_VERSION 3.6.5
ENV BLENDER_URL https://download.blender.org/release/Blender3.6/blender-${BLENDER_VERSION}-linux-x64.tar.xz

# 4. Download, extract, and clean up Blender
RUN wget ${BLENDER_URL} && \
    tar -xf blender-${BLENDER_VERSION}-linux-x64.tar.xz && \
    rm blender-${BLENDER_VERSION}-linux-x64.tar.xz && \
    # Move blender to a more standard location
    mv blender-${BLENDER_VERSION}-linux-x64 /opt/blender

# 5. Add Blender to the system PATH
ENV PATH="/opt/blender:${PATH}"

# 6. Set working directory
WORKDIR /app

# 7. Copy and install Python dependencies
COPY requirements.txt .
# Using --no-cache-dir to keep the image size smaller
RUN pip install --no-cache-dir -r requirements.txt

# 8. Copy application code
COPY . .

# 9. Set the command to start the Celery worker
CMD ["celery", "-A", "src.tasks", "worker", "--loglevel=info"]