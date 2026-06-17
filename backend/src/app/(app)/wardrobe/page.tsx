"use client";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useState, useRef } from "react";

interface Garment {
  id: string;
  imageUrl: string | null;
  category: string;
  subcategory: string | null;
  colors: string[];
  styleTags: string[];
  season: string[];
  aiDescription: string | null;
}

export default function WardrobePage() {
  const { token } = useAuth();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Garment | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/wardrobe", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setGarments(data.garments ?? []);
    setLoading(false);
  }

  useEffect(() => { if (token) load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function upload(file: File) {
    setUploading(true);
    setError("");
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      const imageBase64 = dataUrl.slice(comma + 1);
      const mediaType = dataUrl.slice(5, comma).split(";")[0] || "image/jpeg";
      try {
        const res = await fetch("/api/wardrobe", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imageBase64, mediaType }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Upload failed"); }
        else { setGarments(prev => [data.garment, ...prev]); }
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  }

  async function del(id: string) {
    await fetch(`/api/wardrobe/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setGarments(prev => prev.filter(g => g.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  if (loading) return <div style={{ color: "var(--t4)" }}>Loading wardrobe…</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>My Wardrobe</h1>
          <p style={{ margin: "4px 0 0", color: "var(--t3)", fontSize: 14 }}>
            {garments.length} item{garments.length !== 1 ? "s" : ""} · AI-tagged automatically
          </p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={primaryBtn}>
          {uploading ? "🤖 Tagging…" : "+ Add item"}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { upload(f); e.target.value = ""; } }} />
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {uploading && (
        <div style={{ background: "var(--amber)", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ color: "var(--ac)", fontWeight: 600 }}>🤖 AI is tagging your item…</div>
          <div style={{ color: "var(--t3)", fontSize: 13 }}>This takes a few seconds</div>
        </div>
      )}

      {garments.length === 0 && !uploading && (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--t4)" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>👗</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: "var(--t3)" }}>Your wardrobe is empty</div>
          <div style={{ fontSize: 14 }}>Upload a photo and AI will auto-tag category, colors, style & season</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16 }}>
        {garments.map(g => (
          <div key={g.id} onClick={() => setSelected(g)} style={{
            background: "var(--card)", borderRadius: 14, overflow: "hidden",
            boxShadow: "0 1px 4px var(--shadow)", cursor: "pointer",
            border: `2px solid ${selected?.id === g.id ? "var(--ac)" : "transparent"}`,
          }}>
            {g.imageUrl
              ? <img src={g.imageUrl} alt={g.category} style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} /> // eslint-disable-line @next/next/no-img-element
              : <div style={{ height: 220, background: "var(--raised)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t4)", fontSize: 13 }}>No image</div>
            }
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>{g.category}</div>
              {g.subcategory && <div style={{ color: "var(--t3)", fontSize: 12, textTransform: "capitalize" }}>{g.subcategory}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {g.colors.slice(0, 3).map(c => <span key={c} style={chip}>{c}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ background: "var(--card)", borderRadius: 20, maxWidth: 480, width: "100%", overflow: "hidden" }}>
            {selected.imageUrl && <img src={selected.imageUrl} alt={selected.category} style={{ width: "100%", maxHeight: 380, objectFit: "cover", display: "block" }} />} {/* eslint-disable-line @next/next/no-img-element */}
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 700, textTransform: "capitalize", marginBottom: 4 }}>{selected.category}</div>
              {selected.subcategory && <div style={{ color: "var(--t3)", textTransform: "capitalize", marginBottom: 12 }}>{selected.subcategory}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {selected.colors.map(c => <span key={c} style={chip}>{c}</span>)}
                {selected.styleTags.map(s => <span key={s} style={{ ...chip, background: "var(--ok-bg)", color: "var(--ok)" }}>{s}</span>)}
                {selected.season.map(s => <span key={s} style={{ ...chip, background: "#eff6ff", color: "#2563eb" }}>{s}</span>)}
              </div>
              {selected.aiDescription && <p style={{ color: "var(--t2)", fontSize: 14, lineHeight: 1.6, margin: "0 0 16px" }}>{selected.aiDescription}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: "10px 0", background: "var(--raised)", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, color: "var(--t1)" }}>
                  Close
                </button>
                <button onClick={() => del(selected.id)} style={{ flex: 1, padding: "10px 0", background: "var(--err-bg)", color: "var(--err)", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = { background: "var(--ac)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const chip: React.CSSProperties = { background: "var(--amber)", color: "var(--ac)", borderRadius: 6, fontSize: 11, padding: "2px 8px", fontWeight: 500 };
const errorBox: React.CSSProperties = { background: "var(--err-bg)", color: "var(--err)", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 };
