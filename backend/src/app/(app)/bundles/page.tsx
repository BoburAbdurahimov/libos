"use client";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string | null;
  category: string;
  shop: { name: string; city: string };
}

interface BundleItem {
  product: Product & { shop: { name: string; city: string } };
  note: string | null;
}

interface Bundle {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  shareUrl: string;
  commissionPct: number;
  active: boolean;
  captionIg: string | null;
  captionTiktok: string | null;
  captionTg: string | null;
  hashtags: string[];
  items: BundleItem[];
  _count: { clicks: number; orders: number };
}

type Tab = "list" | "create";
type Platform = "instagram" | "tiktok" | "telegram";

export default function BundlesPage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<Tab>("list");
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [captionTab, setCaptionTab] = useState<Platform>("instagram");
  const [generatingCaption, setGeneratingCaption] = useState(false);

  const [form, setForm] = useState({ title: "", description: "", commissionPct: 10 });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

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

  useEffect(() => {
    if (token) { loadBundles(); loadProducts(); }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (user && user.role !== "INFLUENCER" && user.role !== "ADMIN") {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#a8a29e" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "#78716c" }}>Influencer feature</div>
        <div style={{ fontSize: 14 }}>Bundles are available for influencer accounts.</div>
      </div>
    );
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (selectedProductIds.length === 0) { setCreateError("Select at least one product"); return; }
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, productIds: selectedProductIds }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error ?? "Failed to create"); return; }
    setBundles(prev => [data.bundle, ...prev]);
    setTab("list");
    setForm({ title: "", description: "", commissionPct: 10 });
    setSelectedProductIds([]);
  }

  async function generateCaption(bundleId: string) {
    setGeneratingCaption(true);
    const res = await fetch(`/api/bundles/${bundleId}/caption`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setGeneratingCaption(false);
    if (res.ok && selected) {
      const updated: Bundle = {
        ...selected,
        captionIg: data.captions.instagram,
        captionTiktok: data.captions.tiktok,
        captionTg: data.captions.telegram,
        hashtags: data.captions.hashtags,
      };
      setSelected(updated);
      setBundles(prev => prev.map(b => b.id === bundleId ? updated : b));
    }
  }

  function toggleProduct(id: string) {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const captionText = selected
    ? (captionTab === "instagram" ? selected.captionIg : captionTab === "tiktok" ? selected.captionTiktok : selected.captionTg)
    : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>My Bundles</h1>
          <p style={{ margin: "4px 0 0", color: "#78716c", fontSize: 14 }}>Curate looks, generate captions, track earnings</p>
        </div>
        <button onClick={() => setTab(tab === "create" ? "list" : "create")} style={primaryBtn}>
          {tab === "create" ? "← Back to bundles" : "+ New bundle"}
        </button>
      </div>

      {tab === "create" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 18 }}>Create a new bundle</h2>
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={label}>Bundle title</label>
              <input
                placeholder="e.g. Summer Bazaar Look"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={label}>Description (optional)</label>
              <textarea
                placeholder="Tell your followers about this look…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <div>
              <label style={label}>Commission % (0–50)</label>
              <input
                type="number" min={0} max={50}
                value={form.commissionPct}
                onChange={e => setForm(f => ({ ...f, commissionPct: Number(e.target.value) }))}
                style={{ ...inputStyle, width: 100 }}
              />
            </div>

            <div>
              <label style={label}>Select products ({selectedProductIds.length} selected)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginTop: 6 }}>
                {products.map(p => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      style={{
                        borderRadius: 12, overflow: "hidden", cursor: "pointer",
                        border: `2px solid ${isSelected ? "#b45309" : "#e7e5e4"}`,
                        background: isSelected ? "#fef3c7" : "#fff",
                      }}
                    >
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ height: 120, background: "#f5f5f4", display: "flex", alignItems: "center", justifyContent: "center", color: "#a8a29e", fontSize: 12 }}>No image</div>
                      )}
                      <div style={{ padding: "8px 10px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: "#b45309", fontWeight: 600 }}>{p.price.toLocaleString()} {p.currency}</div>
                        <div style={{ fontSize: 10, color: "#a8a29e" }}>{p.shop.name}</div>
                      </div>
                      {isSelected && <div style={{ background: "#b45309", color: "#fff", textAlign: "center", fontSize: 11, padding: "3px 0" }}>✓ Selected</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {createError && <div style={errorBox}>{createError}</div>}

            <button type="submit" disabled={creating} style={{ ...primaryBtn, padding: "12px 0", fontSize: 15 }}>
              {creating ? "Creating…" : "Create bundle"}
            </button>
          </form>
        </div>
      )}

      {tab === "list" && (
        <div>
          {loading ? (
            <div style={{ color: "#a8a29e" }}>Loading bundles…</div>
          ) : bundles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#a8a29e" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#78716c", marginBottom: 8 }}>No bundles yet</div>
              <div style={{ fontSize: 14 }}>Create your first bundle to start earning commissions</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {bundles.map(b => (
                <div key={b.id} style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{b.title}</div>
                      {b.description && <div style={{ color: "#78716c", fontSize: 14, marginBottom: 8 }}>{b.description}</div>}
                      <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#78716c" }}>
                        <span>📊 {b._count.clicks} clicks</span>
                        <span>🛍️ {b._count.orders} orders</span>
                        <span>💰 {b.commissionPct}% commission</span>
                        <span>🔗 {b.items.length} items</span>
                      </div>
                    </div>
                    <button onClick={() => { setSelected(b); setCaptionTab("instagram"); }} style={{
                      background: "#fef3c7", color: "#b45309", border: "none",
                      borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>
                      Manage →
                    </button>
                  </div>

                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#faf8f5", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a href={b.shareUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#b45309", textDecoration: "none", fontFamily: "monospace" }}>
                      {b.shareUrl}
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(b.shareUrl)}
                      style={{ background: "none", border: "1px solid #e7e5e4", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#78716c" }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div style={{ background: "#fff", borderRadius: 20, maxWidth: 600, width: "100%", maxHeight: "90vh", overflow: "auto", padding: 28 }}>
            <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 4 }}>{selected.title}</div>
            <div style={{ display: "flex", gap: 20, fontSize: 14, color: "#78716c", marginBottom: 20 }}>
              <span>📊 {selected._count.clicks} clicks</span>
              <span>🛍️ {selected._count.orders} orders</span>
              <span>💰 {selected.commissionPct}%</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#a8a29e", marginBottom: 10 }}>PRODUCTS IN BUNDLE</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {selected.items.map(item => (
                  <div key={item.product.id} style={{ background: "#faf8f5", borderRadius: 10, overflow: "hidden", width: 120 }}>
                    {item.product.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.imageUrl} alt={item.product.title} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                    )}
                    <div style={{ padding: "6px 8px" }}>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>{item.product.title}</div>
                      <div style={{ fontSize: 11, color: "#b45309" }}>{item.product.price.toLocaleString()} {item.product.currency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#a8a29e" }}>AI CAPTIONS</div>
                <button
                  onClick={() => generateCaption(selected.id)}
                  disabled={generatingCaption}
                  style={{
                    background: "#fef3c7", color: "#b45309", border: "none",
                    borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: generatingCaption ? "not-allowed" : "pointer",
                  }}
                >
                  {generatingCaption ? "Generating…" : selected.captionIg ? "Regenerate ↺" : "✨ Generate captions"}
                </button>
              </div>

              {selected.captionIg && (
                <>
                  <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                    {(["instagram", "tiktok", "telegram"] as Platform[]).map(p => (
                      <button key={p} onClick={() => setCaptionTab(p)} style={{
                        padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
                        background: captionTab === p ? "#b45309" : "#faf8f5",
                        color: captionTab === p ? "#fff" : "#78716c",
                        fontWeight: captionTab === p ? 600 : 400, textTransform: "capitalize",
                      }}>
                        {p === "instagram" ? "📸" : p === "tiktok" ? "🎵" : "✈️"} {p}
                      </button>
                    ))}
                  </div>
                  <div style={{ background: "#faf8f5", borderRadius: 12, padding: 16, fontSize: 14, lineHeight: 1.7, color: "#1c1917", whiteSpace: "pre-wrap" }}>
                    {captionText}
                  </div>
                  {selected.hashtags.length > 0 && (
                    <div style={{ marginTop: 10, color: "#2563eb", fontSize: 13 }}>
                      {selected.hashtags.join(" ")}
                    </div>
                  )}
                  <button
                    onClick={() => navigator.clipboard.writeText(`${captionText}\n\n${selected.hashtags.join(" ")}`)}
                    style={{ marginTop: 10, background: "none", border: "1px solid #e7e5e4", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", color: "#78716c" }}
                  >
                    Copy caption
                  </button>
                </>
              )}
            </div>

            <button onClick={() => setSelected(null)} style={{ width: "100%", padding: "12px 0", background: "#b45309", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  background: "#b45309", color: "#fff", border: "none", borderRadius: 10,
  padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  padding: "11px 14px", border: "1.5px solid #e7e5e4", borderRadius: 10,
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  background: "#faf8f5", color: "#1c1917",
};
const label: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#a8a29e",
  letterSpacing: 1, marginBottom: 6, textTransform: "uppercase",
};
const errorBox: React.CSSProperties = {
  background: "#fef2f2", color: "#dc2626", borderRadius: 8,
  padding: "10px 14px", fontSize: 13,
};
