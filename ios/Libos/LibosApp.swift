import SwiftUI

@MainActor
final class AppState: ObservableObject {
    @Published var user: User?
    @Published var deepLinkBundleSlug: String?

    init() {
        if let data = UserDefaults.standard.data(forKey: "user"),
           let user = try? JSONDecoder().decode(User.self, from: data),
           APIClient.shared.token != nil {
            self.user = user
        }
    }

    func signIn(_ auth: AuthResponse) {
        APIClient.shared.token = auth.token
        user = auth.user
        if let data = try? JSONEncoder().encode(auth.user) {
            UserDefaults.standard.set(data, forKey: "user")
        }
    }

    func signOut() {
        APIClient.shared.token = nil
        UserDefaults.standard.removeObject(forKey: "user")
        user = nil
    }
}

@main
struct LibosApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            Group {
                if appState.user != nil {
                    MainTabView()
                } else {
                    AuthView()
                }
            }
            .environmentObject(appState)
            .onOpenURL { url in
                // libos://bundle/<slug> from the share landing page
                guard url.scheme == "libos", url.host == "bundle" else { return }
                appState.deepLinkBundleSlug = url.lastPathComponent
            }
        }
    }
}
