import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import OrderForm from "./OrderForm";

export const dynamic = "force-dynamic";

function formatPrice(price: number, currency: string) {
  return `${price.toLocaleString("en-US")} ${currency}`;
}

// Public bundle landing page — the link influencers share on social media.
// Visiting it records a click attributed to ?utm_source=instagram|tiktok|telegram.
export default async function BundlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ utm_source?: string }>;
}) {
  const { slug } = await params;
  const { utm_source } = await searchParams;

  const bundle = await prisma.bundle.findUnique({
    where: { slug },
    include: {
      influencer: { select: { name: true, handle: true } },
      items: {
        include: {
          product: {
            include: { shop: { select: { name: true, marketName: true, city: true, phone: true } } },
          },
        },
      },
    },
  });
  if (!bundle || !bundle.active) notFound();

  const source = ["instagram", "tiktok", "telegram"].includes(utm_source ?? "")
    ? utm_source!
    : "other";
  await prisma.bundleClick.create({ data: { bundleId: bundle.id, source } });

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: 20 }}>
      <header style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 13, letterSpacing: 2, color: "#a8a29e" }}>LIBOS LOOK</div>
        <h1 style={{ fontSize: 28, margin: "8px 0" }}>{bundle.title}</h1>
        <div style={{ color: "#78716c" }}>
          curated by <b>{bundle.influencer.handle ?? bundle.influencer.name}</b>
        </div>
        {bundle.description && (
          <p style={{ color: "#57534e", marginTop: 12 }}>{bundle.description}</p>
        )}
        <a
          href={`libos://bundle/${bundle.slug}`}
          style={{ display: "inline-block", marginTop: 8, color: "#b45309", fontWeight: 600, textDecoration: "none" }}
        >
          Open in the Libos app →
        </a>
      </header>

      {bundle.items.map(({ product, note }) => (
        <section
          key={product.id}
          style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}
        >
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title}
              style={{ width: "100%", borderRadius: 12, objectFit: "cover", maxHeight: 360 }}
            />
          )}
          <h2 style={{ fontSize: 20, margin: "12px 0 4px" }}>{product.title}</h2>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {formatPrice(product.price, product.currency)}
          </div>
          <div style={{ color: "#78716c", fontSize: 14, marginTop: 4 }}>
            {product.shop.name}
            {product.shop.marketName ? ` · ${product.shop.marketName}` : ""} · {product.shop.city}
          </div>
          {product.sizes.length > 0 && (
            <div style={{ color: "#78716c", fontSize: 14 }}>Sizes: {product.sizes.join(", ")}</div>
          )}
          {note && (
            <p style={{ background: "#fef3c7", borderRadius: 8, padding: 10, fontSize: 14, marginTop: 8 }}>
              💬 {note}
            </p>
          )}
          <OrderForm slug={bundle.slug} productId={product.id} />
        </section>
      ))}

      <footer style={{ textAlign: "center", color: "#a8a29e", fontSize: 13, padding: 24 }}>
        Items sold by independent local-market sellers. The seller will call you
        to confirm your order.
      </footer>
    </main>
  );
}
