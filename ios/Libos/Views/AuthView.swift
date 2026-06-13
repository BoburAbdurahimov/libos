import SwiftUI

struct AuthView: View {
    @EnvironmentObject var appState: AppState
    @State private var isRegister = false
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var role: Role = .user
    @State private var handle = ""
    @State private var errorMessage: String?
    @State private var loading = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(spacing: 4) {
                        Text("Libos").font(.system(size: 40, weight: .bold, design: .serif))
                        Text("Your AI stylist. Local market finds.")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .listRowBackground(Color.clear)
                }

                Section {
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Password", text: $password)
                    if isRegister {
                        TextField("Name", text: $name)
                        Picker("I am a", selection: $role) {
                            Text("Shopper").tag(Role.user)
                            Text("Influencer").tag(Role.influencer)
                            Text("Seller").tag(Role.seller)
                        }
                        if role == .influencer {
                            TextField("Handle (e.g. @dilnoza.style)", text: $handle)
                                .textInputAutocapitalization(.never)
                        }
                    }
                }

                if let errorMessage {
                    Section { Text(errorMessage).foregroundStyle(.red) }
                }

                Section {
                    Button(action: submit) {
                        if loading { ProgressView().frame(maxWidth: .infinity) }
                        else {
                            Text(isRegister ? "Create account" : "Sign in")
                                .frame(maxWidth: .infinity).bold()
                        }
                    }
                    .disabled(loading || email.isEmpty || password.isEmpty || (isRegister && name.isEmpty))

                    Button(isRegister ? "I already have an account" : "Create a new account") {
                        isRegister.toggle()
                        errorMessage = nil
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle(isRegister ? "Register" : "Welcome")
        }
    }

    private func submit() {
        loading = true
        errorMessage = nil
        Task {
            defer { loading = false }
            do {
                let auth: AuthResponse
                if isRegister {
                    auth = try await APIClient.shared.register(
                        email: email, password: password, name: name,
                        role: role, handle: handle.isEmpty ? nil : handle
                    )
                } else {
                    auth = try await APIClient.shared.login(email: email, password: password)
                }
                appState.signIn(auth)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
