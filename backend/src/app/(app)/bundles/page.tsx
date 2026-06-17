"use client";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useState } from "react";

interface Product { id: string; title: string; price: number; currency: string; imageUrl: string | null; }
interface Bundle { id: string; title: string; description: string | null; commissionPct: number; shareUrl: string | null; clickCount: number; orderCount: number; products: Product[]; instagramCaption: string | null; tiktokCaption: string | null; telegramCaption: string | null; }

export default function BundlesPage() {
  const { token, user } = useAuth();
  const [bundles,  setBundles]  = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied,   setCopied]   = useState<string | null>(null);

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [commission,  setCommission]  = useState("10");
  const [pickedIds,   setPickedIds]   = useState<string[]>([]);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  async function loadBundles() {
    const res = await fetch("/api/bundles", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setBundles(data.bundles ?? []);
    setLoading(false);
  }

  async function loadProducts() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  useEffect(() => { if (token) { loadBundles(); loadProducts(); } }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description, commissionPct: Number(commission), productIds: pickedIds }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to create bundle"); return; }
    setBundles(prev => [data.bundle, ...prev]);
    setTitle(""); setDescription(""); setCommission("10"); setPickedIds([]);
    setCreating(false);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }

  const canCreate = user?.role === "INFLUENCER" || user?.role === "ADMIN";

  if (loading) return <div style={{ color: "var(--t4)" }}>Loading bundles…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>My Bundles</h1>
          <p style={{ margin: "4px 0 0", color: "var(--t3)", fontSize: 14 }}>Curate market products and earn commissions</p>
        </div>
        {canCreate && (
          <button onClick={() => setCreating(!creating)} style={primaryBtn}>
            {creating ? "Cancel" : "+ New bundle"}
          </button>
        )}
      </div>

      {creating && (
        <div style={{ background: "var(--card)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px var(--shadow)", marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Create bundle</h2>
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Bundle title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Summer Bazaar Vibes" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What makes this bundle special…" style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div>
              <label style={labelStyle}>Commission % (what you earn per order)</label>
              <input type="number" min="1" max="50" value={commission} onChange={e => setCommission(e.target.value)} style={{ ...inputStyle, width: 100 }} />
            </div>
            <div>
              <label style={labelStyle}>Pick products ({pickedIds.length} selected)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, marginTop: 4 }}>
                {products.map(p => {
                  const on = pickedIds.includes(p.id);
                  return (
                    <div key={p.id} onClick={() => setPickedIds(prev => on ? prev.filter(x => x !== p.id) : [...prev, p.id])} style={{
                      border: `2px solid ${on ? "var(--ac)" : "var(--br)"}`,
                      borderRadius: 10, cursor: "pointer", overflow: "hidden",
                      background: on ? "var(--amber)" : "var(--card)",
                    }}>
                      {p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />} {/* eslint-disable-line @next/next/no-img-element */}
                      <div style={{ padding: "6px 8px 8px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: on ? "var(--ac)" : "var(--t1)" }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: "var(--t3)" }}>{p.price.toLocaleString()} {p.currency}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {error && <div style={errorBox}>{error}</div>}
            <button type="submit" disabled={saving || pickedIds.length === 0} style={primaryBtn}>
              {saving ? "Creating…" : "Create bundle"}
            </button>
          </form>
        </div>
      )}

      {bundles.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--t4)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 16, color: "var(--t3)" }}>No bundles yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Create your first bundle to start earning commissions</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bundles.map(b => (
            <div key={b.id} style={{ background: "var(--card)", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px var(--shadow)", cursor: "pointer" }} onClick={() => setSelected(selected?.id === b.id ? null : b)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{b.title}</div>
                  {b.description && <div style={{ color: "var(--t3)", fontSize: 14, marginTop: 4 }}>{b.description}</div>}
                  <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: "var(--t3)" }}><b style={{ color: "var(--t1)" }}>{b.clickCount}</b> clicks</div>
                    <div style={{ fontSize: 13, color: "var(--t3)" }}><b style={{ color: "var(--t1)" }}>{b.orderCount}</b> orders</div>
                    <div style={{ fontSize: 13, color: "var(--ac)", fontWeight: 600 }}>{b.commissionPct}% commission</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--t3)", marginLeft: 12 }}>{b.products.length} items</div>
              </div>

              {selected?.id === b.id && (
                <div style={{ marginTop: 16, borderTop: "1px solid var(--br)", paddingTop: 16 }} onClick={e => e.stopPropagation()}>
                  {b.shareUrl && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--t4)", marginBottom: 6 }}>SHARE LINK</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <code style={{ flex: 1, fontSize: 12, background: "var(--raised)", padding: "6px 10px", borderRadius: 6, color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.shareUrl}</code>
                        <button onClick={() => copy(b.shareUrl!, "link-" + b.id)} style={copyBtn}>{copied === "link-" + b.id ? "✓" : "Copy"}</button>
                      </div>
                    </div>
                  )}

                  {[
                    { key: "instagram", label: "Instagram", caption: b.instagramCaption, icon: "📸" },
                    { key: "tiktok",    label: "TikTok",    caption: b.tiktokCaption,    icon: "🎵" },
                    { key: "telegram",  label: "Telegram",  caption: b.telegramCaption,  icon: "💬" },
                  ].filter(p => p.caption).map(p => (
                    <div key={p.key} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--t4)", marginBottom: 6 }}>{p.icon} {p.label.toUpperCase()} CAPTION</div>
                      <div style={{ background: "var(--raised)", borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.6, color: "var(--t2)", whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto" }}>{p.caption}</div>
                      <button onClick={() => copy(p.caption!, `${p.key}-${b.id}`)} style={{ ...copyBtn, marginTop: 6 }}>{copied === `${p.key}-${b.id}` ? "✓ Copied!" : `Copy ${p.label} caption`}</button>
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {b.products.map(p => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--amber)", borderRadius: 8, padding: "4px 10px", fontSize: 12 }}>
                        {p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover" }} />} {/* eslint-disable-line @next/next/no-img-element */}
                        <span style={{ color: "var(--ac)" }}>{p.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "var(--t4)", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" };
const inputStyle: React.CSSProperties = { padding: "10px 14px", border: "1.5px solid var(--br)", borderRadius: 10, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", background: "var(--input)", color: "var(--t1)" };
const primaryBtn: React.CSSProperties = { background: "var(--ac)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const copyBtn: React.CSSProperties = { background: "var(--amber)", color: "var(--ac)", border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const errorBox: React.CSSProperties = { background: "var(--err-bg)", color: "var(--err)", borderRadius: 8, padding: "10px 14px", fontSize: 13 };
