// src/components/admin/FileUpload.js
// Section 4 — Upload Tiles
// - Admin selects a golf club
// - Uploads PNG map tile images
// - Files stored in Cloudflare R2 bucket "maptiles"
// - Folder: maptiles/{club-slug}/{file}.png — no more -tiles suffix
// - If folder doesn't exist R2 creates it automatically
// - Metadata logged to Supabase uploads table
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { uploadFiles } from "../../lib/r2";
import Alert from "../ui/Alert";

export default function FileUpload() {
  const [clubs,        setClubs]        = useState([]);
  const [selectedClub, setSelectedClub] = useState("");
  const [files,        setFiles]        = useState([]);
  const [dragOver,     setDragOver]     = useState(false);
  const [progress,     setProgress]     = useState(null); // { done, total }
  const [uploading,    setUploading]    = useState(false);
  const [feedback,     setFeedback]     = useState({ type: "", msg: "" });
  const [uploadLog,    setUploadLog]    = useState([]);
  const inputRef = useRef();

  useEffect(() => {
    supabase
      .from("clubs")
      .select("*")
      .order("club_name")
      .then(({ data }) => setClubs(data ?? []));
    fetchLog();
  }, []);

  async function fetchLog() {
    const { data } = await supabase
      .from("uploads")
      .select("id, file_name, file_key, file_url, uploaded_at, clubs(club_name)")
      .order("uploaded_at", { ascending: false })
      .limit(20);
    setUploadLog(data ?? []);
  }

  function flash(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 5000);
  }

  // ── File selection — PNG only ─────────────────────
  function addFiles(raw) {
    const valid   = Array.from(raw).filter(f => f.type === "image/png");
    const skipped = raw.length - valid.length;
    if (skipped > 0)
      flash("info", `${skipped} file(s) skipped — only PNG images are allowed.`);
    const existing = new Set(files.map(f => f.name));
    const newFiles = valid.filter(f => !existing.has(f.name));
    setFiles(prev => [...prev, ...newFiles]);

    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !existing.has(f.name))];
    });
  }

  function removeFile(name) {
    setFiles(f => f.filter(x => x.name !== name));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  // ── Upload ────────────────────────────────────────────────
  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedClub) { flash("error", "Please select a golf club first."); return; }
    if (!files.length) { flash("error", "Please add at least one PNG file."); return; }

    setUploading(true);
    setProgress({ done: 0, total: files.length });

    const club = clubs.find(c => c.id === selectedClub);

    try {
      // Upload all files to R2: maptiles/{club.slug}/{file}.png
      const results = await uploadFiles(files, club.slug, (done, total) => {
        setProgress({ done, total });
      });

      // Log metadata to Supabase uploads table (store file_name)
      await supabase.from("uploads").insert(
        results.map((r, i) => ({
          club_id:   selectedClub,
          file_name: files[i].name,
          file_key:  r.key,
          file_url:  r.url,
        }))
      );

      flash(
        "success",
        `✓ ${results.length} file(s) uploaded to maptiles/${club.slug}/`
      );
      setFiles([]);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
      fetchLog();
    } catch (err) {
      flash("error", `Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  const pct = progress
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  const club = clubs.find(c => c.id === selectedClub);

  return (
    <>
      <div className="page-header">
        <h2>Upload Tiles</h2>
        <p>
          Upload PNG map tile images for a golf club. Files are stored in
          Cloudflare R2 bucket <code>maptiles</code>.
        </p>
      </div>

      {feedback.msg && <Alert type={feedback.type}>{feedback.msg}</Alert>}

      <div className="two-col">
        {/* ── Left: Upload form ── */}
        <div>
          {/* Club selector */}
          <div className="card">
            <div className="card-title">
              <span className="card-title-icon">⛳</span> Select Golf Club
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Golf Club</label>
              <select
                value={selectedClub}
                onChange={e => setSelectedClub(e.target.value)}
              >
                <option value="">— Choose a golf club —</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.club_name}
                  </option>
                ))}
              </select>
            </div>
            {club && (
              <p className="text-muted" style={{ marginTop: "0.6rem", fontSize: "0.8rem" }}>
                Files will be saved to: <code>maptiles/{club.slug}/</code>
              </p>
            )}
          </div>

          {/* File drop zone */}
          <div className="card">
            <div className="card-title">
              <span className="card-title-icon">🗺</span> Select PNG Map Tiles
            </div>

            <div
              className={`drop-zone ${dragOver ? "drag-over" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/png"
                onChange={e => addFiles(e.target.files)}
                style={{ display: "none" }}
              />
              <div className="drop-zone-icon">🖼</div>
              <div className="drop-zone-text">
                Drop PNG files here or <span className="text-teal">browse</span>
              </div>
              <div className="drop-zone-hint">PNG only · Multiple files supported</div>
            </div>

            {/* File chips */}
            {files.length > 0 && (
              <div className="file-chip-list">
                {files.map(f => (
                  <div key={f.name} className="file-chip">
                    <span>🖼</span>
                    <span className="file-chip-name" title={f.name}>{f.name}</span>
                    <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      className="file-chip-remove"
                      onClick={() => removeFile(f.name)}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Progress bar */}
            {uploading && progress && (
              <>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="progress-label">
                  {progress.done} / {progress.total} uploaded ({pct}%)
                </div>
              </>
            )}

            <button
              className="btn btn-primary"
              style={{ marginTop: "1.25rem" }}
              onClick={handleUpload}
              disabled={uploading || !files.length || !selectedClub}
            >
              {uploading
                ? `Uploading… (${pct}%)`
                : `Upload ${files.length || ""} PNG Tile${files.length !== 1 ? "s" : ""} →`}
            </button>
          </div>
        </div>

        {/* ── Right: Recent uploads log ── */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-icon">📋</span> Recent Uploads
          </div>

          {uploadLog.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📂</div>
              <p>No uploads yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {uploadLog.map(u => (
                <div
                  key={u.id}
                  style={{
                    padding: "0.65rem 0.8rem",
                    background: "var(--bg-3)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex-between">
                    <span className="badge badge-teal" style={{ fontSize: "0.68rem" }}>
                      {u.clubs?.club_name ?? "—"}
                    </span>
                    <span className="td-mono">
                      {new Date(u.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: "0.3rem",
                      fontSize: "0.8rem",
                      color: "var(--text-2)",
                      wordBreak: "break-all",
                    }}
                  >
                    {u.file_name}
                  </div>
                  <div
                    style={{
                      marginTop: "0.15rem",
                      fontSize: "0.72rem",
                      color: "var(--text-3)",
                      wordBreak: "break-all",
                    }}
                  >
                    {u.file_key}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
