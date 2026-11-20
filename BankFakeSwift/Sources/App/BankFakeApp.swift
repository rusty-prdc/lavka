import SwiftUI

@main
struct BankFakeApp: App {
    @StateObject private var store = BankStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
        }
    }
}
