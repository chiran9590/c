# Tiles Upload Instructions

## Problem
Only 35KB uploaded instead of 839MB because the tiles folder is missing from the project.

## Solution Steps

### 1. Place Your Tiles Folder
Copy your `tiles` folder (with subfolders 14, 15, 16, 17, 18, 19, 20) to:
```
/Users/chiran/Downloads/final_year-main 2.26.15 PM/tiles/
```

### 2. Verify Folder Structure
Your structure should look like:
```
tiles/
├── 14/
│   ├── image1.png
│   ├── image2.png
│   └── ...
├── 15/
│   ├── image1.png
│   ├── image2.png
│   └── ...
├── 16/
│   ├── image1.png
│   ├── image2.png
│   └── ...
├── 17/
│   ├── image1.png
│   ├── image2.png
│   └── ...
├── 18/
│   ├── image1.png
│   ├── image2.png
│   └── ...
├── 19/
│   ├── image1.png
│   ├── image2.png
│   └── ...
└── 20/
    ├── image1.png
    ├── image2.png
    └── ...
```

### 3. Upload Using the Web Interface
1. Start the development server: `npm run dev`
2. Navigate to the Upload section
3. Select your club from the dropdown
4. Click "Select Tiles Folder" and choose the `tiles` folder
5. Click "Upload Tiles"

### 4. Alternative: Manual Upload via Cloudflare Dashboard
If the web upload still fails, you can upload directly:
1. Go to Cloudflare R2 Dashboard
2. Navigate to `maptiles` bucket
3. Create folder structure: `rcb/tiles/14/`, `rcb/tiles/15/`, etc.
4. Upload all tile files to their respective subfolders

## Expected Results
- Total upload size: ~839MB
- All 6 subfolders uploaded
- Files accessible at: `rcb/tiles/{subfolder}/{filename}`

## Troubleshooting
If upload still fails after adding tiles folder:
1. Check browser console for errors
2. Verify Cloudflare Worker is deployed
3. Check R2 bucket permissions
4. Ensure worker URL is correct in `.env` file
