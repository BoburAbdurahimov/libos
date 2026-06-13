import Foundation

/// Thin JSON client for the Libos backend.
/// Base URL is configurable in Profile → Server (simulator can use localhost;
/// a physical device needs your computer's LAN IP).
final class APIClient {
    static let shared = APIClient()

    var baseURL: URL {
        let raw = UserDefaults.standard.string(forKey: "baseURL") ?? "http://localhost:3000"
        return URL(string: raw) ?? URL(string: "http://localhost:3000")!
    }

    var token: String? {
        get { UserDefaults.standard.string(forKey: "token") }
        set { UserDefaults.standard.set(newValue, forKey: "token") }
    }

    func absoluteImageURL(_ path: String) -> URL? {
        if path.hasPrefix("http") { return URL(string: path) }
        return URL(string: path, relativeTo: baseURL)
    }

    private func request<T: Decodable>(
        _ method: String,
        _ path: String,
        body: [String: Any]? = nil,
        as type: T.Type
    ) async throws -> T {
        var req = URLRequest(url: baseURL.appending(path: path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        if let body {
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        if !(200...299).contains(http.statusCode) {
            if let apiError = try? JSONDecoder().decode(APIError.self, from: data) { throw apiError }
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: Auth
    func register(email: String, password: String, name: String, role: Role, handle: String?) async throws -> AuthResponse {
        var body: [String: Any] = ["email": email, "password": password, "name": name, "role": role.rawValue]
        if let handle, !handle.isEmpty { body["handle"] = handle }
        return try await request("POST", "/api/auth/register", body: body, as: AuthResponse.self)
    }

    func login(email: String, password: String) async throws -> AuthResponse {
        try await request("POST", "/api/auth/login", body: ["email": email, "password": password], as: AuthResponse.self)
    }

    // MARK: Wardrobe
    struct GarmentsResponse: Codable { let garments: [Garment] }
    struct GarmentResponse: Codable { let garment: Garment }

    func wardrobe() async throws -> [Garment] {
        try await request("GET", "/api/wardrobe", as: GarmentsResponse.self).garments
    }

    func addGarment(imageData: Data) async throws -> Garment {
        try await request(
            "POST", "/api/wardrobe",
            body: ["imageBase64": imageData.base64EncodedString(), "mediaType": "image/jpeg"],
            as: GarmentResponse.self
        ).garment
    }

    func deleteGarment(id: String) async throws {
        struct OK: Codable { let ok: Bool }
        _ = try await request("DELETE", "/api/wardrobe/\(id)", as: OK.self)
    }

    // MARK: Outfits
    struct SuggestResponse: Codable { let outfits: [OutfitSuggestion] }

    func suggestOutfits(occasion: String?, weather: String?) async throws -> [OutfitSuggestion] {
        var body: [String: Any] = [:]
        if let occasion, !occasion.isEmpty { body["occasion"] = occasion }
        if let weather, !weather.isEmpty { body["weather"] = weather }
        return try await request("POST", "/api/outfits/suggest", body: body, as: SuggestResponse.self).outfits
    }

    func scoreOutfit(garmentIds: [String]) async throws -> OutfitScore {
        try await request("POST", "/api/outfits/score", body: ["garmentIds": garmentIds], as: OutfitScore.self)
    }

    func tryOn(garmentIds: [String], productIds: [String]) async throws -> TryOnResult {
        try await request("POST", "/api/tryon", body: ["garmentIds": garmentIds, "productIds": productIds], as: TryOnResult.self)
    }

    // MARK: Market
    struct ProductsResponse: Codable { let products: [Product] }

    func products(category: String? = nil, city: String? = nil, query: String? = nil) async throws -> [Product] {
        var components = URLComponents(url: baseURL.appending(path: "/api/products"), resolvingAgainstBaseURL: false)!
        var items: [URLQueryItem] = []
        if let category { items.append(.init(name: "category", value: category)) }
        if let city, !city.isEmpty { items.append(.init(name: "city", value: city)) }
        if let query, !query.isEmpty { items.append(.init(name: "q", value: query)) }
        components.queryItems = items.isEmpty ? nil : items
        let path = components.url!.path + (components.url!.query.map { "?\($0)" } ?? "")
        return try await request("GET", path, as: ProductsResponse.self).products
    }

    // MARK: Bundles (influencer)
    struct BundlesResponse: Codable { let bundles: [Bundle] }
    struct BundleResponse: Codable { let bundle: Bundle }
    struct CaptionsResponse: Codable { let captions: BundleCaptions; let shareUrl: String }

    func myBundles() async throws -> [Bundle] {
        try await request("GET", "/api/bundles", as: BundlesResponse.self).bundles
    }

    func createBundle(title: String, description: String?, productIds: [String], commissionPct: Int) async throws -> Bundle {
        var body: [String: Any] = ["title": title, "productIds": productIds, "commissionPct": commissionPct]
        if let description, !description.isEmpty { body["description"] = description }
        return try await request("POST", "/api/bundles", body: body, as: BundleResponse.self).bundle
    }

    func bundleDetail(id: String) async throws -> BundleDetail {
        try await request("GET", "/api/bundles/\(id)", as: BundleDetail.self)
    }

    func generateCaptions(bundleId: String) async throws -> CaptionsResponse {
        try await request("POST", "/api/bundles/\(bundleId)/caption", as: CaptionsResponse.self)
    }

    func setBundleActive(id: String, active: Bool) async throws -> Bundle {
        try await request("PATCH", "/api/bundles/\(id)", body: ["active": active], as: BundleResponse.self).bundle
    }
}
