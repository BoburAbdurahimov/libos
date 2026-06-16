"use client";
import { useAuth } from "../../components/AuthProvider";
import { useState } from "react";

const ROLE_LABEL: Record<string, { label: string; emoji: string; desc: string }> = {
  USER: { label: "Shopper", emoji: "👗", desc: "Browse market, build wardrobe, get AI outfit ideas" },
  INFLUENCER: { label: "Influencer", emoji: "✨", desc: "Create bundles, generate captions, earn commissions" },
  SELLER: { label: "Seller", emoji: "🛍️", desc: "List products, manage your shop, fulfill orders" },
  ADMIN: { label: "Admin", emoji: "🔑", desc: "Full access to all features" },
};

export default function ProfilePage() {
  const { user, token, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const roleInfo = ROLE_LABEL[user.role] ?? { label: user.role, emoji: "👤", desc: "" };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    const body: Record<string, string> = { name };
    if (bio !== undefined) body.bio = bio;
    if (user?.role === "INFLUENCER") body.handle = handle;
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    await refreshUser();
    setSaved(true);
    setEditing(false);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ margin: "0 0 28px", fontSize: 26, fontWeight: 700 }}>Profile</h1>

      <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, flexShrink: 0,
          }}>
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : roleInfo.emoji}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</div>
            {user.handle && (
              <div style={{ color: "#78716c", fontSize: 15 }}>
                {user.handle.startsWith("@") ? user.handle : `@${user.handle}`}
              </div>
            )}
            <div style={{ marginTop: 6 }}>
              <span style={{
                background: "#fef3c7", color: "#b45309",
                borderRadius: 20, fontSize: 12, fontWeight: 600,
                padding: "3px 12px",
              }}>
                {roleInfo.emoji} {roleInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #f5f5f4", paddingTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={fieldLabel}>Email</span>
            <span style={{ fontSize: 14 }}>{user.email}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={fieldLabel}>Role</span>
            <span style={{ fontSize: 14 }}>{roleInfo.desc}</span>
          </div>
          {user.bio && (
            <div>
              <span style={fieldLabel}>Bio</span>
              <div style={{ fontSize: 14, color: "#57534e", marginTop: 4, lineHeight: 1.6 }}>{user.bio}</div>
            </div>
          )}
        </div>

        <button
          onClick={() => { setEditing(!editing); setName(user.name); setBio(user.bio ?? ""); setHandle(user.handle ?? ""); setSaved(false); }}
          style={{ marginTop: 20, width: "100%", padding: "11px 0", background: editing ? "#f5f5f4" : "#fef3c7", color: editing ? "#78716c" : "#b45309", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          {editing ? "Cancel" : "Edit profile"}
        </button>
      </div>

      {editing && (
        <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 16 }}>
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
            {error && <div style={errorBox}>{error}</div>}
            {saved && <div style={{ background: "#f0fdf4", color: "#16a34a", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>✓ Profile updated</div>}
            <button type="submit" disabled={saving} style={primaryBtn}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#a8a29e", marginBottom: 14 }}>QUICK LINKS</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { href: "/wardrobe", label: "My Wardrobe", icon: "👗" },
            { href: "/outfits", label: "AI Outfits", icon: "✨" },
            { href: "/market", label: "Browse Market", icon: "🛍️" },
            ...(user.role === "INFLUENCER" || user.role === "ADMIN" ? [{ href: "/bundles", label: "My Bundles", icon: "📦" }] : []),
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, textDecoration: "none", color: "#1c1917", fontSize: 14,
            }}>
              <span>{l.icon}</span>{l.label}
            </a>
          ))}
        </div>
      </div>

      <button
        onClick={logout}
        style={{ width: "100%", padding: "13px 0", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
      >
        Sign out
      </button>
    </div>
  );
}

const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "#a8a29e", letterSpacing: 0.5 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#a8a29e", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" };
const inputStyle: React.CSSProperties = {
  padding: "11px 14px", border: "1.5px solid #e7e5e4", borderRadius: 10,
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  background: "#faf8f5", color: "#1c1917",
};
const primaryBtn: React.CSSProperties = {
  background: "#b45309", color: "#fff", border: "none", borderRadius: 10,
  padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const errorBox: React.CSSProperties = {
  background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13,
};
