"use client";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useState } from "react";

interface Shop { id: string; name: string; description: string | null; marketName: string | null; city: string; phone: string | null; ownerId: string; }
interface Product { id: string; title: string; description: string | null; price: number; currency: string; category: string; imageUrl: string | null; sizes: string[]; inStock: boolean; shopId: string; }
interface Order { id: string; status: string; totalPrice: number; currency: string; createdAt: string; product: { title: string }; }

type Tab = "shop" | "products" | "orders";
const STATUS_NEXT: Record<string, string> = { NEW: "CONFIRMED", CONFIRMED: "COMPLETED" };
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  NEW:       { bg: "#eff6ff", color: "#2563eb" },
  CONFIRMED: { bg: "var(--amber)", color: "var(--ac)" },
  COMPLETED: { bg: "var(--ok-bg)", color: "var(--ok)" },
  CANCELLED: { bg: "var(--err-bg)", color: "var(--err)" },
};

export default function ShopPage() {
  const { token, user } = useAuth();
  const [tab,      setTab]      = useState<Tab>("shop");
  const [shop,     setShop]     = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [editingShop, setEditingShop] = useState(false);
  const [shopName,    setShopName]    = useState("");
  const [shopDesc,    setShopDesc]    = useState("");
  const [shopMarket,  setShopMarket]  = useState("");
  const [shopCity,    setShopCity]    = useState("");
  const [shopPhone,   setShopPhone]   = useState("");
  const [shopSaving,  setShopSaving]  = useState(false);

  const [addingProd,  setAddingProd]  = useState(false);
  const [prodTitle,   setProdTitle]   = useState("");
  const [prodDesc,    setProdDesc]    = useState("");
  const [prodPrice,   setProdPrice]   = useState("");
  const [prodCurr,    setProdCurr]    = useState("UZS");
  const [prodCat,     setProdCat]     = useState("tops");
  const [prodSizes,   setProdSizes]   = useState("");
  const [prodImg,     setProdImg]     = useState<string | null>(null);
  const [prodSaving,  setProdSaving]  = useState(false);
  const [error,       setError]       = useState("");

  async function loadMyShop() {
    const res = await fetch("/api/shops", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const mine = (data.shops ?? []).find((s: Shop) => s.ownerId === user?.id);
    setShop(mine ?? null);
    if (mine) {
      setShopName(mine.name); setShopDesc(mine.description ?? "");
      setShopMarket(mine.marketName ?? ""); setShopCity(mine.city); setShopPhone(mine.phone ?? "");
      await Promise.all([loadProducts(mine.id), loadOrders(mine.id)]);
    }
    setLoading(false);
  }

  async function loadProducts(shopId: string) {
    const res = await fetch(`/api/shops/${shopId}/products`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  async function loadOrders(shopId: string) {
    const res = await fetch(`/api/shops/${shopId}/orders`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setOrders(data.orders ?? []);
  }

  useEffect(() => { if (token && user) loadMyShop(); }, [token, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveShop(e: React.FormEvent) {
    e.preventDefault(); setShopSaving(true); setError("");
    const body = { name: shopName, description: shopDesc, marketName: shopMarket, city: shopCity, phone: shopPhone };
    const res = shop
      ? await fetch(`/api/shops/${shop.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
      : await fetch("/api/shops", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const data = await res.json();
    setShopSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to save shop"); return; }
    setShop(data.shop); setEditingShop(false);
    if (!shop && data.shop) { await Promise.all([loadProducts(data.shop.id), loadOrders(data.shop.id)]); }
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault(); if (!shop) return;
    setProdSaving(true); setError("");
    const body = { title: prodTitle, description: prodDesc, price: Number(prodPrice), currency: prodCurr, category: prodCat, sizes: prodSizes.split(",").map(s => s.trim()).filter(Boolean), imageBase64: prodImg };
    const res = await fetch(`/api/shops/${shop.id}/products`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const data = await res.json();
    setProdSaving(false);
    if (!res.ok) { setError(data.error ?? "Failed to add product"); return; }
    setProducts(prev => [data.product, ...prev]);
    setProdTitle(""); setProdDesc(""); setProdPrice(""); setProdSizes(""); setProdImg(null);
    setAddingProd(false);
  }

  async function toggleStock(p: Product) {
    const res = await fetch(`/api/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ inStock: !p.inStock }) });
    const data = await res.json();
    if (res.ok) setProducts(prev => prev.map(x => x.id === p.id ? data.product : x));
  }

  async function advanceOrder(o: Order) {
    const nextStatus = STATUS_NEXT[o.status];
    if (!nextStatus || !shop) return;
    const res = await fetch(`/api/shops/${shop.id}/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: nextStatus }) });
    const data = await res.json();
    if (res.ok) setOrders(prev => prev.map(x => x.id === o.id ? data.order : x));
  }

  function readImg(file: File) {
    const r = new FileReader();
    r.onload = () => {
      const d = r.result as string;
      const comma = d.indexOf(",");
      setProdImg(d.slice(comma + 1));
    };
    r.readAsDataURL(file);
  }

  if (loading) return <div style={{ color: "var(--t4)" }}>Loading your shop…</div>;

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: 26, fontWeight: 700 }}>My Shop</h1>

      <div style={{ display: "flex", background: "var(--raised)", borderRadius: 12, padding: 4, marginBottom: 24, maxWidth: 420 }}>
        {(["shop", "products", "orders"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "9px 0", border: "none", borderRadius: 9, cursor: "pointer",
            fontSize: 14, fontWeight: 500, textTransform: "capitalize",
            background: tab === t ? "var(--card)" : "transparent",
            color: tab === t ? "var(--t1)" : "var(--t3)",
            boxShadow: tab === t ? "0 1px 4px var(--shadow)" : "none",
          }}>{t}</button>
        ))}
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {tab === "shop" && (
        <div style={{ maxWidth: 520 }}>
          {!shop && !editingShop && (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--card)", borderRadius: 16, boxShadow: "0 1px 4px var(--shadow)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>No shop yet</div>
              <div style={{ color: "var(--t3)", fontSize: 14, marginBottom: 20 }}>Create your seller profile to start listing products</div>
              <button onClick={() => setEditingShop(true)} style={primaryBtn}>Create my shop</button>
            </div>
          )}

          {shop && !editingShop && (
            <div style={{ background: "var(--card)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px var(--shadow)" }}>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{shop.name}</div>
              {shop.description && <p style={{ color: "var(--t2)", fontSize: 14, margin: "0 0 12px", lineHeight: 1.6 }}>{shop.description}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {shop.marketName
                  ? <div style={{ fontSize: 14, color: "var(--t3)" }}>📍 {shop.marketName}, {shop.city}</div>
                  : <div style={{ fontSize: 14, color: "var(--t3)" }}>📍 {shop.city}</div>}
                {shop.phone && <div style={{ fontSize: 14, color: "var(--t3)" }}>📞 {shop.phone}</div>}
              </div>
              <div style={{ display: "flex", gap: 16, padding: "16px 0", borderTop: "1px solid var(--br)", marginBottom: 20 }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700 }}>{products.length}</div><div style={{ fontSize: 12, color: "var(--t3)" }}>Products</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700 }}>{orders.filter(o => o.status === "NEW").length}</div><div style={{ fontSize: 12, color: "var(--t3)" }}>New orders</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700 }}>{orders.filter(o => o.status === "COMPLETED").length}</div><div style={{ fontSize: 12, color: "var(--t3)" }}>Completed</div></div>
              </div>
              <button onClick={() => setEditingShop(true)} style={{ width: "100%", padding: "11px 0", background: "var(--amber)", color: "var(--ac)", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Edit shop details
              </button>
            </div>
          )}

          {editingShop && (
            <div style={{ background: "var(--card)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px var(--shadow)" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>{shop ? "Edit shop" : "Create shop"}</h2>
              <form onSubmit={saveShop} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Shop name" required><input value={shopName} onChange={e => setShopName(e.target.value)} required style={inputStyle} /></Field>
                <Field label="Description"><textarea value={shopDesc} onChange={e => setShopDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
                <Field label="Market / Bazaar name"><input value={shopMarket} onChange={e => setShopMarket(e.target.value)} placeholder="e.g. Chorsu Bazaar" style={inputStyle} /></Field>
                <Field label="City" required><input value={shopCity} onChange={e => setShopCity(e.target.value)} required placeholder="e.g. Tashkent" style={inputStyle} /></Field>
                <Field label="Phone"><input value={shopPhone} onChange={e => setShopPhone(e.target.value)} placeholder="+998…" style={inputStyle} /></Field>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setEditingShop(false)} style={{ flex: 1, padding: "11px 0", background: "var(--raised)", color: "var(--t3)", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={shopSaving} style={{ flex: 2, ...primaryBtn }}>{shopSaving ? "Saving…" : shop ? "Save" : "Create shop"}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ color: "var(--t3)", fontSize: 14 }}>{products.length} product{products.length !== 1 ? "s" : ""}</div>
            {shop && <button onClick={() => setAddingProd(!addingProd)} style={primaryBtn}>{addingProd ? "Cancel" : "+ Add product"}</button>}
          </div>

          {!shop && <div style={{ color: "var(--t3)", textAlign: "center", padding: 40 }}>Create your shop first to add products.</div>}

          {addingProd && (
            <div style={{ background: "var(--card)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px var(--shadow)", marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Add product</h2>
              <form onSubmit={addProduct} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="Title" required><input value={prodTitle} onChange={e => setProdTitle(e.target.value)} required style={inputStyle} /></Field>
                <Field label="Description"><textarea value={prodDesc} onChange={e => setProdDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <Field label="Price" required><input type="number" value={prodPrice} onChange={e => setProdPrice(e.target.value)} required min="0" style={inputStyle} /></Field>
                  <Field label="Currency">
                    <select value={prodCurr} onChange={e => setProdCurr(e.target.value)} style={inputStyle}>
                      <option>UZS</option><option>USD</option>
                    </select>
                  </Field>
                </div>
                <Field label="Category">
                  <select value={prodCat} onChange={e => setProdCat(e.target.value)} style={inputStyle}>
                    {["tops","bottoms","dresses","outerwear","shoes","accessories","bags"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Sizes (comma separated)"><input value={prodSizes} onChange={e => setProdSizes(e.target.value)} placeholder="XS, S, M, L, XL" style={inputStyle} /></Field>
                <Field label="Photo">
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) readImg(f); }} style={{ fontSize: 13, color: "var(--t2)" }} />
                </Field>
                <button type="submit" disabled={prodSaving} style={primaryBtn}>{prodSaving ? "Adding…" : "Add product"}</button>
              </form>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {products.map(p => (
              <div key={p.id} style={{ background: "var(--card)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px var(--shadow)" }}>
                {p.imageUrl
                  ? <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} /> // eslint-disable-line @next/next/no-img-element
                  : <div style={{ height: 180, background: "var(--raised)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t4)", fontSize: 13 }}>No image</div>
                }
                <div style={{ padding: "10px 12px 12px" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                  <div style={{ color: "var(--ac)", fontWeight: 700, fontSize: 15, marginTop: 2 }}>{p.price.toLocaleString()} {p.currency}</div>
                  <button onClick={() => toggleStock(p)} style={{
                    marginTop: 8, width: "100%", padding: "6px 0", fontSize: 12, fontWeight: 600,
                    border: "none", borderRadius: 7, cursor: "pointer",
                    background: p.inStock ? "var(--ok-bg)" : "var(--err-bg)",
                    color: p.inStock ? "var(--ok)" : "var(--err)",
                  }}>
                    {p.inStock ? "✓ In stock" : "✗ Out of stock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div>
          <div style={{ color: "var(--t3)", fontSize: 14, marginBottom: 20 }}>{orders.length} order{orders.length !== 1 ? "s" : ""}</div>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--t4)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div>No orders yet</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map(o => {
                const sc = STATUS_COLOR[o.status] ?? { bg: "var(--raised)", color: "var(--t3)" };
                return (
                  <div key={o.id} style={{ background: "var(--card)", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{o.product.title}</div>
                      <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 2 }}>{new Date(o.createdAt).toLocaleDateString()} · {o.totalPrice.toLocaleString()} {o.currency}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>{o.status}</span>
                      {STATUS_NEXT[o.status] && (
                        <button onClick={() => advanceOrder(o)} style={{ background: "var(--ac)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          → {STATUS_NEXT[o.status]}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--t4)", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" as const }}>
        {label}{required && " *"}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "10px 14px", border: "1.5px solid var(--br)", borderRadius: 10, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", background: "var(--input)", color: "var(--t1)" };
const primaryBtn: React.CSSProperties = { background: "var(--ac)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const errorBox: React.CSSProperties = { background: "var(--err-bg)", color: "var(--err)", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 };
