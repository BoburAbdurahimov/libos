import SwiftUI

struct BundlesView: View {
    @State private var bundles: [Bundle] = []
    @State private var showCreate = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List {
                if bundles.isEmpty {
                    ContentUnavailableView(
                        "No bundles yet",
                        systemImage: "megaphone",
                        description: Text("Curate looks from local-market products, get an AI caption and share the link on Instagram, TikTok or Telegram. You earn a commission on every confirmed order.")
                    )
                }
                ForEach(bundles) { bundle in
                    NavigationLink(value: bundle.id) {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(bundle.title).bold()
                                if !bundle.active {
                                    Text("paused").font(.caption2)
                                        .padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(Color(.systemGray5)).clipShape(Capsule())
                                }
                            }
                            Text("\(bundle.items.count) items · \(bundle.commissionPct)% commission")
                                .font(.caption).foregroundStyle(.secondary)
                            if let count = bundle._count {
                                Text("\(count.clicks) clicks · \(count.orders) orders")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("My Bundles")
            .navigationDestination(for: String.self) { BundleDetailScreen(bundleId: $0) }
            .toolbar {
                Button { showCreate = true } label: { Label("New", systemImage: "plus") }
            }
            .sheet(isPresented: $showCreate, onDismiss: { reload() }) {
                CreateBundleView()
            }
            .task { reload() }
            .refreshable { reload() }
        }
    }

    private func reload() {
        Task {
            do { bundles = try await APIClient.shared.myBundles() }
            catch { errorMessage = error.localizedDescription }
        }
    }
}

struct CreateBundleView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var details = ""
    @State private var commission = 10
    @State private var products: [Product] = []
    @State private var selected: Set<String> = []
    @State private var errorMessage: String?
    @State private var saving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Bundle") {
                    TextField("Title (e.g. Summer bazaar look)", text: $title)
                    TextField("Description", text: $details, axis: .vertical)
                    Stepper("Commission: \(commission)%", value: $commission, in: 0...50)
                }
                Section("Pick products (\(selected.count) selected)") {
                    ForEach(products) { product in
                        Button {
                            if selected.contains(product.id) { selected.remove(product.id) }
                            else { selected.insert(product.id) }
                        } label: {
                            HStack {
                                RemoteImage(path: product.imageUrl)
                                    .frame(width: 44, height: 44)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                VStack(alignment: .leading) {
                                    Text(product.title).foregroundStyle(.primary)
                                    Text(product.priceText).font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: selected.contains(product.id) ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(selected.contains(product.id) ? .green : .secondary)
                            }
                        }
                    }
                }
                if let errorMessage {
                    Section { Text(errorMessage).foregroundStyle(.red) }
                }
            }
            .navigationTitle("New Bundle")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(saving ? "Saving…" : "Create") { create() }
                        .disabled(saving || title.isEmpty || selected.isEmpty)
                }
            }
            .task {
                products = (try? await APIClient.shared.products()) ?? []
            }
        }
    }

    private func create() {
        saving = true
        Task {
            defer { saving = false }
            do {
                _ = try await APIClient.shared.createBundle(
                    title: title,
                    description: details,
                    productIds: Array(selected),
                    commissionPct: commission
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct BundleDetailScreen: View {
    let bundleId: String
    @State private var detail: BundleDetail?
    @State private var captions: BundleCaptions?
    @State private var generating = false
    @State private var errorMessage: String?

    var body: some View {
        List {
            if let detail {
                let bundle = detail.bundle
                let stats = detail.stats

                Section("Performance") {
                    LabeledContent("Clicks", value: "\(stats.totalClicks)")
                    ForEach(stats.clicksBySource.sorted(by: { $0.value > $1.value }), id: \.key) { source, count in
                        LabeledContent("  via \(source)", value: "\(count)")
                    }
                    LabeledContent("Orders", value: "\(stats.totalOrders)")
                    LabeledContent("Completed", value: "\(stats.completedOrders)")
                    LabeledContent("Commission earned", value: "\(stats.commissionEarned) \(stats.currency)")
                }

                Section("Share") {
                    if let shareUrl = bundle.shareUrl, let url = URL(string: shareUrl) {
                        // Per-network links so clicks are attributed correctly
                        ShareLink(item: shareLink(url, source: "instagram"),
                                  message: Text(captions?.instagram ?? bundle.captionIg ?? bundle.title)) {
                            Label("Share to Instagram", systemImage: "camera")
                        }
                        ShareLink(item: shareLink(url, source: "tiktok"),
                                  message: Text(captions?.tiktok ?? bundle.captionTiktok ?? bundle.title)) {
                            Label("Share to TikTok", systemImage: "music.note")
                        }
                        ShareLink(item: shareLink(url, source: "telegram"),
                                  message: Text(captions?.telegram ?? bundle.captionTg ?? bundle.title)) {
                            Label("Share to Telegram", systemImage: "paperplane")
                        }
                    }
                    Button {
                        generateCaptions()
                    } label: {
                        if generating {
                            HStack { ProgressView(); Text("Writing captions…") }
                        } else {
                            Label("AI captions for socials", systemImage: "sparkles")
                        }
                    }
                    .disabled(generating)
                }

                if let captions {
                    Section("Captions") {
                        CaptionRow(network: "Instagram", text: captions.instagram)
                        CaptionRow(network: "TikTok", text: captions.tiktok)
                        CaptionRow(network: "Telegram", text: captions.telegram)
                        Text(captions.hashtags.joined(separator: " "))
                            .font(.caption).foregroundStyle(.blue)
                    }
                }

                Section("Items") {
                    ForEach(bundle.items, id: \.productId) { item in
                        HStack {
                            RemoteImage(path: item.product.imageUrl)
                                .frame(width: 44, height: 44)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                            VStack(alignment: .leading) {
                                Text(item.product.title)
                                Text(item.product.priceText).font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                Section {
                    Button(bundle.active ? "Pause bundle" : "Activate bundle") {
                        toggleActive(bundle)
                    }
                    .foregroundStyle(bundle.active ? .orange : .green)
                }
            } else if let errorMessage {
                Text(errorMessage).foregroundStyle(.red)
            } else {
                ProgressView()
            }
        }
        .navigationTitle(detail?.bundle.title ?? "Bundle")
        .task { await reload() }
        .refreshable { await reload() }
    }

    private func shareLink(_ url: URL, source: String) -> URL {
        URL(string: "\(url.absoluteString)?utm_source=\(source)") ?? url
    }

    private func reload() async {
        do { detail = try await APIClient.shared.bundleDetail(id: bundleId) }
        catch { errorMessage = error.localizedDescription }
    }

    private func generateCaptions() {
        generating = true
        Task {
            defer { generating = false }
            do {
                captions = try await APIClient.shared.generateCaptions(bundleId: bundleId).captions
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func toggleActive(_ bundle: Bundle) {
        Task {
            _ = try? await APIClient.shared.setBundleActive(id: bundle.id, active: !bundle.active)
            await reload()
        }
    }
}

struct CaptionRow: View {
    let network: String
    let text: String
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(network).font(.caption).bold().foregroundStyle(.secondary)
                Spacer()
                Button {
                    UIPasteboard.general.string = text
                } label: {
                    Image(systemName: "doc.on.doc").font(.caption)
                }
            }
            Text(text).font(.subheadline)
        }
    }
}
