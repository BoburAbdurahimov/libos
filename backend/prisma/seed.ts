import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const seller = await prisma.user.upsert({
    where: { email: "seller@libos.uz" },
    update: {},
    create: { email: "seller@libos.uz", passwordHash: password, name: "Karim aka", role: "SELLER" },
  });

  const influencer = await prisma.user.upsert({
    where: { email: "influencer@libos.uz" },
    update: {},
    create: {
      email: "influencer@libos.uz",
      passwordHash: password,
      name: "Dilnoza",
      role: "INFLUENCER",
      handle: "@dilnoza.style",
    },
  });

  await prisma.user.upsert({
    where: { email: "user@libos.uz" },
    update: {},
    create: { email: "user@libos.uz", passwordHash: password, name: "Aziza", role: "USER" },
  });

  const shop = await prisma.shop.create({
    data: {
      ownerId: seller.id,
      name: "Karim Fashion",
      marketName: "Chorsu Bazaar",
      city: "Tashkent",
      phone: "+998 90 123 45 67",
      description: "Quality clothes at bazaar prices, row 14, stall 3.",
    },
  });

  const products = await Promise.all(
    [
      { title: "Oversized linen shirt", price: 180000, category: "top", sizes: ["S", "M", "L"] },
      { title: "Wide-leg trousers", price: 220000, category: "bottom", sizes: ["M", "L"] },
      { title: "Leather sandals", price: 250000, category: "shoes", sizes: ["37", "38", "39", "40"] },
      { title: "Straw tote bag", price: 95000, category: "bag", sizes: [] },
    ].map((p) =>
      prisma.product.create({
        data: { shopId: shop.id, currency: "UZS", ...p },
      })
    )
  );

  await prisma.bundle.create({
    data: {
      influencerId: influencer.id,
      slug: "summer-bazaar-look-demo01",
      title: "Summer bazaar look",
      description: "My favourite light summer outfit — everything from Chorsu, total under 750k.",
      commissionPct: 10,
      items: { create: products.map((p) => ({ productId: p.id })) },
    },
  });

  console.log("Seeded: 3 users (password123), 1 shop, 4 products, 1 bundle");
  console.log("Demo bundle: /b/summer-bazaar-look-demo01");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
