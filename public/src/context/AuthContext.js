// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore existing session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for login / logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data ?? null);
    setLoading(false);
  }

  // ── Register ───────────────────────────────────────────────
  async function register({ name, phone, email, password }) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Insert into our users table (trigger is a safety net; we do it explicitly too)
    const { error: insertErr } = await supabase.from("users").insert({
      id:           data.user.id,
      name:         name.trim(),
      email:        email.toLowerCase().trim(),
      phone_number: phone.trim(),
      role:         "client",
    });
    if (insertErr) throw insertErr;
  }

  // ── Login ──────────────────────────────────────────────────
  async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // ── Logout ─────────────────────────────────────────────────
  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
