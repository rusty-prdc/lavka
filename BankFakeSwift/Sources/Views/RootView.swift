import SwiftUI

final class TabRouter: ObservableObject {
    @Published var tab: Int = 0
}

struct RootView: View {
    @EnvironmentObject private var store: BankStore
    @StateObject private var router = TabRouter()

    var body: some View {
        TabView(selection: $router.tab) {
            HomeView()
                .tabItem { Label("Главная", systemImage: "house.fill") }
                .tag(0)

            PaymentsView()
                .tabItem { Label("Платежи", systemImage: "bolt.fill") }
                .tag(1)

            HistoryView()
                .tabItem { Label("История", systemImage: "clock.arrow.circlepath") }
                .tag(2)

            CardsView()
                .tabItem { Label("Карты", systemImage: "rectangle.stack.fill") }
                .tag(3)

            ProfileView()
                .tabItem { Label("Профиль", systemImage: "person.crop.circle.fill") }
                .tag(4)
        }
        .environmentObject(router)
        .tint(AppTheme.green)
        .preferredColorScheme(store.data.settings.darkTheme ? .dark : .light)
    }
}
