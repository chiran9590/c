// src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/ui/Sidebar";
import SectionOne     from "../components/admin/SectionOne";
import UserManagement from "../components/admin/UserManagement";
import ClubManagement from "../components/admin/ClubManagement";
import FileUpload     from "../components/admin/FileUpload";

const NAV = [
  { id: "section1", icon: "🚧", label: "Section 1"        },
  { id: "users",    icon: "👥", label: "User Management"  },
  { id: "clubs",    icon: "⛳", label: "Golf Club Management"  },
  { id: "upload",   icon: "⛳", label: "Upload Tiles"     },
];

const TITLES = {
  section1: "Section 1",
  users:    "User Management",
  clubs:    "Golf Club Management",
  upload:   "Upload Tiles",
};

export default function AdminDashboard() {
  const [section, setSection] = useState("section1");
  const [stats, setStats]     = useState({ users: 0, clubs: 0, uploads: 0 });

  useEffect(() => {
    // Fetch live counts for the stat bar
    Promise.all([
      supabase.from("users").select("id",    { count: "exact", head: true }),
      supabase.from("clubs").select("id",    { count: "exact", head: true }),
      supabase.from("uploads").select("id",  { count: "exact", head: true }),
    ]).then(([u, c, up]) => {
      setStats({
        users:   u.count  ?? 0,
        clubs:   c.count  ?? 0,
        uploads: up.count ?? 0,
      });
    });
  }, []);

  // Attach live counts to sidebar badges
  const nav = NAV.map(n => {
    if (n.id === "users")  return { ...n, badge: stats.users  || undefined };
    if (n.id === "clubs")  return { ...n, badge: stats.clubs  || undefined };
    if (n.id === "upload") return { ...n, badge: stats.uploads || undefined };
    return n;
  });

  return (
    <div className="dash-shell">
      <Sidebar navItems={nav} activeSection={section} onNavigate={setSection} />

      <div className="dash-main">
        <header className="dash-topbar">
          <span className="dash-topbar-title">{TITLES[section]}</span>
          <div className="dash-topbar-right">
            <span className="badge badge-amber">Admin</span>
          </div>
        </header>

        <main className="dash-content">
          {/* Quick-glance stat bar — always visible */}
          <div className="stat-row" style={{ marginBottom: "1.75rem" }}>
            {[
              { label: "Total Users",  value: stats.users,   sub: "registered"  },
              { label: "Golf Clubs",   value: stats.clubs,   sub: "created"     },
              { label: "Tile Uploads", value: stats.uploads, sub: "files logged" },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{s.value}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {section === "section1" && <SectionOne />}
          {section === "users"    && <UserManagement />}
          {section === "clubs"    && <ClubManagement />}
          {section === "upload"   && <FileUpload />}
        </main>
      </div>
    </div>
  );
}
