"use client";
import { useEffect, useState } from "react";

interface Shop {
  name: string;
  marketName: string | null;
  city: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string | null;
  sizes: string[];
  inStock: boolean;
  shop: Shop;
}

const CATEGORIES = ["All", "tops", "bottoms", "dresses", "outerwear", "shoes", "accessories", "bags"];

export default function MarketPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);

  async function load(q?: string, cat?: string, c?: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat && cat !== "All") params.set("category", cat);
    if (c) params.set("city", c);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search, category, city);
  }

  const cities = [...new Set(products.map(p => p.shop.city))].sort();

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 700 }}>Local Market</h1>
      <p style={{ margin: "0 0 24px", color: "#78716c", fontSize: 14 }}>
        Authentic fashion from local bazaar sellers
      </p>

      <form onSubmit={handleSearch} style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: "1 1 200px" }}
        />
        <select
          value={city}
          onChange={e => setCity(e.target.value)}
          style={{ ...inputStyle, flex: "0 0 140px" }}
        >
          <option value="">All cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" style={primaryBtn}>Search</button>
      </form>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => { setCategory(c); load(search, c, city); }}
            style={{
              padding: "7px 14px", borderRadius: 20,
              border: `1.5px solid ${category === c ? "#b45309" : "#e7e5e4"}`,
              background: category === c ? "#fef3c7" : "#fff",
              color: category === c ? "#b45309" : "#78716c",
              cursor: "pointer", fontSize: 13, fontWeight: category === c ? 600 : 400,
              textTransform: "capitalize",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#a8a29e" }}>Loading products…</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#a8a29e" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
          <div style={{ fontSize: 16 }}>No products found</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {products.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)", cursor: "pointer" }}
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ height: 240, background: "#f5f5f4", display: "flex", alignItems: "center", justifyContent: "center", color: "#a8a29e", fontSize: 13 }}>
                  No image
                </div>
              )}
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#b45309" }}>
                  {p.price.toLocaleString()} {p.currency}
                </div>
                <div style={{ color: "#78716c", fontSize: 12, marginTop: 4 }}>
                  {p.shop.name}{p.shop.marketName ? ` · ${p.shop.marketName}` : ""} · {p.shop.city}
                </div>
                {p.sizes.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                    {p.sizes.map(s => (
                      <span key={s} style={{ background: "#faf8f5", border: "1px solid #e7e5e4", borderRadius: 5, fontSize: 11, padding: "1px 6px" }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div style={{ background: "#fff", borderRadius: 20, maxWidth: 520, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            {selected.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt={selected.title} style={{ width: "100%", maxHeight: 380, objectFit: "cover", display: "block" }} />
            )}
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{selected.title}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#b45309", marginBottom: 12 }}>
                {selected.price.toLocaleString()} {selected.currency}
              </div>
              <div style={{ color: "#78716c", fontSize: 14, marginBottom: 12 }}>
                <b>{selected.shop.name}</b>
                {selected.shop.marketName && ` · ${selected.shop.marketName}`}
                {` · ${selected.shop.city}`}
              </div>
              {selected.sizes.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#a8a29e", marginBottom: 6 }}>AVAILABLE SIZES</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {selected.sizes.map(s => (
                      <span key={s} style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d", borderRadius: 6, fontSize: 13, padding: "4px 10px", fontWeight: 500 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ background: "#fef3c7", borderRadius: 10, padding: 12, fontSize: 13, color: "#78716c", marginBottom: 16 }}>
                To order, visit this seller in {selected.shop.marketName || selected.shop.city}. Use the Libos app to place an order intent.
              </div>
              <button onClick={() => setSelected(null)} style={{ width: "100%", padding: "12px 0", background: "#b45309", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px", border: "1.5px solid #e7e5e4", borderRadius: 10,
  fontSize: 14, outline: "none", background: "#faf8f5", color: "#1c1917",
  boxSizing: "border-box",
};
const primaryBtn: React.CSSProperties = {
  background: "#b45309", color: "#fff", border: "none", borderRadius: 10,
  padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
