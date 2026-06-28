"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed");
        setLoading(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  const input: CSSProperties = {
    width: "100%",
    height: "44px",
    background: "#121212",
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "0 14px",
    color: "#fff",
    fontSize: "13.5px",
    outline: "none",
  };
  const label: CSSProperties = { display: "block", fontSize: "12px", fontWeight: 600, color: "#A0A0A0", marginBottom: "7px" };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        background: "#121212",
        fontFamily: "var(--font-cairo), sans-serif",
        color: "#F2F2F2",
      }}
    >
      <form onSubmit={submit} style={{ width: "380px", maxWidth: "92vw", background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "16px", padding: "30px 28px", boxShadow: "0 24px 70px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "24px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "linear-gradient(135deg,#1A3FD4,#2E8BFF 55%,#00C2FF)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(46,139,255,.35)" }}>
            <div style={{ width: "15px", height: "15px", borderRadius: "50%", border: "2.5px solid #fff" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-.3px", lineHeight: 1 }}>Golfeto</div>
            <div style={{ fontSize: "10px", color: "#6E6E6E", fontWeight: 600, letterSpacing: ".4px", marginTop: "3px" }}>ADMIN PANEL</div>
          </div>
        </div>

        <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>Sign in</div>
        <div style={{ fontSize: "12px", color: "#6E6E6E", marginBottom: "22px" }}>Use your authorized admin account.</div>

        <div style={{ marginBottom: "16px" }}>
          <label style={label}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} autoComplete="email" required />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={label}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={input} autoComplete="current-password" required />
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.4)", borderRadius: "10px", padding: "10px 13px", marginBottom: "16px", fontSize: "12.5px", color: "#FCA5A5" }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", height: "46px", borderRadius: "11px", border: "none", background: "linear-gradient(135deg,#1A3FD4,#2E8BFF 60%,#00C2FF)", color: "#fff", fontWeight: 700, fontSize: "13.5px", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 14px rgba(46,139,255,.3)" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
