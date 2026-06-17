"use client";
import { useAuth } from "../../components/AuthProvider";
import { useState } from "react";

const ROLE_LABEL: Record<string, { label: string; emoji: string; desc: string }> = {
  USER:       { label: "Shopper",    emoji: "👗", desc: "Browse market, build wardrobe, get AI outfit ideas" },
  INFLUENCER: { label: "Influencer", emoji: "✨", desc: "Create bundles, generate captions, earn commissions" },
  SELLER:     { label: "Seller",     emoji: "🛍️", desc: "List products, manage your shop, fulfill orders" },
  ADMIN:      { label: "Admin",      emoji: "🔑", desc: "Full access to all features" },
};

export default function ProfilePage() {
  const { user, token, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name,    setName]    = useState(user?.name ?? "");
  const [bio,     setBio]     = useState(user?.bio ?? "");
  const [handle,  setHandle]  = useState(user?.handle ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  if (!user) return null;
  const roleInfo = ROLE_LABEL[user.role] ?? { label: user.role, emoji: "👤", desc: "" };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false); setError("");
    const body: Record<string, string> = { name };
    if (bio !== undefined) body.bio = bio;
    if (user?.role === "INFLUENCER") body.handle = handle;
    const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    await refreshUser();
    setSaved(true); setEditing(false);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ margin: "0 0 28px", fontSize: 26, fontWeight: 700 }}>Profile</h1>

      <div style={{ background: "var(--card)", borderRadius: 20, padding: 28, boxShadow: "0 1px 4px var(--shadow)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> // eslint-disable-line @next/next/no-img-element
              : roleInfo.emoji}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</div>
            {user.handle && <div style={{ color: "var(--t3)", fontSize: 15 }}>{user.handle.startsWith("@") ? user.handle : `@${user.handle}`}</div>}
            <div style={{ marginTop: 6 }}>
              <span style={{ background: "var(--amber)", color: "var(--ac)", borderRadius: 20, fontSize: 12, fontWeight: 600, padding: "3px 12px" }}>
                {roleInfo.emoji} {roleInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--br)", paddingTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <Row label="Email" value={user.email} />
          <Row label="Role" value={roleInfo.desc} />
          {user.bio && <div><span style={fieldLabel}>Bio</span><div style={{ fontSize: 14, color: "var(--t2)", marginTop: 4, lineHeight: 1.6 }}>{user.bio}</div></div>}
        </div>

        <button onClick={() => { setEditing(!editing); setName(user.name); setBio(user.bio ?? ""); setHandle(user.handle ?? ""); setSaved(false); }} style={{
          marginTop: 20, width: "100%", padding: "11px 0",
          background: editing ? "var(--raised)" : "var(--amber)",
          color: editing ? "var(--t3)" : "var(--ac)",
          border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>
          {editing ? "Cancel" : "Edit profile"}
        </button>
      </div>

      {editing && (
        <div style={{ background: "var(--card)", borderRadius: 20, padding: 28, boxShadow: "0 1px 4px var(--shadow)", marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Edit profile</h2>
          <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            </div>
            {user.role === "INFLUENCER" && (
              <div>
                <label style={labelStyle}>Handle (@username)</label>
                <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="e.g. libos_style" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself…" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            {error && <div style={{ background: "var(--err-bg)", color: "var(--err)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>{error}</div>}
            {saved && <div style={{ background: "var(--ok-bg)", color: "var(--ok)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>✓ Profile updated</div>}
            <button type="submit" disabled={saving} style={primaryBtn}>{saving ? "Saving…" : "Save changes"}</button>
          </form>
        </div>
      )}

      <div style={{ background: "var(--card)", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px var(--shadow)", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "var(--t4)", marginBottom: 14 }}>QUICK LINKS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { href: "/wardrobe", label: "My Wardrobe", icon: "👗" },
            { href: "/outfits", label: "AI Outfits", icon: "✨" },
            { href: "/market", label: "Browse Market", icon: "🛍️" },
            ...(user.role === "INFLUENCER" || user.role === "ADMIN" ? [{ href: "/bundles", label: "My Bundles", icon: "📦" }] : []),
          ].map(l => (
            <a key={l.href} href={l.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, textDecoration: "none", color: "var(--t1)", fontSize: 14 }}>
              <span>{l.icon}</span>{l.label}
            </a>
          ))}
        </div>
      </div>

      <button onClick={logout} style={{ width: "100%", padding: "13px 0", background: "var(--err-bg)", color: "var(--err)", border: "1px solid var(--err)", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Sign out
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={fieldLabel}>{label}</span>
      <span style={{ fontSize: 14, color: "var(--t2)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--t4)", letterSpacing: 0.5 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--t4)", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" };
const inputStyle: React.CSSProperties = { padding: "11px 14px", border: "1.5px solid var(--br)", borderRadius: 10, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", background: "var(--input)", color: "var(--t1)" };
const primaryBtn: React.CSSProperties = { background: "var(--ac)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" };
