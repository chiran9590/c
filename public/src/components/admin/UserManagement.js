// src/components/admin/UserManagement.js
// Section 2 — shows all registered clients (name, email, phone)
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Alert from "../ui/Alert";

export default function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, phone_number, role, created_at")
      .order("created_at", { ascending: false });

    if (error) setError(error.message);
    else       setUsers(data ?? []);
    setLoading(false);
  }

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <h2>User Management</h2>
        <p>All clients registered on the platform.</p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Stats */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-card-label">Total Users</div>
          <div className="stat-card-value">{users.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Clients</div>
          <div className="stat-card-value">{users.filter(u => u.role === "client").length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Admins</div>
          <div className="stat-card-value">{users.filter(u => u.role === "admin").length}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between" style={{ marginBottom: "1rem" }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            <span className="card-title-icon">👥</span> All Users
          </div>
          <input
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              maxWidth: 240,
              padding: "0.45rem 0.8rem",
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </div>

        {loading ? (
          <p className="text-muted">Loading users…</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <p>{search ? "No users match your search." : "No users registered yet."}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td className="td-name">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone_number ?? "—"}</td>
                    <td>
                      <span className={`badge ${u.role === "admin" ? "badge-amber" : "badge-teal"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="td-mono">
                      {new Date(u.created_at).toLocaleDateString()}
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
