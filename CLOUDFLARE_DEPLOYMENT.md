# Cloudflare Worker Deployment Guide

## Prerequisites
- Node.js and npm installed
- Cloudflare account with R2 bucket "maptiles" created
- Wrangler CLI installed (`npm install -g wrangler`)

## Step 1: Login to Cloudflare
```bash
wrangler login
```

## Step 2: Configure Worker
```bash
# Set your account ID (get from Cloudflare dashboard)
wrangler whoami

# If needed, update account ID in wrangler.toml
```

## Step 3: Deploy Worker
```bash
# Deploy the worker
wrangler deploy

# The worker will be available at: https://maptiles-uploader.your-subdomain.workers.dev
```

## Step 4: Update Environment Variable
Update your `.env` file with the actual worker URL:
```env
VITE_CLOUDFLARE_WORKER_URL=https://maptiles-uploader.your-subdomain.workers.dev
```

## Step 5: Test the Worker
Test the endpoints:
- `POST /upload` - Upload files
- `POST /check-folder` - Check folder exists
- `POST /create-folder` - Create folder

## API Endpoints

### Upload File
```bash
curl -X POST https://your-worker.workers.dev/upload \
  -F "file=@example.png" \
  -F "key=club_name/tiles/example.png" \
  -F "club_name=club_name" \
  -F "type=tile"
```

### Check Folder
```bash
curl -X POST https://your-worker.workers.dev/check-folder \
  -H "Content-Type: application/json" \
  -d '{"club_name": "club_name"}'
```

### Create Folder
```bash
curl -X POST https://your-worker.workers.dev/create-folder \
  -H "Content-Type: application/json" \
  -d '{"club_name": "club_name"}'
```

## Features
- CORS enabled for all origins
- Supports large file uploads
- Automatic folder creation
- Progress tracking
- Error handling
- Logging

## File Structure
```
maptiles/
  club_name/
    .foldermarker (folder marker)
    metadata.json
    tiles/
      subfolder/
        image1.png
        image2.png
```

## Troubleshooting
1. If you get "R2 bucket not bound" error, check wrangler.toml configuration
2. If CORS errors occur, check the worker headers
3. If upload fails, check R2 bucket permissions
