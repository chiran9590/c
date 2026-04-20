// src/components/ui/Sidebar.js
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ navItems, activeSection, onNavigate }) {
  const { profile, logout } = useAuth();

  const initials = profile?.name
    ? profile.name.split(" ").map(w => w[0]).slice(0, 2).join("")
    : "?";

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⛳</div>
        <span className="sidebar-logo-text">Health Maps</span>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge != null && (
              <span className="nav-item-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile?.name ?? "User"}</div>
            <div className="sidebar-user-role">{profile?.role ?? ""}</div>
          </div>
        </div>
        <button className="nav-item" onClick={logout}>
          <span className="nav-item-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
