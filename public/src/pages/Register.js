// src/pages/Register.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { validateRegister } from "../lib/validators";
import Alert from "../components/ui/Alert";

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]         = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
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

    const fieldErrors = validateRegister(form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }

    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function Field({ name, label, type = "text", placeholder }) {
    return (
      <div className="field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name} name={name} type={type}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          className={errors[name] ? "error" : ""}
          autoComplete={type === "password" ? "new-password" : "on"}
        />
        {errors[name] && <span className="field-error">{errors[name]}</span>}
      </div>
    );
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
            Map your<br /><span>golf journey.</span>
          </h1>
          <p className="auth-sub">
            Register to get access to your assigned golf club's
            health map tiles and resources.
          </p>
          <div className="auth-stats">
            <div>
              <div className="auth-stat-val">⛳</div>
              <div className="auth-stat-label">Golf Clubs</div>
            </div>
            <div>
              <div className="auth-stat-val">100%</div>
              <div className="auth-stat-label">Secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <div className="auth-form-box">
          <h2>Create account</h2>
          <p className="auth-tagline">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>

          {apiError && <Alert type="error">{apiError}</Alert>}

          <form onSubmit={handleSubmit} noValidate>
            <Field name="name"     label="Full Name"         placeholder="John Doe" />
            <Field name="phone"    label="Phone Number"      placeholder="+91 98765 43210" />
            <Field name="email"    label="Email Address"     placeholder="john@example.com" type="email" />
            <Field name="password" label="Password"          placeholder="Min 6 characters" type="password" />
            <Field name="confirm"  label="Confirm Password"  placeholder="Re-enter password" type="password" />

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
