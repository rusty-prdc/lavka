import Foundation

@MainActor
final class BankStore: ObservableObject {
    @Published var data: AppData
    @Published var isAuthenticated: Bool = true

    private let fileURL: URL

    init() {
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        fileURL = dir.appendingPathComponent("bankfake.json")

        if let raw = try? Data(contentsOf: fileURL),
           let decoded = try? JSONDecoder().decode(AppData.self, from: raw) {
            data = decoded
        } else {
            data = .demo()
        }
    }

    // MARK: - Persistence

    func save() {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            try encoder.encode(data).write(to: fileURL, options: [.atomic])
        } catch {
            print("BankFake save error:", error)
        }
    }

    // MARK: - Derived

    var isAdmin: Bool { data.user.isAdmin }
    var balanceText: String { data.settings.hideBalance ? "•••••• ₽" : rub(data.balance) }

    var recentTransactions: [Transaction] {
        Array(data.transactions.sorted { $0.date > $1.date }.prefix(5))
    }

    // MARK: - Money

    @discardableResult
    func transfer(to recipient: String, amount: Double, note: String) -> Bool {
        let name = recipient.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty, amount > 0, amount <= data.balance else { return false }
        data.balance -= amount
        add(Transaction(title: "Перевод · \(name)",
                        amount: -amount,
                        category: .transfer,
                        date: .now,
                        note: note.isEmpty ? nil : note))
        return true
    }

    @discardableResult
    func pay(service: String, amount: Double, category: TxCategory = .utilities) -> Bool {
        guard amount > 0, amount <= data.balance else { return false }
        data.balance -= amount
        add(Transaction(title: service, amount: -amount, category: category, date: .now))
        return true
    }

    @discardableResult
    func topUp(_ amount: Double) -> Bool {
        guard amount > 0 else { return false }
        data.balance += amount
        add(Transaction(title: "Пополнение", amount: amount, category: .income, date: .now))
        return true
    }

    @discardableResult
    func grant(_ amount: Double) -> Bool {
        guard isAdmin, amount > 0 else { return false }
        data.balance += amount
        add(Transaction(title: "X-8 · начисление", amount: amount, category: .income, date: .now))
        return true
    }

    func add(_ tx: Transaction) {
        data.transactions.insert(tx, at: 0)
        save()
    }

    // MARK: - Cards

    func createCard(title: String, hue: Double) {
        let digits = (0..<16).map { _ in String(Int.random(in: 0...9)) }.joined()
        let card = BankCard(title: title.isEmpty ? "Новая карта" : title,
                            number: digits.grouped(every: 4),
                            brand: .mir,
                            balance: 0,
                            hue: hue)
        data.cards.append(card)
        save()
    }

    func toggleFreeze(_ id: UUID) {
        guard let index = data.cards.firstIndex(where: { $0.id == id }) else { return }
        data.cards[index].frozen.toggle()
        save()
    }

    @discardableResult
    func transferBetweenCards(from source: UUID, to target: UUID, amount: Double) -> Bool {
        guard source != target, amount > 0,
              let s = data.cards.firstIndex(where: { $0.id == source }),
              let t = data.cards.firstIndex(where: { $0.id == target }),
              !data.cards[s].frozen, !data.cards[t].frozen,
              data.cards[s].balance >= amount else { return false }

        data.cards[s].balance -= amount
        data.cards[t].balance += amount
        save()
        return true
    }

    // MARK: - Account

    func signIn(xid: String, name: String, email: String) {
        data.user = User(xid: xid.uppercased(), name: name, email: email)
        isAuthenticated = true
        save()
    }

    func signOut() {
        isAuthenticated = false
    }

    func reset() {
        data = .demo()
        save()
    }

    // MARK: - Settings

    func setDarkTheme(_ on: Bool) {
        data.settings.darkTheme = on
        save()
    }

    func setNotifications(_ on: Bool) {
        data.settings.notifications = on
        save()
    }

    func setSound(_ on: Bool) {
        data.settings.sound = on
        save()
    }

    func setHideBalance(_ on: Bool) {
        data.settings.hideBalance = on
        save()
    }

    func setBankName(_ name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        data.bankName = trimmed
        save()
    }
}

private extension String {
    func grouped(every size: Int) -> String {
        guard size > 0 else { return self }
        var chunks: [String] = []
        var index = startIndex
        while index < endIndex {
            let next = self.index(index, offsetBy: size, limitedBy: endIndex) ?? endIndex
            chunks.append(String(self[index..<next]))
            index = next
        }
        return chunks.joined(separator: " ")
    }
}
