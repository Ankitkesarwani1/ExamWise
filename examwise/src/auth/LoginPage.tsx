import { useState } from "react";
import { supabase } from "../lib/supabase";

const allowed = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? "").trim().toLowerCase();

/** Map Supabase raw error messages / codes → friendly human text */
function friendlyError(err: unknown): { text: string; isRateLimit?: boolean } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("over_email_send_rate_limit") || lower.includes("email rate limit"))
    return {
      text: "Supabase has hit its email limit (2/hour on the free plan). See the fix banner below.",
      isRateLimit: true,
    };
  if (lower.includes("user already registered") || lower.includes("already been registered"))
    return { text: "An account with this email already exists. Try signing in instead." };
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials"))
    return { text: "Incorrect email or password. Double-check and try again." };
  if (lower.includes("email not confirmed"))
    return { text: "Please confirm your email first — check your inbox (or ask admin to disable email confirmation)." };
  if (lower.includes("password should be"))
    return { text: "Password must be at least 8 characters." };
  if (lower.includes("unable to validate email"))
    return { text: "Email address is invalid or not accepted. Try a different address." };

  return { text: raw || "Something went wrong. Please try again." };
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string; isRateLimit?: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    // client-side domain guard (only runs if VITE_ALLOWED_EMAIL_DOMAIN is set)
    if (mode !== "reset" && allowed && !email.toLowerCase().endsWith("@" + allowed)) {
      return setMsg({ type: "error", text: `Use your college email ending in @${allowed}.` });
    }

    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // success → AuthProvider session state change triggers redirect automatically

      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name.trim() || email.split("@")[0] },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.session) {
          // Email confirmation is DISABLED in Supabase → user is immediately signed in.
          // AuthProvider picks up the session — no extra action needed.
          return;
        }
        // Email confirmation is enabled → ask user to check inbox.
        setMsg({ type: "ok", text: "Account created! Check your inbox and confirm your email, then sign in." });

      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMsg({ type: "ok", text: "Password reset link sent — check your inbox." });
      }
    } catch (err) {
      const { text, isRateLimit } = friendlyError(err);
      setMsg({ type: "error", text, isRateLimit });
    } finally {
      setBusy(false);
    }
  }

  function switchMode(m: typeof mode) {
    setMode(m);
    setMsg(null);
    setEmail("");
    setPassword("");
    setName("");
  }

  /* ── styles ── */
  const wrap: React.CSSProperties = {
    minHeight: "100vh", display: "grid", placeItems: "center",
    background: "linear-gradient(135deg,#f0f4ff 0%,#f5f7fb 100%)", padding: 16,
  };
  const card: React.CSSProperties = {
    width: "100%", maxWidth: 420, background: "#fff", padding: "36px 32px",
    borderRadius: 18, boxShadow: "0 12px 48px rgba(20,30,80,.10)",
  };
  const field: React.CSSProperties = {
    display: "block", width: "100%", padding: "11px 14px",
    border: "1.5px solid #d9dee8", borderRadius: 10, fontSize: 15,
    marginTop: 6, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color .15s",
  };
  const label: React.CSSProperties = { display: "block", marginTop: 16, fontSize: 14, fontWeight: 500, color: "#344054" };
  const btn: React.CSSProperties = {
    width: "100%", marginTop: 22, padding: "13px 0", border: 0,
    borderRadius: 10, background: "#4169e1", color: "#fff",
    fontSize: 15, fontWeight: 600, cursor: busy ? "default" : "pointer",
    opacity: busy ? 0.7 : 1, transition: "opacity .15s",
  };
  const link: React.CSSProperties = { color: "#4169e1", textDecoration: "none", fontWeight: 500 };
  const alertBase: React.CSSProperties = {
    marginTop: 14, padding: "10px 14px", borderRadius: 9,
    fontSize: 13.5, lineHeight: 1.5,
  };

  return (
    <div style={wrap}>
      <form onSubmit={submit} style={card} noValidate>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#4169e1", display: "grid", placeItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M8 7h8M8 11h6"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            ExamWise <span style={{ color: "#6d4cff" }}>AI</span>
          </h1>
        </div>
        <p style={{ color: "#667085", margin: "6px 0 24px", fontSize: 14 }}>
          {mode === "signin" ? "Welcome back — sign in to continue." : mode === "signup" ? "Create your free student account." : "We'll send a reset link to your email."}
        </p>

        {/* Fields */}
        {mode === "signup" && (
          <label style={label}>
            Full name
            <input style={field} value={name} onChange={e => setName(e.target.value)}
              placeholder="Ankit Sharma" autoComplete="name" required />
          </label>
        )}
        <label style={{ ...label, marginTop: mode === "signup" ? 16 : 0 }}>
          Email
          <input style={field} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={allowed ? `you@${allowed}` : "you@gmail.com"}
            autoComplete="email" required />
        </label>
        {mode !== "reset" && (
          <label style={label}>
            Password
            <input style={field} type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required />
          </label>
        )}

        {/* Status message */}
        {msg && (
          <div role="alert" style={{
            ...alertBase,
            background: msg.type === "error" ? "#fff2f2" : "#f0fdf4",
            border: `1px solid ${msg.type === "error" ? "#fca5a5" : "#86efac"}`,
            color: msg.type === "error" ? "#b91c1c" : "#166534",
          }}>
            {msg.text}
          </div>
        )}

        {/* Rate-limit help banner */}
        {msg?.isRateLimit && (
          <div style={{
            marginTop: 12, padding: "14px 16px", borderRadius: 10,
            background: "#fffbeb", border: "1px solid #fbbf24", fontSize: 13,
          }}>
            <strong style={{ color: "#92400e" }}>⚡ Quick fix (30 seconds):</strong>
            <ol style={{ margin: "8px 0 0", paddingLeft: 18, color: "#78350f", lineHeight: 1.8 }}>
              <li>Open <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: "#4169e1" }}>supabase.com/dashboard</a></li>
              <li>Your project → <strong>Authentication</strong></li>
              <li>Click <strong>Settings</strong> (or <strong>Providers → Email</strong>)</li>
              <li>Turn <strong>OFF</strong> "Confirm email"</li>
              <li>Click <strong>Save</strong> → try signing up again ✅</li>
            </ol>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={busy} style={btn}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>

        {/* Mode switcher */}
        <div style={{ marginTop: 18, fontSize: 13.5, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          {mode === "signin" ? (
            <>
              <a href="#" style={link} onClick={e => { e.preventDefault(); switchMode("signup"); }}>Create account</a>
              <a href="#" style={link} onClick={e => { e.preventDefault(); switchMode("reset"); }}>Forgot password?</a>
            </>
          ) : (
            <a href="#" style={link} onClick={e => { e.preventDefault(); switchMode("signin"); }}>← Back to sign in</a>
          )}
        </div>
      </form>
    </div>
  );
}
