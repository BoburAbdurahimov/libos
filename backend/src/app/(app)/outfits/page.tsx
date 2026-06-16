"use client";
import { useAuth } from "../../components/AuthProvider";
import { useState } from "react";

type Occasion = "casual" | "work" | "date" | "formal" | "sport";
type Weather = "cold" | "mild" | "warm" | "hot";

interface Garment {
  id: string;
  category: string;
  colors: string[];
  imageUrl: string | null;
}

interface OutfitSuggestion {
  name: string;
  occasion: string;
  rationale: string;
  garments: (Garment | undefined)[];
  garmentIds: string[];
}

interface ScoreResult {
  score: number;
  feedback: string;
  suggestions: string[];
}

const OCCASIONS: { value: Occasion; label: string; emoji: string }[] = [
  { value: "casual", label: "Casual", emoji: "👟" },
  { value: "work", label: "Work", emoji: "💼" },
  { value: "date", label: "Date", emoji: "💕" },
  { value: "formal", label: "Formal", emoji: "🎩" },
  { value: "sport", label: "Sport", emoji: "🏃" },
];
const WEATHERS: { value: Weather; label: string; emoji: string }[] = [
  { value: "cold", label: "Cold", emoji: "❄️" },
  { value: "mild", label: "Mild", emoji: "🌤️" },
  { value: "warm", label: "Warm", emoji: "☀️" },
  { value: "hot", label: "Hot", emoji: "🔥" },
];

export default function OutfitsPage() {
  const { token } = useAuth();
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [weather, setWeather] = useState<Weather>("mild");
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [scores, setScores] = useState<Record<number, ScoreResult>>({});
  const [scoringIdx, setScoringIdx] = useState<number | null>(null);

  async function suggest() {
    setLoading(true);
    setError("");
    setOutfits([]);
    setScores({});
    setSaved(false);
    const res = await fetch("/api/outfits/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ occasion, weather }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to generate outfits"); return; }
    setOutfits(data.outfits ?? []);
  }

  async function saveAll() {
    setSaving(true);
    await fetch("/api/outfits/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ occasion, weather, save: true }),
    });
    setSaving(false);
    setSaved(true);
  }

  async function score(idx: number, garmentIds: string[]) {
    setScoringIdx(idx);
    const res = await fetch("/api/outfits/score", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ garmentIds }),
    });
    const data = await res.json();
    setScoringIdx(null);
    if (res.ok) setScores(prev => ({ ...prev, [idx]: data }));
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 700 }}>AI Outfit Stylist</h1>
      <p style={{ margin: "0 0 28px", color: "#78716c", fontSize: 14 }}>
        Choose your occasion and weather — AI composes looks from your wardrobe
      </p>

      <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#a8a29e", marginBottom: 10 }}>OCCASION</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {OCCASIONS.map(o => (
              <button key={o.value} onClick={() => setOccasion(o.value)} style={selectorBtn(occasion === o.value)}>
                {o.emoji} {o.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#a8a29e", marginBottom: 10 }}>WEATHER</div>
          <div style={{ display: "flex", gap: 8 }}>
            {WEATHERS.map(w => (
              <button key={w.value} onClick={() => setWeather(w.value)} style={selectorBtn(weather === w.value)}>
                {w.emoji} {w.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={suggest} disabled={loading} style={primaryBtn}>
          {loading ? "🤖 Styling your wardrobe…" : "✨ Get outfit ideas"}
        </button>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#a8a29e" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
          <div style={{ fontSize: 16, color: "#78716c" }}>AI is composing your outfits…</div>
        </div>
      )}

      {outfits.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 17 }}>{outfits.length} outfit ideas for {occasion} · {weather}</div>
            <button onClick={saveAll} disabled={saving || saved} style={{
              padding: "9px 18px", background: saved ? "#f0fdf4" : "#b45309",
              color: saved ? "#16a34a" : "#fff", border: "none",
              borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: saved ? "default" : "pointer",
            }}>
              {saved ? "✓ Saved!" : saving ? "Saving…" : "💾 Save all"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {outfits.map((outfit, idx) => (
              <div key={idx} style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>{outfit.name}</div>
                    <div style={{ color: "#78716c", fontSize: 13, marginTop: 2, textTransform: "capitalize" }}>
                      {outfit.occasion}
                    </div>
                  </div>
                  <button
                    onClick={() => score(idx, outfit.garmentIds)}
                    disabled={scoringIdx === idx || !!scores[idx]}
                    style={{
                      background: scores[idx] ? "#f0fdf4" : "#fef3c7",
                      color: scores[idx] ? "#16a34a" : "#b45309",
                      border: "none", borderRadius: 9, padding: "8px 16px",
                      fontSize: 13, fontWeight: 600,
                      cursor: scoringIdx === idx || !!scores[idx] ? "default" : "pointer",
                    }}
                  >
                    {scoringIdx === idx ? "Scoring…" : scores[idx] ? `${scores[idx].score}/100` : "Score it"}
                  </button>
                </div>

                {scores[idx] && (
                  <div style={{ background: "#fef3c7", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 28, color: "#b45309", marginBottom: 6 }}>
                      {scores[idx].score}
                      <span style={{ fontSize: 16, fontWeight: 400, color: "#78716c" }}>/100</span>
                    </div>
                    <div style={{ color: "#57534e", fontSize: 14, marginBottom: 8 }}>{scores[idx].feedback}</div>
                    {scores[idx].suggestions.map((s, i) => (
                      <div key={i} style={{ color: "#78716c", fontSize: 13, marginTop: 4 }}>• {s}</div>
                    ))}
                  </div>
                )}

                <p style={{ margin: "0 0 16px", color: "#57534e", fontSize: 14, lineHeight: 1.7 }}>{outfit.rationale}</p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {outfit.garments?.filter(Boolean).map(g => g && (
                    <div key={g.id} style={{ textAlign: "center" }}>
                      {g.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.imageUrl} alt={g.category}
                          style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, display: "block" }} />
                      ) : (
                        <div style={{ width: 80, height: 80, background: "#f5f5f4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#a8a29e" }}>
                          {g.category}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#78716c", marginTop: 4, textTransform: "capitalize" }}>{g.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function selectorBtn(active: boolean): React.CSSProperties {
  return {
    padding: "9px 16px", borderRadius: 10,
    border: `1.5px solid ${active ? "#b45309" : "#e7e5e4"}`,
    background: active ? "#fef3c7" : "#fff",
    color: active ? "#b45309" : "#78716c",
    cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
    textTransform: "capitalize",
  };
}

const primaryBtn: React.CSSProperties = {
  background: "#b45309", color: "#fff", border: "none", borderRadius: 10,
  padding: "12px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer",
};
const errorBox: React.CSSProperties = {
  background: "#fef2f2", color: "#dc2626", borderRadius: 8,
  padding: "10px 14px", fontSize: 13, marginBottom: 16,
};
