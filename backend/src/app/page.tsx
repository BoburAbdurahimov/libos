"use client";
import Link from "next/link";
import { useAuth } from "./components/AuthProvider";

export default function LandingPage() {
  const { token } = useAuth();
  const cta = token ? "/wardrobe" : "/login";

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", color: "#1c1917" }}>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(250,248,245,.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e7e5e4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#b45309", letterSpacing: 1.5 }}>LIBOS</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="#features" style={{ fontSize: 14, color: "#78716c", textDecoration: "none" }}>Features</a>
            <a href="#how" style={{ fontSize: 14, color: "#78716c", textDecoration: "none" }}>How it works</a>
            <a href="#roles" style={{ fontSize: 14, color: "#78716c", textDecoration: "none" }}>For you</a>
            <Link href={cta} style={{ ...pillBtn, fontSize: 14, padding: "7px 18px" }}>
              {token ? "Open app →" : "Get started"}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: "linear-gradient(160deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)", padding: "96px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "#fff", border: "1px solid #fcd34d", borderRadius: 20, padding: "5px 16px", fontSize: 12, fontWeight: 700, color: "#b45309", letterSpacing: 1.5, marginBottom: 24 }}>
            AI STYLIST + LOCAL MARKET FASHION
          </div>
          <h1 style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 20px", color: "#1c1917" }}>
            Your wardrobe.<br />
            <span style={{ color: "#b45309" }}>Your style.</span><br />
            Your local market.
          </h1>
          <p style={{ fontSize: 18, color: "#57534e", lineHeight: 1.7, margin: "0 0 40px", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            Libos combines an AI personal stylist with authentic local-market fashion. Upload clothes, get outfit ideas, discover bazaar finds — all in one place.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={cta} style={primaryBtn}>
              {token ? "Open app →" : "Get started — it's free"}
            </Link>
            <a href="#how" style={{ display: "inline-flex", alignItems: "center", padding: "13px 24px", background: "#fff", border: "1.5px solid #e7e5e4", borderRadius: 12, fontWeight: 600, fontSize: 15, color: "#78716c", textDecoration: "none" }}>
              See how it works
            </a>
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "#a8a29e" }}>No credit card · Demo accounts available</p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #f5f5f4" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, textAlign: "center" }}>
          {[
            { value: "3 roles", label: "Shopper · Influencer · Seller" },
            { value: "AI-powered", label: "Claude AI for tagging & styling" },
            { value: "Real bazaar", label: "Chorsu & local market sellers" },
            { value: "UZS prices", label: "Built for Central Asia" },
          ].map(s => (
            <div key={s.value}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#b45309" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#78716c", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "96px 24px", background: "#faf8f5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionLabel>FEATURES</SectionLabel>
          <h2 style={sectionTitle}>Everything you need for fashion, done right</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginTop: 48 }}>
            {[
              {
                icon: "📸",
                title: "AI Wardrobe Tagging",
                desc: "Snap a photo of any garment. Claude AI instantly identifies the category, colors, style tags, and season — no manual input needed.",
                tag: "Powered by Claude",
              },
              {
                icon: "✨",
                title: "Outfit Stylist",
                desc: "Tell the AI your occasion and weather. It composes 3 outfit suggestions from items already in your wardrobe and explains why each combination works.",
                tag: "Claude vision",
              },
              {
                icon: "🏆",
                title: "Outfit Scoring",
                desc: "Get a 0–100 style score for any combination, detailed feedback, and suggestions for improvement — like a personal stylist in your pocket.",
                tag: "AI feedback",
              },
              {
                icon: "🛍️",
                title: "Local Market Catalog",
                desc: "Browse real products from bazaar sellers — Chorsu and beyond. Filter by category, city, and size. Prices in UZS. No middleman.",
                tag: "Real inventory",
              },
              {
                icon: "🔗",
                title: "Influencer Bundles",
                desc: "Curate a \"look\" from local sellers, share a link on Instagram or TikTok, and earn commission on every order. AI writes your captions in Uzbek, Russian, and English.",
                tag: "AI captions",
              },
              {
                icon: "📊",
                title: "Seller Dashboard",
                desc: "List products, set prices, manage stock, and track incoming orders with status updates. Built for bazaar sellers — simple, fast, mobile-friendly.",
                tag: "Order tracking",
              },
            ].map(f => (
              <div key={f.title} style={{ background: "#fff", borderRadius: 18, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)", border: "1px solid #f5f5f4" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{f.title}</h3>
                </div>
                <p style={{ margin: "0 0 14px", color: "#57534e", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
                <span style={{ background: "#fef3c7", color: "#b45309", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: 0.5 }}>{f.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <SectionLabel>HOW IT WORKS</SectionLabel>
          <h2 style={sectionTitle}>From wardrobe to styled look in minutes</h2>

          <div style={{ marginTop: 56, display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { step: "01", icon: "👤", title: "Create your account", desc: "Pick your role — Shopper, Influencer, or Seller. Each unlocks a different part of the platform." },
              { step: "02", icon: "👗", title: "Build your wardrobe", desc: "Upload photos of your clothes. AI tags everything automatically: category, colors, style, season." },
              { step: "03", icon: "✨", title: "Get styled by AI", desc: "Choose an occasion and weather. Claude AI mixes and matches your wardrobe into 3 outfit suggestions with explanations." },
              { step: "04", icon: "🛍️", title: "Discover local fashion", desc: "Browse the market for new pieces from bazaar sellers. Missing a top? Find one nearby at bazaar prices." },
              { step: "05", icon: "🔗", title: "Share or sell", desc: "Influencers bundle products into curated looks and share a link. AI writes captions per platform. Sellers track orders and stock in real time." },
            ].map((s, i, arr) => (
              <div key={s.step} style={{ display: "flex", gap: 24, position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef3c7", border: "2px solid #b45309", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, zIndex: 1 }}>
                    {s.icon}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: "#e7e5e4", margin: "8px 0" }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < arr.length - 1 ? 40 : 0, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#b45309", letterSpacing: 2, marginBottom: 4 }}>STEP {s.step}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                  <p style={{ margin: 0, color: "#57534e", fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" style={{ padding: "96px 24px", background: "#faf8f5" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionLabel>FOR EVERY ROLE</SectionLabel>
          <h2 style={sectionTitle}>One platform, three ways to use it</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginTop: 48 }}>
            {[
              {
                emoji: "👗",
                role: "Shopper",
                color: "#b45309",
                bg: "#fef3c7",
                tagline: "Dress better, spend less",
                perks: [
                  "AI wardrobe tagging from photos",
                  "Outfit suggestions for any occasion",
                  "Style scoring with AI feedback",
                  "Browse local market products",
                ],
              },
              {
                emoji: "✨",
                role: "Influencer",
                color: "#7c3aed",
                bg: "#ede9fe",
                tagline: "Curate. Share. Earn.",
                perks: [
                  "Bundle products into shoppable looks",
                  "AI captions for Instagram, TikTok & Telegram",
                  "Unique share link per bundle",
                  "Click & order analytics dashboard",
                ],
              },
              {
                emoji: "🛍️",
                role: "Seller",
                color: "#0f766e",
                bg: "#ccfbf1",
                tagline: "List once, sell everywhere",
                perks: [
                  "Simple product listing with photos",
                  "In-stock toggle per product",
                  "Orders from influencer bundles",
                  "Status tracking: New → Confirmed → Done",
                ],
              },
            ].map(r => (
              <div key={r.role} style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)", display: "flex", flexDirection: "column" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>
                  {r.emoji}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: r.color, letterSpacing: 1.5, marginBottom: 6 }}>{r.role.toUpperCase()}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{r.tagline}</div>
                <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  {r.perks.map(p => (
                    <li key={p} style={{ display: "flex", gap: 10, fontSize: 14, color: "#57534e", alignItems: "flex-start" }}>
                      <span style={{ color: r.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{ display: "block", textAlign: "center", padding: "11px 0", background: r.bg, color: r.color, borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                  Join as {r.role} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "96px 24px", background: "linear-gradient(160deg, #1c1917 0%, #292524 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>✨</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: "#fff", margin: "0 0 16px", lineHeight: 1.2 }}>
            Ready to discover your style?
          </h2>
          <p style={{ color: "#a8a29e", fontSize: 16, lineHeight: 1.7, margin: "0 0 36px" }}>
            Try all features instantly with a demo account — no sign-up required.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={cta} style={primaryBtn}>
              {token ? "Open app →" : "Start for free"}
            </Link>
            <Link href="/login" style={{ display: "inline-flex", alignItems: "center", padding: "13px 24px", background: "transparent", border: "1.5px solid #57534e", borderRadius: 12, fontWeight: 600, fontSize: 15, color: "#a8a29e", textDecoration: "none" }}>
              Use a demo account
            </Link>
          </div>
          <div style={{ marginTop: 20, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {["👗 user@libos.uz", "✨ influencer@libos.uz", "🛍️ seller@libos.uz"].map(d => (
              <span key={d} style={{ fontSize: 12, color: "#78716c" }}>{d}</span>
            ))}
          </div>
          <p style={{ color: "#57534e", fontSize: 12, marginTop: 6 }}>Password: password123 for all demo accounts</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#1c1917", borderTop: "1px solid #292524", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 16, color: "#b45309", letterSpacing: 1.5 }}>LIBOS</span>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#57534e" }}>AI stylist + local market fashion · Built for Central Asia</p>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "App", href: cta },
              { label: "Market", href: "/market" },
              { label: "Sign in", href: "/login" },
            ].map(l => (
              <Link key={l.label} href={l.href} style={{ fontSize: 13, color: "#78716c", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}

// ── small helpers ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.5, color: "#b45309", textAlign: "center", marginBottom: 12 }}>
      {children}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, textAlign: "center",
  margin: "0 auto", maxWidth: 600, lineHeight: 1.2,
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  padding: "13px 28px", background: "#b45309", color: "#fff",
  borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: "none",
};

const pillBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  padding: "9px 20px", background: "#b45309", color: "#fff",
  borderRadius: 20, fontWeight: 600, textDecoration: "none",
};
