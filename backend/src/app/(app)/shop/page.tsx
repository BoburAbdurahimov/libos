"use client";
import { useAuth } from "../../components/AuthProvider";
import { useEffect, useState, useRef } from "react";

// ── types ──────────────────────────────────────────────────────────────────

interface Shop {
  id: string;
  name: string;
  city: string;
  phone: string;
  marketName: string | null;
  description: string | null;
  ownerId: string;
  _count?: { products: number };
}

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  description: string | null;
  sizes: string[];
  imageUrl: string | null;
  inStock: boolean;
}

interface Order {
  id: string;
  buyerName: string;
  buyerPhone: string;
  status: "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  snapshotPrice: number;
  currency: string;
  createdAt: string;
  product: { title: string; shop: { name: string } };
  bundle: { slug: string; title: string };
}

type Tab = "shop" | "products" | "orders";

const CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories", "bags"];
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  NEW:       { bg: "#eff6ff", color: "#2563eb" },
  CONFIRMED: { bg: "#fef3c7", color: "#b45309" },
  COMPLETED: { bg: "#f0fdf4", color: "#16a34a" },
  CANCELLED: { bg: "#fef2f2", color: "#dc2626" },
};

// ── page ───────────────────────────────────────────────────────────────────

export default function ShopPage() {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<Tab>("shop");
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // shop form
  const [shopForm, setShopForm] = useState({ name: "", city: "", phone: "", marketName: "", description: "" });
  const [shopSaving, setShopSaving] = useState(false);
  const [shopEditing, setShopEditing] = useState(false);
  const [shopError, setShopError] = useState("");

  // product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({ title: "", price: "", currency: "UZS", category: "tops", description: "", sizes: "" });
  const [productImage, setProductImage] = useState<{ base64: string; mediaType: string } | null>(null);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // guard
  if (user && user.role !== "SELLER" && user.role !== "ADMIN") {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#a8a29e" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#78716c", marginBottom: 8 }}>Seller feature</div>
        <div style={{ fontSize: 14 }}>The seller dashboard is only available for seller accounts.</div>
      </div>
    );
  }

  // ── loaders ──

  async function loadShop() {
    setShopLoading(true);
    const res = await fetch("/api/shops", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const mine = (data.shops as Shop[]).find(s => s.ownerId === user?.id) ?? null;
    setShop(mine);
    if (mine) setShopForm({ name: mine.name, city: mine.city, phone: mine.phone, marketName: mine.marketName ?? "", description: mine.description ?? "" });
    setShopLoading(false);
    return mine;
  }

  async function loadProducts(shopId: string) {
    const res = await fetch(`/api/shops/${shopId}/products`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  async function loadOrders() {
    const res = await fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setOrders(data.orders ?? []);
    setOrdersLoaded(true);
  }

  useEffect(() => {
    if (!token) return;
    loadShop().then(mine => { if (mine) loadProducts(mine.id); });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "orders" && !ordersLoaded) loadOrders();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── shop save ──

  async function saveShop(e: React.FormEvent) {
    e.preventDefault();
    setShopSaving(true);
    setShopError("");
    const body = { name: shopForm.name, city: shopForm.city, phone: shopForm.phone, marketName: shopForm.marketName || null, description: shopForm.description || null };
    let res: Response;
    if (shop) {
      res = await fetch(`/api/shops/${shop.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    } else {
      res = await fetch("/api/shops", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    }
    const data = await res.json();
    setShopSaving(false);
    if (!res.ok) { setShopError(data.error ?? "Failed to save"); return; }
    setShop(data.shop);
    setShopEditing(false);
    if (!shop) loadProducts(data.shop.id);
  }

  // ── product add ──

  function pickImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      setProductImage({ base64: dataUrl.slice(comma + 1), mediaType: dataUrl.slice(5, comma).split(";")[0] });
    };
    reader.readAsDataURL(file);
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!shop) return;
    setProductSaving(true);
    setProductError("");
    const sizes = productForm.sizes.split(",").map(s => s.trim()).filter(Boolean);
    const body: Record<string, unknown> = {
      title: productForm.title,
      price: Number(productForm.price),
      currency: productForm.currency,
      category: productForm.category,
      description: productForm.description || null,
      sizes,
      ...(productImage ? { imageBase64: productImage.base64, mediaType: productImage.mediaType } : {}),
    };
    const res = await fetch(`/api/shops/${shop.id}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setProductSaving(false);
    if (!res.ok) { setProductError(data.error ?? "Failed to add product"); return; }
    setProducts(prev => [data.product, ...prev]);
    setProductForm({ title: "", price: "", currency: "UZS", category: "tops", description: "", sizes: "" });
    setProductImage(null);
    setShowProductForm(false);
  }

  async function toggleStock(product: Product) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inStock: !product.inStock }),
    });
    if (res.ok) setProducts(prev => prev.map(p => p.id === product.id ? { ...p, inStock: !p.inStock } : p));
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function updateOrderStatus(orderId: string, status: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as Order["status"] } : o));
  }

  // ── render ──

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Seller Dashboard</h1>
        <p style={{ margin: "4px 0 0", color: "#78716c", fontSize: 14 }}>
          {shop ? `${shop.name} · ${shop.city}` : "Set up your shop to start selling"}
        </p>
      </div>

      {/* tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, background: "#fff", borderRadius: 12, padding: 4, boxShadow: "0 1px 4px rgba(0,0,0,.06)", width: "fit-content" }}>
        {([
          { key: "shop", label: "🏪 My Shop" },
          { key: "products", label: "📦 Products" },
          { key: "orders", label: "📋 Orders" },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "9px 20px", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
            background: tab === t.key ? "#b45309" : "transparent",
            color: tab === t.key ? "#fff" : "#78716c",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SHOP TAB ── */}
      {tab === "shop" && (
        <div style={{ maxWidth: 560 }}>
          {shopLoading ? (
            <div style={{ color: "#a8a29e" }}>Loading…</div>
          ) : shop && !shopEditing ? (
            <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🏪</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{shop.name}</div>
                  {shop.marketName && <div style={{ color: "#78716c", fontSize: 14 }}>{shop.marketName}</div>}
                  <div style={{ color: "#a8a29e", fontSize: 13, marginTop: 2 }}>{shop.city}</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid #f5f5f4", paddingTop: 20 }}>
                <Row label="Phone" value={shop.phone} />
                {shop.description && <Row label="About" value={shop.description} />}
                <Row label="Products" value={`${shop._count?.products ?? products.length} listed`} />
              </div>

              <button onClick={() => setShopEditing(true)} style={{ marginTop: 20, width: "100%", padding: "11px 0", background: "#fef3c7", color: "#b45309", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Edit shop info
              </button>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 18 }}>{shop ? "Edit shop" : "Set up your shop"}</h2>
              <form onSubmit={saveShop} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Shop name" required>
                  <input value={shopForm.name} onChange={e => setShopForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Karim Fashion" required style={inputStyle} />
                </Field>
                <Field label="City">
                  <input value={shopForm.city} onChange={e => setShopForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Tashkent" required style={inputStyle} />
                </Field>
                <Field label="Phone">
                  <input value={shopForm.phone} onChange={e => setShopForm(f => ({ ...f, phone: e.target.value }))} placeholder="+998 90 000 0000" required style={inputStyle} />
                </Field>
                <Field label="Market / bazaar name (optional)">
                  <input value={shopForm.marketName} onChange={e => setShopForm(f => ({ ...f, marketName: e.target.value }))} placeholder="e.g. Chorsu Bazaar" style={inputStyle} />
                </Field>
                <Field label="Description (optional)">
                  <textarea value={shopForm.description} onChange={e => setShopForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Tell buyers about your shop…" style={{ ...inputStyle, resize: "vertical" }} />
                </Field>
                {shopError && <div style={errorBox}>{shopError}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  {shop && <button type="button" onClick={() => setShopEditing(false)} style={{ flex: 1, padding: "11px 0", background: "#f5f5f4", border: "none", borderRadius: 10, fontSize: 14, cursor: "pointer" }}>Cancel</button>}
                  <button type="submit" disabled={shopSaving} style={{ ...primaryBtn, flex: 1, padding: "11px 0" }}>
                    {shopSaving ? "Saving…" : shop ? "Save changes" : "Create shop"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {tab === "products" && (
        <div>
          {!shop ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#a8a29e" }}>
              <div style={{ fontSize: 13 }}>Set up your shop first before adding products.</div>
              <button onClick={() => setTab("shop")} style={{ marginTop: 12, ...primaryBtn }}>Go to Shop setup</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{products.length} product{products.length !== 1 ? "s" : ""}</div>
                <button onClick={() => setShowProductForm(f => !f)} style={primaryBtn}>
                  {showProductForm ? "✕ Cancel" : "+ Add product"}
                </button>
              </div>

              {showProductForm && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 20 }}>
                  <h3 style={{ margin: "0 0 18px", fontSize: 16 }}>New product</h3>
                  <form onSubmit={addProduct} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <Field label="Title">
                        <input value={productForm.title} onChange={e => setProductForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Linen shirt" required style={inputStyle} />
                      </Field>
                      <Field label="Category">
                        <select value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </Field>
                      <Field label="Price">
                        <input type="number" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} placeholder="180000" required style={inputStyle} />
                      </Field>
                      <Field label="Currency">
                        <select value={productForm.currency} onChange={e => setProductForm(f => ({ ...f, currency: e.target.value }))} style={inputStyle}>
                          {["UZS", "USD", "EUR"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </Field>
                    </div>
                    <Field label="Sizes (comma-separated, optional)">
                      <input value={productForm.sizes} onChange={e => setProductForm(f => ({ ...f, sizes: e.target.value }))} placeholder="S, M, L, XL" style={inputStyle} />
                    </Field>
                    <Field label="Description (optional)">
                      <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                    </Field>
                    <Field label="Photo (optional)">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: "8px 16px", background: "#faf8f5", border: "1.5px solid #e7e5e4", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                          {productImage ? "Change photo" : "Upload photo"}
                        </button>
                        {productImage && <span style={{ fontSize: 12, color: "#16a34a" }}>✓ Photo ready</span>}
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) pickImage(f); }} />
                      </div>
                    </Field>
                    {productError && <div style={errorBox}>{productError}</div>}
                    <button type="submit" disabled={productSaving} style={primaryBtn}>
                      {productSaving ? "Adding…" : "Add product"}
                    </button>
                  </form>
                </div>
              )}

              {products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#a8a29e" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                  <div style={{ fontSize: 16 }}>No products yet — add your first item above</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                  {products.map(p => (
                    <div key={p.id} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.06)", opacity: p.inStock ? 1 : 0.6 }}>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ height: 200, background: "#f5f5f4", display: "flex", alignItems: "center", justifyContent: "center", color: "#a8a29e", fontSize: 13 }}>No image</div>
                      )}
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{p.title}</div>
                        <div style={{ color: "#b45309", fontWeight: 700, fontSize: 16, marginTop: 2 }}>
                          {p.price.toLocaleString()} {p.currency}
                        </div>
                        <div style={{ color: "#78716c", fontSize: 12, textTransform: "capitalize", marginTop: 2 }}>{p.category}</div>
                        {p.sizes.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                            {p.sizes.map(s => <span key={s} style={{ background: "#faf8f5", border: "1px solid #e7e5e4", borderRadius: 5, fontSize: 11, padding: "1px 6px" }}>{s}</span>)}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                          <button
                            onClick={() => toggleStock(p)}
                            style={{
                              flex: 1, padding: "7px 0", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
                              background: p.inStock ? "#f0fdf4" : "#fef2f2",
                              color: p.inStock ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {p.inStock ? "✓ In stock" : "Out of stock"}
                          </button>
                          <button onClick={() => deleteProduct(p.id)} style={{ padding: "7px 12px", background: "none", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", fontSize: 12, color: "#dc2626" }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {tab === "orders" && (
        <div>
          {!ordersLoaded ? (
            <div style={{ color: "#a8a29e" }}>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "#a8a29e" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 16 }}>No orders yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Orders placed through influencer bundles will appear here</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map(o => {
                const sc = STATUS_COLORS[o.status] ?? STATUS_COLORS.NEW;
                return (
                  <div key={o.id} style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{o.buyerName}</div>
                        <div style={{ color: "#78716c", fontSize: 14 }}>{o.buyerPhone}</div>
                      </div>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 20, fontSize: 12, fontWeight: 700, padding: "4px 12px" }}>
                        {o.status}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#78716c", marginBottom: 14 }}>
                      <span>📦 {o.product.title}</span>
                      <span>🔗 {o.bundle.title}</span>
                      <span>💰 {o.snapshotPrice.toLocaleString()} {o.currency}</span>
                      <span>📅 {new Date(o.createdAt).toLocaleDateString()}</span>
                    </div>

                    {o.status !== "COMPLETED" && o.status !== "CANCELLED" && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {o.status === "NEW" && (
                          <button onClick={() => updateOrderStatus(o.id, "CONFIRMED")} style={actionBtn("#fef3c7", "#b45309")}>
                            ✓ Confirm order
                          </button>
                        )}
                        {o.status === "CONFIRMED" && (
                          <button onClick={() => updateOrderStatus(o.id, "COMPLETED")} style={actionBtn("#f0fdf4", "#16a34a")}>
                            ✓ Mark completed
                          </button>
                        )}
                        <button onClick={() => updateOrderStatus(o.id, "CANCELLED")} style={actionBtn("#fef2f2", "#dc2626")}>
                          ✕ Cancel
                        </button>
                      </div>
                    )}
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

// ── small helpers ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#a8a29e", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: "#57534e", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#a8a29e", marginBottom: 6, textTransform: "uppercase" }}>
        {label}{required && " *"}
      </label>
      {children}
    </div>
  );
}

function actionBtn(bg: string, color: string): React.CSSProperties {
  return { padding: "7px 16px", background: bg, color, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
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
const errorBox: React.CSSProperties = {
  background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13,
};
