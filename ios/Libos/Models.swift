import Foundation

enum Role: String, Codable, CaseIterable {
    case user = "USER"
    case influencer = "INFLUENCER"
    case seller = "SELLER"
    case admin = "ADMIN"
}

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let role: Role
    let handle: String?
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct Garment: Codable, Identifiable, Hashable {
    let id: String
    let imageUrl: String
    let category: String
    let subcategory: String?
    let colors: [String]
    let styleTags: [String]
    let season: String?
    let aiDescription: String?
}

struct OutfitSuggestion: Codable, Identifiable {
    var id: String { name + garmentIds.joined() }
    let name: String
    let garmentIds: [String]
    let occasion: String
    let rationale: String
    let garments: [Garment?]?
}

struct OutfitScore: Codable {
    let score: Int
    let feedback: String
    let suggestions: [String]
}

struct TryOnResult: Codable {
    let resultImageUrl: String
    let isMock: Bool
}

struct Shop: Codable, Identifiable {
    let id: String
    let name: String
    let marketName: String?
    let city: String
    let phone: String
    let description: String?
}

struct ProductShopInfo: Codable, Hashable {
    let name: String
    let marketName: String?
    let city: String
}

struct Product: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let description: String?
    let price: Int
    let currency: String
    let imageUrl: String?
    let category: String
    let sizes: [String]
    let inStock: Bool
    let shop: ProductShopInfo?

    var priceText: String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        return "\(f.string(from: NSNumber(value: price)) ?? "\(price)") \(currency)"
    }
}

struct BundleItem: Codable, Hashable {
    let productId: String
    let note: String?
    let product: Product
}

struct BundleCounts: Codable {
    let clicks: Int
    let orders: Int
}

struct Bundle: Codable, Identifiable {
    let id: String
    let slug: String
    let title: String
    let description: String?
    let commissionPct: Int
    let active: Bool
    let captionIg: String?
    let captionTiktok: String?
    let captionTg: String?
    let hashtags: [String]
    let shareUrl: String?
    let items: [BundleItem]
    let _count: BundleCounts?
}

struct BundleOrder: Codable, Identifiable {
    let id: String
    let buyerName: String
    let buyerPhone: String
    let priceAt: Int
    let currency: String
    let status: String
    let createdAt: String
}

struct BundleStats: Codable {
    let clicksBySource: [String: Int]
    let totalClicks: Int
    let totalOrders: Int
    let completedOrders: Int
    let commissionEarned: Int
    let currency: String
}

struct BundleDetail: Codable {
    let bundle: Bundle
    let stats: BundleStats
}

struct BundleCaptions: Codable {
    let instagram: String
    let tiktok: String
    let telegram: String
    let hashtags: [String]
}

struct APIError: Codable, Error, LocalizedError {
    let error: String
    var errorDescription: String? { error }
}
