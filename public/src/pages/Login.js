// src/pages/Login.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateLogin } from "../lib/validators";
import { supabase } from "../lib/supabase";
import Alert from "../components/ui/Alert";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]         = useState({ email: "", password: "" });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(err => ({ ...err, [name]: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");

    const fieldErrors = validateLogin(form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }

    setLoading(true);
    try {
      const { user } = await login(form);

      // Fetch role to decide which dashboard to redirect to
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      navigate(profile?.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setApiError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      {/* ── Left branding panel ── */}
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <div className="auth-brand-icon">⛳</div>
            <span className="auth-brand-name">Health Maps</span>
          </div>
          <h1 className="auth-headline">
            Welcome<br /><span>back.</span>
          </h1>
          <p className="auth-sub">
            Sign in to access your golf club dashboard and health map resources.
          </p>
          <div className="auth-stats">
            <div>
              <div className="auth-stat-val">2</div>
              <div className="auth-stat-label">Roles</div>
            </div>
            <div>
              <div className="auth-stat-val">24/7</div>
              <div className="auth-stat-label">Access</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-box">
          <h2>Sign in</h2>
          <p className="auth-tagline">
            New here? <Link to="/register">Create an account →</Link>
          </p>

          {apiError && <Alert type="error">{apiError}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email" name="email" type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "error" : ""}
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
                autoComplete="current-password"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
