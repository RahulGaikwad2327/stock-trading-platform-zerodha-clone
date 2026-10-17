import React, { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth/AuthContext";
import "./AuthPages.css";

const makeNonce = () => {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};
const sha256 = async (value) => {
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export function AuthPage({ signup = false }) {
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const appleClientId = process.env.REACT_APP_APPLE_CLIENT_ID;

  const complete = (result) => {
    setUser(result.user);
    navigate("/", { replace: true });
  };
  const completeRef = useRef(complete);
  completeRef.current = complete;

  useEffect(() => {
    if (!googleClientId) return undefined;
    let nonce = makeNonce();
    let timer;
    const mountGoogleButton = () => {
      if (!window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        nonce,
        callback: async ({ credential }) => {
          setBusy(true); setError("");
          try { const { data } = await api.post("/auth/google", { credential, nonce }); completeRef.current(data); }
          catch (e) { setError(e.response?.data?.message || "Google sign-in failed. Please try again."); }
          finally { setBusy(false); nonce = makeNonce(); }
        },
      });
      const button = document.getElementById("google-signin-button");
      if (button) window.google.accounts.id.renderButton(button, { theme: "outline", size: "large", shape: "rectangular", width: 320, text: "continue_with" });
      return true;
    };
    if (!mountGoogleButton()) timer = window.setInterval(() => { if (mountGoogleButton()) window.clearInterval(timer); }, 250);
    return () => { nonce = ""; if (timer) window.clearInterval(timer); };
  }, [googleClientId]); // Google GIS is loaded by the document.

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { data } = await api.post(`/auth/${signup ? "signup" : "login"}`, form);
      complete(data);
    } catch (e) { setError(e.response?.data?.message || "Could not connect. Check the server and try again."); }
    finally { setBusy(false); }
  };

  const signInApple = async () => {
    setBusy(true); setError("");
    try {
      if (!appleClientId) throw new Error("Apple sign-in is not configured yet.");
      for (let attempt = 0; attempt < 40 && !window.AppleID?.auth; attempt += 1) await new Promise((resolve) => window.setTimeout(resolve, 100));
      if (!window.AppleID?.auth) throw new Error("Apple sign-in could not load. Please check your connection and try again.");
      const nonce = makeNonce();
      window.AppleID.auth.init({ clientId: appleClientId, scope: "name email", redirectURI: `${window.location.origin}/login`, state: makeNonce(), nonce: await sha256(nonce), usePopup: true });
      const result = await window.AppleID.auth.signIn();
      const { data } = await api.post("/auth/apple", { identityToken: result.authorization.id_token, nonce, name: result.user?.name });
      complete(data);
    } catch (e) { setError(e.response?.data?.message || e.message || "Apple sign-in failed. Please try again."); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="auth-page"><div className="auth-card">Loading your account…</div></div>;
  if (user) return <Navigate to="/" replace />;

  return <main className="auth-page">
    <section className="auth-card">
      <Link className="auth-brand" to="/">zerodha<span>.</span></Link>
      <p className="auth-eyebrow">YOUR INVESTING WORKSPACE</p>
      <h1>{signup ? "Create your account" : "Welcome back"}</h1>
      <p className="auth-subtitle">{signup ? "Set up your account to access your dashboard." : "Sign in to continue to your dashboard."}</p>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <form onSubmit={submit} className="auth-form">
        {signup && <label>Full name<input autoComplete="name" required maxLength="80" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
        <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 12 : undefined} maxLength="128" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />{signup && <small>Use at least 12 characters.</small>}</label>
        <button className="auth-primary" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Sign in with email"}</button>
      </form>
      <div className="auth-divider"><span>or continue with</span></div>
      <div className="auth-social">
        {googleClientId ? <div id="google-signin-button" /> : <button className="auth-secondary" disabled title="Set REACT_APP_GOOGLE_CLIENT_ID to enable">Google sign-in · configure client ID</button>}
        <button className="auth-secondary" onClick={signInApple} disabled={busy || !appleClientId} title={!appleClientId ? "Set REACT_APP_APPLE_CLIENT_ID to enable" : "Continue with Apple"}> &nbsp; Continue with Apple</button>
      </div>
      <p className="auth-switch">{signup ? "Already registered?" : "New to this dashboard?"} <Link to={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}</Link></p>
      <p className="auth-footnote">Demo investing dashboard. It is not a Zerodha account or brokerage service.</p>
    </section>
  </main>;
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><div className="auth-card">Loading your account…</div></div>;
  return user ? children : <Navigate to="/login" replace />;
}
