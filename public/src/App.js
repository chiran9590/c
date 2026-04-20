// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute   from "./components/ProtectedRoute";

import Login           from "./pages/Login";
import Register        from "./pages/Register";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard  from "./pages/AdminDashboard";

/*
  ROUTING FLOW
  ──────────────────────────────────────────────
  /              → /login
  /register      → Register  (public)
  /login         → Login     (public)
  /dashboard     → Client Dashboard  (role: client)
  /admin         → Admin Dashboard   (role: admin)
  *              → /login
*/
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
