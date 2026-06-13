import SwiftUI
import PhotosUI

struct WardrobeView: View {
    @State private var garments: [Garment] = []
    @State private var pickedItem: PhotosPickerItem?
    @State private var uploading = false
    @State private var errorMessage: String?

    private let columns = [GridItem(.adaptive(minimum: 110), spacing: 12)]

    var body: some View {
        NavigationStack {
            ScrollView {
                if uploading {
                    HStack {
                        ProgressView()
                        Text("AI is tagging your item…").foregroundStyle(.secondary)
                    }
                    .padding()
                }
                if let errorMessage {
                    Text(errorMessage).foregroundStyle(.red).padding(.horizontal)
                }
                if garments.isEmpty && !uploading {
                    ContentUnavailableView(
                        "Your wardrobe is empty",
                        systemImage: "tshirt",
                        description: Text("Add photos of your clothes — AI will sort them by category, color and style.")
                    )
                    .padding(.top, 60)
                }
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(garments) { garment in
                        GarmentCell(garment: garment)
                            .contextMenu {
                                Button(role: .destructive) { delete(garment) } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                    }
                }
                .padding(.horizontal)
            }
            .navigationTitle("Wardrobe")
            .toolbar {
                PhotosPicker(selection: $pickedItem, matching: .images) {
                    Label("Add", systemImage: "plus")
                }
            }
            .onChange(of: pickedItem) { _, item in
                guard let item else { return }
                upload(item)
            }
            .task { await reload() }
            .refreshable { await reload() }
        }
    }

    private func reload() async {
        do { garments = try await APIClient.shared.wardrobe() }
        catch { errorMessage = error.localizedDescription }
    }

    private func upload(_ item: PhotosPickerItem) {
        uploading = true
        errorMessage = nil
        Task {
            defer { uploading = false; pickedItem = nil }
            do {
                guard let data = try await item.loadTransferable(type: Data.self),
                      let image = UIImage(data: data),
                      let jpeg = image.jpegData(compressionQuality: 0.7) else {
                    errorMessage = "Could not read the photo"
                    return
                }
                let garment = try await APIClient.shared.addGarment(imageData: jpeg)
                garments.insert(garment, at: 0)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func delete(_ garment: Garment) {
        Task {
            do {
                try await APIClient.shared.deleteGarment(id: garment.id)
                garments.removeAll { $0.id == garment.id }
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct GarmentCell: View {
    let garment: Garment
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            RemoteImage(path: garment.imageUrl)
                .frame(height: 130)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            Text(garment.subcategory ?? garment.category)
                .font(.caption).bold().lineLimit(1)
            Text(garment.styleTags.prefix(2).joined(separator: " · "))
                .font(.caption2).foregroundStyle(.secondary).lineLimit(1)
        }
    }
}
