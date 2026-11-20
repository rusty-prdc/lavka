import Foundation

// MARK: - Card

enum CardBrand: String, Codable, CaseIterable, Identifiable {
    case visa = "Visa"
    case mastercard = "Mastercard"
    case mir = "Мир"

    var id: String { rawValue }

    var mark: String {
        switch self {
        case .visa: return "VISA"
        case .mastercard: return "MC"
        case .mir: return "МИР"
        }
    }
}

struct BankCard: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var title: String
    var number: String
    var brand: CardBrand
    var balance: Double
    var frozen: Bool = false
    var hue: Double
    var gold: Bool = false
    var expiry: String = "12/28"
    var holder: String = "MAX XPRODC"

    var last4: String { String(number.suffix(4)) }
    var masked: String { "•••• \(last4)" }
    var requisites: String { "\(number) · \(expiry)" }
    var digitsOnly: String { number.filter(\.isNumber) }
}

// MARK: - Transaction

enum TxCategory: String, Codable, CaseIterable, Identifiable {
    case groceries, transport, cafe, shopping, transfer, utilities, income, other

    var id: String { rawValue }

    var title: String {
        switch self {
        case .groceries: return "Продукты"
        case .transport: return "Транспорт"
        case .cafe: return "Кафе"
        case .shopping: return "Покупки"
        case .transfer: return "Переводы"
        case .utilities: return "ЖКХ"
        case .income: return "Доход"
        case .other: return "Другое"
        }
    }

    var icon: String {
        switch self {
        case .groceries: return "cart.fill"
        case .transport: return "bus.fill"
        case .cafe: return "cup.and.saucer.fill"
        case .shopping: return "bag.fill"
        case .transfer: return "arrow.left.arrow.right"
        case .utilities: return "bolt.fill"
        case .income: return "arrow.down.left"
        case .other: return "ellipsis.circle.fill"
        }
    }
}

struct Transaction: Identifiable, Codable, Hashable {
    var id: UUID = UUID()
    var title: String
    var amount: Double
    var category: TxCategory
    var date: Date
    var note: String? = nil

    var isIncome: Bool { amount > 0 }
}

// MARK: - User & settings

struct User: Codable, Equatable {
    var xid: String
    var name: String
    var email: String

    var isAdmin: Bool { xid.uppercased() == "X-8" }
    var initials: String {
        let parts = name.split(separator: " ")
        let letters = parts.prefix(2).compactMap { $0.first }
        return String(letters).uppercased()
    }
}

struct Settings: Codable, Equatable {
    var darkTheme: Bool = true
    var notifications: Bool = true
    var sound: Bool = true
    var hideBalance: Bool = false
}

// MARK: - Root data

struct AppData: Codable {
    var bankName: String
    var balance: Double
    var cards: [BankCard]
    var transactions: [Transaction]
    var user: User
    var settings: Settings
}

extension AppData {
    static func demo() -> AppData {
        let now = Date()
        let cards: [BankCard] = [
            BankCard(title: "XPRODC Card",
                     number: "2202 4812 9034 4821",
                     brand: .mir,
                     balance: 84_200,
                     hue: 158),
            BankCard(title: "Золотая",
                     number: "4276 5500 1188 9037",
                     brand: .visa,
                     balance: 44_200,
                     hue: 42,
                     gold: true)
        ]

        let txs: [Transaction] = [
            Transaction(title: "Лавка", amount: -2_400, category: .shopping,
                        date: now.addingTimeInterval(-1_800)),
            Transaction(title: "Перевод · X-2048", amount: -5_000, category: .transfer,
                        date: now.addingTimeInterval(-7_200)),
            Transaction(title: "Зарплата", amount: 42_000, category: .income,
                        date: now.addingTimeInterval(-86_400)),
            Transaction(title: "ЖКХ · Тверская 12", amount: -6_340, category: .utilities,
                        date: now.addingTimeInterval(-90_000)),
            Transaction(title: "Кофейня", amount: -420, category: .cafe,
                        date: now.addingTimeInterval(-100_000)),
            Transaction(title: "Метро", amount: -75, category: .transport,
                        date: now.addingTimeInterval(-180_000))
        ]

        return AppData(
            bankName: "BankFake",
            balance: 128_400,
            cards: cards,
            transactions: txs,
            user: User(xid: "X-1024", name: "Макс", email: "max@xprodc"),
            settings: Settings()
        )
    }
}
