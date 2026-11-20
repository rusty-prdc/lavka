import SwiftUI

enum AppTheme {
    static let green = Color(hex: 0x10B981)
    static let greenDeep = Color(hex: 0x059669)
    static let greenSoft = Color(hex: 0xE7F8F1)
    static let ink = Color(hex: 0x0F172A)
    static let slate = Color(hex: 0x64748B)
    static let bgLight = Color(hex: 0xF1F5F9)
    static let bgDark = Color(hex: 0x070D15)
    static let cardDark = Color(hex: 0x101B2A)
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}

enum Money {
    private static let formatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "RUB"
        f.currencySymbol = "₽"
        f.maximumFractionDigits = 0
        f.locale = Locale(identifier: "ru_RU")
        return f
    }()

    static func rub(_ value: Double) -> String {
        formatter.string(from: NSNumber(value: value)) ?? "\(Int(value)) ₽"
    }
}

func rub(_ value: Double) -> String {
    Money.rub(value)
}

struct AppBackground: View {
    @EnvironmentObject private var store: BankStore

    var body: some View {
        let dark = store.data.settings.darkTheme

        ZStack {
            LinearGradient(
                colors: dark
                    ? [Color(hex: 0x0B1220), Color(hex: 0x070D15), Color(hex: 0x06120E)]
                    : [Color(hex: 0xF8FAFC), Color(hex: 0xEDF5F1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Circle()
                .fill(AppTheme.green.opacity(dark ? 0.20 : 0.12))
                .frame(width: 340, height: 340)
                .blur(radius: 90)
                .offset(x: 130, y: -190)
        }
        .ignoresSafeArea()
    }
}

struct SectionTitle: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.secondary)
            .textCase(.uppercase)
            .tracking(0.6)
    }
}

struct Pill: View {
    let text: String
    var tint: Color = AppTheme.green

    var body: some View {
        Text(text)
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(tint.opacity(0.16), in: Capsule())
            .foregroundStyle(tint)
    }
}
