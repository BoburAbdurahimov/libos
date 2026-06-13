import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var appState: AppState
    @AppStorage("baseURL") private var baseURL = "http://localhost:3000"

    var body: some View {
        NavigationStack {
            Form {
                if let user = appState.user {
                    Section("Account") {
                        LabeledContent("Name", value: user.name)
                        LabeledContent("Email", value: user.email)
                        LabeledContent("Role", value: user.role.rawValue.capitalized)
                        if let handle = user.handle {
                            LabeledContent("Handle", value: handle)
                        }
                    }
                }
                Section("Server") {
                    TextField("Backend URL", text: $baseURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Text("Simulator: http://localhost:3000 — physical device: http://<your-PC-LAN-IP>:3000")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Section {
                    Button("Sign out", role: .destructive) {
                        appState.signOut()
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}
