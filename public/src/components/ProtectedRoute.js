// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner" />
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // Wrong role → redirect to correct dashboard
  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return children;
}
