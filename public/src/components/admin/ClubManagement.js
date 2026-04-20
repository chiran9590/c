// src/components/admin/ClubManagement.js
// Section 3 — Golf Club Management
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Alert from "../ui/Alert";

export default function ClubManagement() {
  const [clubs,   setClubs]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [members, setMembers] = useState([]); // current assignments

  const [newClubName, setNewClubName] = useState("");
  const [assign, setAssign] = useState({ userId: "", clubId: "" });

  const [feedback,  setFeedback]  = useState({ type: "", msg: "" });
  const [creating,  setCreating]  = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [{ data: c }, { data: u }, { data: m }] = await Promise.all([
      supabase.from("clubs").select("*").order("club_name"),
      supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "client")
        .order("name"),
      supabase
        .from("user_club_mapping")
        .select("id, user_id, club_id, users(name), clubs(club_name)"),
    ]);
    setClubs(c   ?? []);
    setUsers(u   ?? []);
    setMembers(m ?? []);
  }

  function flash(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback({ type: "", msg: "" }), 4000);
  }

  // ── Create golf club ──────────────────────────────────────
  async function handleCreate(e) {
    e.preventDefault();
    if (!newClubName.trim()) return;
    setCreating(true);

    // Auto-generate slug from club name
    const slug = newClubName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { error } = await supabase
      .from("clubs")
      .insert({ club_name: newClubName.trim(), slug });

    if (error) flash("error", error.message);
    else {
      flash("success", `Golf club "${newClubName.trim()}" created.`);
      setNewClubName("");
      fetchAll();
    }
    setCreating(false);
  }

  // ── Assign client to golf club ────────────────────────────
  async function handleAssign(e) {
    e.preventDefault();
    if (!assign.userId || !assign.clubId) return;
    setAssigning(true);

    // Remove any existing assignment (one club per client)
    await supabase
      .from("user_club_mapping")
      .delete()
      .eq("user_id", assign.userId);

    const { error } = await supabase
      .from("user_club_mapping")
      .insert({ user_id: assign.userId, club_id: assign.clubId });

    if (error) {
      flash("error", error.message);
    } else {
      const userName = users.find(u => u.id === assign.userId)?.name;
      const clubName = clubs.find(c => c.id === assign.clubId)?.club_name;
      flash("success", `${userName} assigned to ${clubName}.`);
      setAssign({ userId: "", clubId: "" });
      fetchAll();
    }
    setAssigning(false);
  }

  return (
    <>
      <div className="page-header">
        <h2>Golf Club Management</h2>
        <p>Create golf clubs and assign clients to them.</p>
      </div>

      {feedback.msg && <Alert type={feedback.type}>{feedback.msg}</Alert>}

      <div className="two-col">
        {/* Create club */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-icon">⛳</span> Create New Golf Club
          </div>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label>Club Name</label>
              <input
                value={newClubName}
                onChange={e => setNewClubName(e.target.value)}
                placeholder="e.g. Royal Greens Golf Club"
                required
              />
            </div>
            {newClubName.trim() && (
              <p className="text-muted" style={{ marginBottom: "0.75rem", fontSize: "0.8rem" }}>
                Folder in R2: <code>
                  {newClubName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}/
                </code>
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Creating…" : "Create Club"}
            </button>
          </form>
        </div>

        {/* Assign client to club */}
        <div className="card">
          <div className="card-title">
            <span className="card-title-icon">🔗</span> Assign Client to Golf Club
          </div>
          <form onSubmit={handleAssign}>
            <div className="field">
              <label>Select Client</label>
              <select
                value={assign.userId}
                onChange={e => setAssign(a => ({ ...a, userId: e.target.value }))}
                required
              >
                <option value="">— Choose a client —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Select Golf Club</label>
              <select
                value={assign.clubId}
                onChange={e => setAssign(a => ({ ...a, clubId: e.target.value }))}
                required
              >
                <option value="">— Choose a golf club —</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.club_name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={assigning}>
              {assigning ? "Assigning…" : "Assign Client"}
            </button>
          </form>
        </div>
      </div>

      {/* All clubs table */}
      <div className="card">
        <div className="card-title">
          <span className="card-title-icon">⛳</span> All Golf Clubs ({clubs.length})
        </div>
        {clubs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⛳</div>
            <p>No golf clubs created yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Club Name</th>
                  <th>Slug</th>
                  <th>R2 Folder (in maptiles bucket)</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map(c => (
                  <tr key={c.id}>
                    <td className="td-name">{c.club_name}</td>
                    <td><code>{c.slug}</code></td>
                    <td><code>maptiles/{c.slug}/</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Current assignments table */}
      <div className="card">
        <div className="card-title">
          <span className="card-title-icon">📋</span> Current Assignments ({members.length})
        </div>
        {members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔗</div>
            <p>No assignments yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Assigned Golf Club</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td className="td-name">{m.users?.name ?? "—"}</td>
                    <td>
                      <span className="badge badge-teal">
                        {m.clubs?.club_name ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
