// Virtual try-on provider abstraction.
//
// Real try-on needs an image-generation model (e.g. IDM-VTON on fal.ai or
// Replicate, or Gemini image editing). Until a provider is chosen, the mock
// returns the garment/product image itself plus a flag the app uses to show
// a "preview" badge. To go live, implement TryOnProvider and swap `provider`.

export interface TryOnRequest {
  personImageUrl?: string; // user's avatar photo
  itemImageUrls: string[]; // garments or products to try on
}

export interface TryOnResult {
  resultImageUrl: string;
  isMock: boolean;
}

export interface TryOnProvider {
  render(req: TryOnRequest): Promise<TryOnResult>;
}

class MockTryOnProvider implements TryOnProvider {
  async render(req: TryOnRequest): Promise<TryOnResult> {
    return {
      resultImageUrl: req.itemImageUrls[0] ?? "/placeholder-tryon.png",
      isMock: true,
    };
  }
}

export const tryOnProvider: TryOnProvider = new MockTryOnProvider();
