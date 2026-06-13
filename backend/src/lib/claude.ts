import Anthropic from "@anthropic-ai/sdk";
import type { Garment, Product } from "@prisma/client";

const MODEL = process.env.CLAUDE_MODEL || "claude-opus-4-8";

// When ANTHROPIC_API_KEY is empty the app runs in mock mode so development
// and demos cost nothing. Every function below has a mock branch.
export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

type MediaType = "image/jpeg" | "image/png" | "image/webp";

async function jsonRequest<T>(opts: {
  system: string;
  content: Anthropic.ContentBlockParam[];
  schema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    thinking: { type: "adaptive" },
    system: opts.system,
    output_config: {
      format: { type: "json_schema", schema: opts.schema },
    },
    messages: [{ role: "user", content: opts.content }],
  });
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Empty AI response");
  return JSON.parse(text.text) as T;
}

// ---------- Garment tagging (vision) ----------

export interface GarmentTags {
  category: string;
  subcategory: string;
  colors: string[];
  styleTags: string[];
  season: string;
  description: string;
}

const GARMENT_SCHEMA = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["top", "bottom", "dress", "outerwear", "shoes", "accessory", "bag"],
    },
    subcategory: { type: "string" },
    colors: { type: "array", items: { type: "string" } },
    styleTags: { type: "array", items: { type: "string" } },
    season: { type: "string", enum: ["summer", "winter", "demi", "all"] },
    description: { type: "string" },
  },
  required: ["category", "subcategory", "colors", "styleTags", "season", "description"],
  additionalProperties: false,
} as const;

export async function tagGarment(
  imageBase64: string,
  mediaType: MediaType
): Promise<GarmentTags> {
  if (!aiEnabled()) {
    return {
      category: "top",
      subcategory: "t-shirt",
      colors: ["white"],
      styleTags: ["casual", "basic"],
      season: "all",
      description: "Mock-tagged garment (set ANTHROPIC_API_KEY for real AI).",
    };
  }
  return jsonRequest<GarmentTags>({
    system:
      "You are a fashion cataloguing assistant. Analyze the clothing item in the photo and return precise tags. Use lowercase English for all values. styleTags are aesthetics like casual, formal, streetwear, vintage, sporty, minimalist.",
    content: [
      {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: imageBase64 },
      },
      { type: "text", text: "Tag this clothing item." },
    ],
    schema: GARMENT_SCHEMA as unknown as Record<string, unknown>,
  });
}

// ---------- Outfit suggestions ----------

export interface OutfitSuggestion {
  name: string;
  garmentIds: string[];
  occasion: string;
  rationale: string;
}

function wardrobeAsText(garments: Garment[]) {
  return garments
    .map(
      (g) =>
        `- id=${g.id} | ${g.category}${g.subcategory ? "/" + g.subcategory : ""} | colors: ${g.colors.join(",")} | style: ${g.styleTags.join(",")} | season: ${g.season ?? "all"} | ${g.aiDescription ?? ""}`
    )
    .join("\n");
}

export async function suggestOutfits(
  garments: Garment[],
  context: { occasion?: string; weather?: string }
): Promise<OutfitSuggestion[]> {
  if (!aiEnabled()) {
    const ids = garments.slice(0, 3).map((g) => g.id);
    return [
      {
        name: "Mock look",
        garmentIds: ids,
        occasion: context.occasion ?? "everyday",
        rationale: "Mock suggestion (set ANTHROPIC_API_KEY for real AI).",
      },
    ];
  }
  const result = await jsonRequest<{ outfits: OutfitSuggestion[] }>({
    system:
      "You are a personal stylist. Compose outfits ONLY from the user's wardrobe items listed below, referencing items strictly by their id. Each outfit should be coherent in color, style and season. Suggest up to 3 outfits.",
    content: [
      {
        type: "text",
        text: `Wardrobe:\n${wardrobeAsText(garments)}\n\nOccasion: ${context.occasion ?? "any"}\nWeather: ${context.weather ?? "unknown"}`,
      },
    ],
    schema: {
      type: "object",
      properties: {
        outfits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              garmentIds: { type: "array", items: { type: "string" } },
              occasion: { type: "string" },
              rationale: { type: "string" },
            },
            required: ["name", "garmentIds", "occasion", "rationale"],
            additionalProperties: false,
          },
        },
      },
      required: ["outfits"],
      additionalProperties: false,
    },
  });
  // Drop any hallucinated ids so the client never gets dangling references
  const known = new Set(garments.map((g) => g.id));
  return result.outfits
    .map((o) => ({ ...o, garmentIds: o.garmentIds.filter((id) => known.has(id)) }))
    .filter((o) => o.garmentIds.length > 0);
}

