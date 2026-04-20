// src/pages/ClientDashboard.js
// Client sees their assigned golf club after login
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/ui/Sidebar";

const NAV = [
  { id: "overview", icon: "⊞", label: "Overview"      },
  { id: "club",     icon: "⛳", label: "Golf Club"  },
  { id: "profile",  icon: "👤", label: "Profile"       },
];

const TITLES = {
  overview: "Overview",
  club:     "Golf Club",
  profile:  "Profile",
};

export default function ClientDashboard() {
  const { profile } = useAuth();
  const [section,     setSection]     = useState("overview");
  const [club,        setClub]        = useState(null);
  const [loadingClub, setLoadingClub] = useState(true);

  useEffect(() => {
    if (!profile) return;

    supabase
      .from("user_club_mapping")
      .select("clubs(id, club_name, slug)")
      .eq("user_id", profile.id)
      .single()
      .then(({ data }) => {
        setClub(data?.clubs ?? null);
        setLoadingClub(false);
      });
  }, [profile]);

  return (
    <div className="dash-shell">
      <Sidebar navItems={NAV} activeSection={section} onNavigate={setSection} />

      <div className="dash-main">
        <header className="dash-topbar">
          <span className="dash-topbar-title">{TITLES[section]}</span>
          <div className="dash-topbar-right">
            <span className="badge badge-teal">Client</span>
          </div>
        </header>

        <main className="dash-content">
          {section === "overview" && (
            <OverviewSection profile={profile} club={club} loading={loadingClub} />
          )}
          {section === "club" && (
            <ClubSection club={club} loading={loadingClub} />
          )}
          {section === "profile" && (
            <ProfileSection profile={profile} />
          )}
        </main>
      </div>
    </div>
  );
}

/* ── Overview ──────────────────────────────────────────────── */
function OverviewSection({ profile, club, loading }) {
  return (
    <>
      <div className="page-header">
        <h2>Welcome back, {profile?.name?.split(" ")[0]} 👋</h2>
        <p>Here's a summary of your Health Maps account.</p>
      </div>

      {loading ? (
        <div className="card">
          <p className="text-muted">Loading your golf club…</p>
        </div>
      ) : club ? (
        <div className="club-banner">
          <div className="club-banner-icon">⛳</div>
          <div>
            <div className="club-banner-label">Assigned Golf Club</div>
            <div className="club-banner-name">{club.club_name}</div>
          </div>
        </div>
      ) : (
        <div className="card">
          <p className="text-muted">
            ⏳ You have not been assigned to a golf club yet.
            Please contact your administrator.
          </p>
        </div>
      )}

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-card-label">Golf Club</div>
          <div className="stat-card-value">{loading ? "—" : club ? "1" : "0"}</div>
          <div className="stat-card-sub">{club?.club_name ?? "Not assigned"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Account Role</div>
          <div className="stat-card-value">Client</div>
          <div className="stat-card-sub">Standard access</div>
        </div>
      </div>
    </>
  );
}

/* ── My Golf Club ──────────────────────────────────────────── */
function ClubSection({ club, loading }) {
  if (loading) {
    return (
      <div className="card">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⛳</div>
        <p>
          You haven't been assigned to a golf club yet.<br />
          Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>My Golf Club</h2>
        <p>Details about your assigned golf club.</p>
      </div>

      <div className="club-banner">
        <div className="club-banner-icon">⛳</div>
        <div>
          <div className="club-banner-label">Assigned Golf Club</div>
          <div className="club-banner-name">{club.club_name}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span className="card-title-icon">ℹ</span> Club Details
        </div>
        <table style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td className="text-muted" style={{ width: 160 }}>Golf Club Name</td>
              <td className="td-name">{club.club_name}</td>
            </tr>
            <tr>
              <td className="text-muted">Club ID</td>
              <td><code>{club.id}</code></td>
            </tr>
            <tr>
              <td className="text-muted">R2 Folder</td>
              <td><code>maptiles/{club.slug}/</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Profile ───────────────────────────────────────────────── */
function ProfileSection({ profile }) {
  return (
    <>
      <div className="page-header">
        <h2>My Profile</h2>
        <p>Your account information.</p>
      </div>

      <div className="card">
        <div className="card-title">
          <span className="card-title-icon">👤</span> Account Details
        </div>
        <table style={{ width: "100%" }}>
          <tbody>
            {[
              ["Full Name",     profile?.name],
              ["Email",         profile?.email],
              ["Phone Number",  profile?.phone_number],
              ["Role",          profile?.role],
            ].map(([label, val]) => (
              <tr key={label}>
                <td className="text-muted" style={{ width: 160 }}>{label}</td>
                <td className="td-name">{val ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
