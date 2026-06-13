import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        TabView {
            WardrobeView()
                .tabItem { Label("Wardrobe", systemImage: "tshirt") }
            OutfitsView()
                .tabItem { Label("Outfits", systemImage: "sparkles") }
            MarketView()
                .tabItem { Label("Market", systemImage: "basket") }
            if appState.user?.role == .influencer || appState.user?.role == .admin {
                BundlesView()
                    .tabItem { Label("Bundles", systemImage: "megaphone") }
            }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.circle") }
        }
    }
}

/// AsyncImage wrapper that resolves backend-relative /uploads/... paths.
struct RemoteImage: View {
    let path: String?
    var body: some View {
        if let path, let url = APIClient.shared.absoluteImageURL(path) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image): image.resizable().scaledToFill()
                case .failure: placeholder
                default: ProgressView()
                }
            }
        } else {
            placeholder
        }
    }
    private var placeholder: some View {
        ZStack {
            Color(.systemGray5)
            Image(systemName: "tshirt").font(.largeTitle).foregroundStyle(.secondary)
        }
    }
}