// ---------- Outfit scoring ----------

export interface OutfitScore {
  score: number;
  feedback: string;
  suggestions: string[];
}

export async function scoreOutfit(garments: Garment[]): Promise<OutfitScore> {
  if (!aiEnabled()) {
    return {
      score: 78,
      feedback: "Mock score (set ANTHROPIC_API_KEY for real AI).",
      suggestions: ["Add an accent accessory"],
    };
  }
  return jsonRequest<OutfitScore>({
    system:
      "You are a candid but encouraging fashion stylist. Score the outfit 0-100 for color harmony, style coherence and occasion fit. Give short actionable feedback.",
    content: [{ type: "text", text: `Outfit items:\n${wardrobeAsText(garments)}` }],
    schema: {
      type: "object",
      properties: {
        score: { type: "integer" },
        feedback: { type: "string" },
        suggestions: { type: "array", items: { type: "string" } },
      },
      required: ["score", "feedback", "suggestions"],
      additionalProperties: false,
    },
  });
}

// ---------- Bundle social captions (the marketing feature) ----------

export interface BundleCaptions {
  instagram: string;
  tiktok: string;
  telegram: string;
  hashtags: string[];
}

export async function generateBundleCaptions(input: {
  title: string;
  description?: string | null;
  influencerHandle?: string | null;
  shareUrl: string;
  products: (Product & { shopName: string; marketName?: string | null; city: string })[];
}): Promise<BundleCaptions> {
  if (!aiEnabled()) {
    const line = `${input.title} — shop the look: ${input.shareUrl}`;
    return {
      instagram: line,
      tiktok: line,
      telegram: line,
      hashtags: ["#style", "#localfashion"],
    };
  }
  const productsText = input.products
    .map(
      (p) =>
        `- ${p.title} (${p.category}) — ${p.price} ${p.currency}, from "${p.shopName}"${p.marketName ? " at " + p.marketName : ""}, ${p.city}`
    )
    .join("\n");
  return jsonRequest<BundleCaptions>({
    system:
      "You are a social media copywriter for fashion influencers who promote affordable clothes from local markets. Write captions that feel personal and authentic, not corporate. Mention that items are from local markets/bazaars (that's the selling point: real finds, fair prices). Always include the share link. Instagram: 2-4 short paragraphs with tasteful emoji. TikTok: 1-2 punchy lines. Telegram: warm, conversational, can be longer. hashtags: 8-12 relevant tags, each starting with #. Write in the same language as the bundle title (Uzbek, Russian or English).",
    content: [
      {
        type: "text",
        text: `Bundle: ${input.title}\nDescription: ${input.description ?? "-"}\nInfluencer: ${input.influencerHandle ?? "-"}\nShare link: ${input.shareUrl}\nItems:\n${productsText}`,
      },
    ],
    schema: {
      type: "object",
      properties: {
        instagram: { type: "string" },
        tiktok: { type: "string" },
        telegram: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } },
      },
      required: ["instagram", "tiktok", "telegram", "hashtags"],
      additionalProperties: false,
    },
  });
}

// Uniform error → HTTP mapping for routes that call the AI
export function aiErrorMessage(err: unknown): { message: string; status: number } {
  if (err instanceof Anthropic.APIError) {
    if (err instanceof Anthropic.AuthenticationError)
      return { message: "AI service: invalid API key", status: 502 };
    if (err instanceof Anthropic.RateLimitError)
      return { message: "AI service is busy, try again shortly", status: 503 };
    return { message: `AI service error (${err.status})`, status: 502 };
  }
  return { message: "AI request failed", status: 502 };
}
