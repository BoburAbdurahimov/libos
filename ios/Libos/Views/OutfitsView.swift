import SwiftUI

struct OutfitsView: View {
    @State private var occasion = ""
    @State private var weather = ""
    @State private var suggestions: [OutfitSuggestion] = []
    @State private var loading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    GroupBox {
                        TextField("Occasion (date, work, wedding…)", text: $occasion)
                            .textFieldStyle(.roundedBorder)
                        TextField("Weather (hot, rainy…)", text: $weather)
                            .textFieldStyle(.roundedBorder)
                        Button {
                            suggest()
                        } label: {
                            if loading {
                                ProgressView().frame(maxWidth: .infinity)
                            } else {
                                Label("Style me", systemImage: "sparkles")
                                    .frame(maxWidth: .infinity).bold()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(loading)
                    } label: {
                        Text("What's the plan?")
                    }
                    .padding(.horizontal)

                    if let errorMessage {
                        Text(errorMessage).foregroundStyle(.red).padding(.horizontal)
                    }

                    ForEach(suggestions) { outfit in
                        OutfitCard(outfit: outfit)
                            .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("AI Stylist")
        }
    }

    private func suggest() {
        loading = true
        errorMessage = nil
        Task {
            defer { loading = false }
            do {
                suggestions = try await APIClient.shared.suggestOutfits(
                    occasion: occasion, weather: weather
                )
                if suggestions.isEmpty { errorMessage = "No outfit ideas — add more items to your wardrobe." }
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct OutfitCard: View {
    let outfit: OutfitSuggestion
    @State private var score: OutfitScore?
    @State private var tryOnResult: TryOnResult?
    @State private var busy = false

    var garments: [Garment] { (outfit.garments ?? []).compactMap { $0 } }

    var body: some View {
        GroupBox {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(garments) { garment in
                        RemoteImage(path: garment.imageUrl)
                            .frame(width: 90, height: 110)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            Text(outfit.rationale)
                .font(.subheadline).foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)

            if let score {
                HStack {
                    Text("\(score.score)/100").font(.title3).bold()
                        .foregroundStyle(score.score >= 70 ? .green : .orange)
                    Text(score.feedback).font(.caption).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let tryOnResult {
                VStack(alignment: .leading) {
                    RemoteImage(path: tryOnResult.resultImageUrl)
                        .frame(height: 220)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    if tryOnResult.isMock {
                        Text("Preview mode — real try-on coming soon")
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
            }

            HStack {
                Button("Score it") { scoreOutfit() }
                    .buttonStyle(.bordered)
                Button("Try on") { tryOn() }
                    .buttonStyle(.bordered)
                if busy { ProgressView() }
            }
        } label: {
            HStack {
                Text(outfit.name).bold()
                Spacer()
                Text(outfit.occasion).font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private func scoreOutfit() {
        busy = true
        Task {
            defer { busy = false }
            score = try? await APIClient.shared.scoreOutfit(garmentIds: outfit.garmentIds)
        }
    }

    private func tryOn() {
        busy = true
        Task {
            defer { busy = false }
            tryOnResult = try? await APIClient.shared.tryOn(garmentIds: outfit.garmentIds, productIds: [])
        }
    }
}
