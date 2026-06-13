# Libos

An AI fashion-stylist app (inspired by [aesty.ai](https://www.aesty.ai/)) with a marketing
twist for local markets: **influencers curate bundles of clothes from local-market sellers
and advertise them on social media** with AI-written captions and a shareable landing page.

- **Native iOS app** (SwiftUI) — the product, like Aesty.
- **Next.js + Prisma + PostgreSQL backend** — REST API + the public bundle landing pages.
- **Claude** powers garment tagging, outfit suggestions, outfit scoring and social captions.

> Try-on is provider-abstracted and ships in **mock/preview mode**. Plug in an image model
> (fal.ai IDM-VTON, Replicate, Gemini image) by implementing `TryOnProvider` in
> `backend/src/lib/tryon.ts`.

---

## What it does

| Aesty-style stylist | Libos marketing feature |
|---|---|
| Snap clothes → AI tags category/color/style/season into a digital wardrobe | Influencers build **bundles** from local-market products |
| AI composes outfits from your own wardrobe (occasion + weather aware) | AI writes per-network captions (Instagram / TikTok / Telegram) |
| AI scores any outfit 0–100 with feedback | A public landing page `/b/{slug}` shows the look + "I want this" |
| Virtual try-on preview | Each visit is click-tracked by `utm_source`; shoppers leave an order request |
| Browse local-market catalog and try items on | Influencer dashboard: clicks by source, orders, commission earned |

Roles: `USER` (shopper), `INFLUENCER`, `SELLER` (market shop owner), `ADMIN`.

---

## Backend

```bash
cd backend
cp .env.example .env        # set DATABASE_URL, JWT_SECRET; ANTHROPIC_API_KEY optional
npm install
npm run db:push             # create tables (needs a reachable Postgres)
npm run seed                # demo users, a Chorsu shop, products, a bundle
npm run dev                 # http://localhost:3000
```

- **No `ANTHROPIC_API_KEY`?** The app runs in **mock-AI mode** — tagging, outfits, scoring and
  captions return deterministic placeholders so you can develop and demo at zero cost. Set the
  key to switch on real Claude (`CLAUDE_MODEL` defaults to `claude-opus-4-8`).
- Postgres: a free [Neon](https://neon.tech) database works as `DATABASE_URL`.
- Uploaded photos are stored on local disk under `backend/public/uploads/`. Swap `saveImage()`
  in `src/lib/storage.ts` for Vercel Blob / S3 in production.

### Seeded logins (password: `password123`)
- `influencer@libos.uz` — has the demo bundle `/b/summer-bazaar-look-demo01`
- `seller@libos.uz` — owns the Chorsu shop + products
- `user@libos.uz` — a shopper

### API surface
Auth `POST /api/auth/{register,login}`, `GET /api/me` ·
Wardrobe `GET/POST /api/wardrobe`, `DELETE /api/wardrobe/{id}` ·
Outfits `POST /api/outfits/{suggest,score}`, try-on `POST /api/tryon` ·
Market `GET /api/products`, `GET/POST /api/shops`, `GET/POST /api/shops/{id}/products` ·
Bundles `GET/POST /api/bundles`, `GET/PATCH /api/bundles/{id}`, `POST /api/bundles/{id}/caption` ·
Public `POST /api/b/{slug}/order`, landing page `/b/{slug}`.

---

## iOS app

The app is SwiftUI (iOS 17+). The project is defined with **XcodeGen** (`ios/project.yml`) so the
`.xcodeproj` isn't committed.

**You are on Windows, so you can't build iOS locally.** Options:
1. **Mac / Mac-in-the-cloud** (MacStadium, AWS EC2 Mac): `brew install xcodegen`, then
   `cd ios && xcodegen generate && open Libos.xcodeproj`, build to a simulator.
2. **Cloud CI** (e.g. Codemagic, Xcode Cloud, GitHub Actions `macos-latest`): run `xcodegen` then
   `xcodebuild`.

In **Profile → Server**, point the app at your backend:
- Simulator: `http://localhost:3000`
- Physical device: `http://<your-PC-LAN-IP>:3000` (same Wi-Fi; ATS arbitrary-loads is enabled for dev).

### Screens
`AuthView` (register/login, role picker) · `WardrobeView` (PhotosPicker upload → AI tags) ·
`OutfitsView` (AI stylist, score, try-on) · `MarketView` (catalog, product detail, try-on) ·
`BundlesView` (create bundle, AI captions, per-network `ShareLink`, analytics dashboard) ·
`ProfileView`. Deep link `libos://bundle/{slug}` opens a shared bundle in-app.

---

## Architecture notes
- `requireUser(req, roles)` gates every protected route; `ADMIN` passes all role checks.
- AI calls use Claude **structured outputs** (`output_config.format` + JSON schema) so responses
  parse reliably; outfit suggestions are filtered against real garment IDs to drop hallucinations.
- Bundle order prices are **snapshotted** (`priceAt`) so influencer commission stays correct if a
  seller later changes the price.
- AI failures map to clean HTTP statuses via `aiErrorMessage()` (401→invalid key, 429→busy, etc.).
