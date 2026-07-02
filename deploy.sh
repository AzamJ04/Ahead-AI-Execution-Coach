#!/bin/bash
set -e

# Configuration
PROJECT_ID="aheadcodex"
REGION="asia-south2"  # Delhi, India (minimal latency for Delhi)
REPOSITORY_NAME="ahead-app"
SERVICE_NAME="ahead-app"

echo "🚀 Starting deployment of Ahead Web App to Google Cloud Run..."
echo "📍 Target Project: $PROJECT_ID"
echo "📍 Target Region:  $REGION"

# 1. Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed. Please install it first."
    exit 1
fi

# 2. Authenticate if no active account is selected
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
if [ -z "$ACTIVE_ACCOUNT" ]; then
    echo "🔑 No active Google Cloud account found. Starting authentication..."
    gcloud auth login
else
    echo "👤 Authenticated as: $ACTIVE_ACCOUNT"
fi

# 3. Configure the active project
echo "⚙️  Setting active GCP project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# 4. Enable required Google Cloud APIs
echo "🔌 Enabling required GCP Services (Artifact Registry, Cloud Build, Cloud Run)..."
gcloud services enable \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com

# 5. Create Artifact Registry repository if it doesn't exist
echo "📦 Checking Artifact Registry repository..."
if ! gcloud artifacts repositories describe "$REPOSITORY_NAME" --location="$REGION" &> /dev/null; then
    echo "📦 Repository '$REPOSITORY_NAME' not found. Creating it in $REGION..."
    gcloud artifacts repositories create "$REPOSITORY_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="Docker repository for Ahead Web Application"
else
    echo "📦 Repository '$REPOSITORY_NAME' already exists."
fi

# 6. Extract OPENROUTER_API_KEY from .env/env.local if available
OPENROUTER_API_KEY=""
if [ -f .env.local ]; then
    OPENROUTER_API_KEY=$(grep -E "^OPENROUTER_API_KEY=" .env.local | cut -d'=' -f2- | tr -d '"' | tr -d "'")
elif [ -f .env ]; then
    OPENROUTER_API_KEY=$(grep -E "^OPENROUTER_API_KEY=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
fi

if [ -n "$OPENROUTER_API_KEY" ]; then
    echo "🔑 Found OPENROUTER_API_KEY in local environment files."
else
    echo "⚠️  Warning: OPENROUTER_API_KEY not found in .env or .env.local."
fi

# 7. Build and push image using Cloud Build
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY_NAME}/app:latest"
echo "🛠️  Building and pushing Docker image to Artifact Registry via Cloud Build..."
gcloud builds submit --tag "$IMAGE_TAG"

# 8. Deploy to Cloud Run
echo "⚡ Deploying to Google Cloud Run..."
if [ -n "$OPENROUTER_API_KEY" ]; then
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_TAG" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --set-env-vars "NODE_ENV=production,PORT=8080,OPENROUTER_API_KEY=${OPENROUTER_API_KEY}"
else
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_TAG" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --set-env-vars "NODE_ENV=production,PORT=8080"
fi

echo "✅ Deployment complete!"
