"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";

type Mode = "login" | "register";
type Role = "USER" | "INFLUENCER" | "SELLER";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password, role };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      await login(data.token);
      router.push("/wardrobe");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(email: string) { setMode("login"); setEmail(email); setPassword("password123"); }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, letterSpacing: 3, color: "var(--t4)", marginBottom: 6 }}>WELCOME TO</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "var(--ac)", letterSpacing: 2 }}>LIBOS</div>
          <div style={{ color: "var(--t3)", fontSize: 15, marginTop: 6 }}>AI stylist + local market fashion</div>
        </div>

        <div style={{ background: "var(--card)", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px var(--shadow-md)" }}>
          <div style={{ display: "flex", background: "var(--raised)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "9px 0", border: "none", borderRadius: 9, cursor: "pointer",
                fontSize: 14, fontWeight: 500,
                background: mode === m ? "var(--card)" : "transparent",
                color: mode === m ? "var(--t1)" : "var(--t3)",
                boxShadow: mode === m ? "0 1px 4px var(--shadow)" : "none",
              }}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            )}
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />

            {mode === "register" && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t4)", letterSpacing: 1, marginBottom: 8 }}>I AM A</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {([
                    { value: "USER", label: "Shopper", icon: "👗" },
                    { value: "INFLUENCER", label: "Influencer", icon: "✨" },
                    { value: "SELLER", label: "Seller", icon: "🛍️" },
                  ] as { value: Role; label: string; icon: string }[]).map(r => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)} style={{
                      flex: 1, padding: "10px 6px",
                      border: `2px solid ${role === r.value ? "var(--ac)" : "var(--br)"}`,
                      borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 500,
                      background: role === r.value ? "var(--amber)" : "var(--card)",
                      color: role === r.value ? "var(--ac)" : "var(--t3)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}>
                      <span style={{ fontSize: 18 }}>{r.icon}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={{ color: "var(--err)", fontSize: 13, padding: "10px 12px", background: "var(--err-bg)", borderRadius: 8, border: "1px solid var(--err)" }}>{error}</div>}

            <button type="submit" disabled={loading} style={{
              padding: "13px 0", background: loading ? "var(--t4)" : "var(--ac)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
            }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 16, padding: 16, background: "var(--card)", borderRadius: 14, boxShadow: "0 1px 4px var(--shadow)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t4)", letterSpacing: 1, marginBottom: 10 }}>DEMO ACCOUNTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { email: "user@libos.uz", label: "Shopper", icon: "👗" },
              { email: "influencer@libos.uz", label: "Influencer", icon: "✨" },
              { email: "seller@libos.uz", label: "Seller", icon: "🛍️" },
            ].map(d => (
              <button key={d.email} onClick={() => fillDemo(d.email)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", background: "var(--raised)", border: "1px solid var(--br)",
                borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--t1)",
              }}>
                <span>{d.icon}</span>
                <span style={{ fontWeight: 500 }}>{d.label}</span>
                <span style={{ color: "var(--t4)", fontSize: 12 }}>{d.email}</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "var(--t4)", marginTop: 8 }}>Password: password123 for all demo accounts</div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px 14px", border: "1.5px solid var(--br)", borderRadius: 10,
  fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box",
  background: "var(--input)", color: "var(--t1)",
};
