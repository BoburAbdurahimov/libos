import SwiftUI

struct MarketView: View {
    @State private var products: [Product] = []
    @State private var query = ""
    @State private var category: String?
    @State private var errorMessage: String?

    private let categories = ["top", "bottom", "dress", "outerwear", "shoes", "accessory", "bag"]
    private let columns = [GridItem(.adaptive(minimum: 160), spacing: 12)]

    var body: some View {
        NavigationStack {
            ScrollView {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        FilterChip(title: "All", selected: category == nil) { category = nil; reload() }
                        ForEach(categories, id: \.self) { c in
                            FilterChip(title: c.capitalized, selected: category == c) {
                                category = c
                                reload()
                            }
                        }
                    }
                    .padding(.horizontal)
                }

                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red).padding()
                }

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(products) { product in
                        NavigationLink(value: product) {
                            ProductCell(product: product)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal)
            }
            .navigationTitle("Local Market")
            .navigationDestination(for: Product.self) { ProductDetailView(product: $0) }
            .searchable(text: $query, prompt: "Search clothes")
            .onSubmit(of: .search) { reload() }
            .task { reload() }
            .refreshable { reload() }
        }
    }

    private func reload() {
        Task {
            do {
                products = try await APIClient.shared.products(category: category, query: query)
                errorMessage = nil
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct FilterChip: View {
    let title: String
    let selected: Bool
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(selected ? Color.primary : Color(.systemGray5))
                .foregroundStyle(selected ? Color(.systemBackground) : .primary)
                .clipShape(Capsule())
        }
    }
}

struct ProductCell: View {
    let product: Product
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            RemoteImage(path: product.imageUrl)
                .frame(height: 170)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            Text(product.title).font(.subheadline).bold().lineLimit(1)
            Text(product.priceText).font(.subheadline)
            if let shop = product.shop {
                Text("\(shop.marketName ?? shop.name) · \(shop.city)")
                    .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
            }
        }
    }
}

struct ProductDetailView: View {
    let product: Product
    @State private var tryOnResult: TryOnResult?
    @State private var busy = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                RemoteImage(path: product.imageUrl)
                    .frame(maxWidth: .infinity)
                    .frame(height: 360)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                Text(product.title).font(.title2).bold()
                Text(product.priceText).font(.title3)
                if let shop = product.shop {
                    Label("\(shop.name)\(shop.marketName.map { " · \($0)" } ?? "") · \(shop.city)", systemImage: "mappin.and.ellipse")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                if !product.sizes.isEmpty {
                    Text("Sizes: \(product.sizes.joined(separator: ", "))")
                        .font(.subheadline)
                }
                if let description = product.description {
                    Text(description).foregroundStyle(.secondary)
                }

                Button {
                    tryOn()
                } label: {
                    if busy { ProgressView().frame(maxWidth: .infinity) }
                    else { Label("Try it on", systemImage: "person.crop.rectangle").frame(maxWidth: .infinity).bold() }
                }
                .buttonStyle(.borderedProminent)

                if let tryOnResult {
                    RemoteImage(path: tryOnResult.resultImageUrl)
                        .frame(height: 300)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    if tryOnResult.isMock {
                        Text("Preview mode — real AI try-on coming soon")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            .padding()
        }
        .navigationTitle(product.title)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func tryOn() {
        busy = true
        Task {
            defer { busy = false }
            tryOnResult = try? await APIClient.shared.tryOn(garmentIds: [], productIds: [product.id])
        }
    }
}
