// src/lib/r2.ts
// ─────────────────────────────────────────────
// Cloudflare R2 upload helper.
// Bucket name    : maptiles
// Folder path    : {club-slug}/{file}.png — no more -tiles suffix
//   e.g.          royal-greens/1714000000-hole1.png
//
// Secret keys NEVER touch the browser — Express signing server
// (server/index.js) generates a presigned PUT URL.
// ─────────────────────────────────────────────

const SIGN_URL = process.env.REACT_APP_SIGN_URL || "http://localhost:4000/api/r2-sign";

/**
 * Upload a single PNG file to Cloudflare R2.
 * @param {File}   file
 * @param {string} clubSlug  e.g. "royal-greens"
 * @returns {Promise<{ key: string, url: string }>}
 */
export async function uploadFile(file: File, clubSlug: string): Promise<{ key: string, url: string }> {
  // Validate file type - PNG only
  if (file.type !== 'image/png') {
    throw new Error('Only PNG files are allowed for upload');
  }

  // Key format: {club-slug}/{timestamp}-{filename}.png
  // No explicit folder creation needed — R2 uses "/" as path delimiter automatically
  const timestamp = Date.now();
  const filename = file.name.replace(/\s+/g, "_");
  const key = `${clubSlug}/${timestamp}-${filename}`;

  // 1. Get presigned PUT URL from signing server
  const signRes = await fetch(SIGN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ key, contentType: file.type }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}));
    throw new Error(err.error || "Could not get upload URL from signing server");
  }

  const { presignedUrl, publicUrl } = await signRes.json();

  // 2. PUT directly to R2
  const putRes = await fetch(presignedUrl, {
    method:  "PUT",
    headers: { "Content-Type": file.type },
    body:    file,
  });

  if (!putRes.ok) throw new Error(`R2 upload failed (HTTP ${putRes.status})`);

  return { key, url: publicUrl };
}

/**
 * Upload multiple files sequentially with progress callback.
 * @param {File[]}   files
 * @param {string}   clubSlug
 * @param {Function} onProgress  (completedCount, totalCount) => void
 * @returns {Promise<Array<{ key: string, url: string }>>}
 */
export async function uploadFiles(files: File[], clubSlug: string, onProgress?: (completedCount: number, totalCount: number) => void): Promise<Array<{ key: string, url: string }>> {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(files[i], clubSlug);
    results.push(result);
    onProgress?.(i + 1, files.length);
  }
  return results;
}
