// server/index.js
// ─────────────────────────────────────────────────────────────
// Express signing server for Cloudflare R2.
// Generates presigned PUT URLs so the browser can upload
// PNG tiles directly to R2 without exposing secret keys.
//
// Bucket  : maptiles
// Path    : {club-slug}/{timestamp}-{filename}.png
//
// Setup:
//   cp .env.example .env   (fill in your R2 credentials)
//   npm install
//   npm start              (listens on PORT, default 4000)
// ─────────────────────────────────────────────────────────────

require("dotenv").config();

const express  = require("express");
const cors     = require("cors");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl }               = require("@aws-sdk/s3-request-presigner");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

// ── Cloudflare R2 client (S3-compatible API) ─────────────────
const r2 = new S3Client({
  region:   "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET     = process.env.R2_BUCKET_NAME || "maptiles";
const PUBLIC_URL = process.env.R2_PUBLIC_URL;   // e.g. https://pub-xxx.r2.dev

// Only PNG files are accepted (was jpg+png before)
const ALLOWED_TYPES = new Set(["image/png"]);

// ── POST /api/r2-sign ─────────────────────────────────────────
// Body    : { key: "royal-greens/1714000000-hole1.png", contentType: "image/png" }
// Returns : { presignedUrl, publicUrl }
app.post("/api/r2-sign", async (req, res) => {
  const { key, contentType } = req.body ?? {};

  // Validate inputs
  if (!key || !contentType)
    return res.status(400).json({ error: "key and contentType are required" });

  if (!ALLOWED_TYPES.has(contentType))
    return res.status(400).json({ error: "Only image/png files are allowed" });

  // Guard against path traversal
  if (key.includes("..") || key.startsWith("/"))
    return res.status(400).json({ error: "Invalid key path" });

  try {
    const command = new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      ContentType: contentType,
    });

    // Presigned URL valid for 5 minutes
    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    const publicUrl    = `${PUBLIC_URL}/${key}`;

    res.json({ presignedUrl, publicUrl });
  } catch (err) {
    console.error("[r2-sign] Error:", err.message);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

// ── Health check ──────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, bucket: BUCKET }));

// ── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✓ R2 signing server running → http://localhost:${PORT}`);
  console.log(`  Bucket : ${BUCKET}`);
  console.log(`  Allows : image/png only`);
});
