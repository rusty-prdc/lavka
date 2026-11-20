import SwiftUI

struct TransferView: View {
    @EnvironmentObject private var store: BankStore
    @Environment(\.dismiss) private var dismiss

    @State private var recipient = ""
    @State private var amountText = ""
    @State private var note = ""
    @State private var done = false
    @State private var error: String?

    private var amount: Double? {
        Double(amountText.replacingOccurrences(of: ",", with: "."))
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                VStack(alignment: .leading, spacing: 14) {
                    Text("Перевод по XPRODC ID")
                        .font(.title3.weight(.bold))

                    Text("Доступно: \(rub(store.data.balance))")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    field("Получатель · X-ID или телефон", text: $recipient)
                    field("Сумма", text: $amountText)
                    field("Комментарий", text: $note)

                    HStack(spacing: 8) {
                        ForEach([1000.0, 2500.0, 5000.0], id: \.self) { value in
                            Button(rub(value)) { amountText = String(Int(value)) }
                                .buttonStyle(SecondaryButtonStyle())
                        }
                    }

                    if let error = error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    Spacer()

                    Button("Перевести") { send() }
                        .buttonStyle(PrimaryButtonStyle())
                }
                .padding(20)
            }
            .navigationTitle("Перевод")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Закрыть") { dismiss() }
                }
            }
            .alert("Перевод отправлен", isPresented: $done) {
                Button("Ок") { dismiss() }
            } message: {
                Text("\(rub(amount ?? 0)) → \(recipient)")
            }
        }
    }

    private func field(_ title: String, text: Binding<String>) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            TextField(title, text: text)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding(14)
                .glassCard(cornerRadius: 14)
        }
    }

    private func send() {
        guard let amount = amount, amount > 0 else {
            error = "Введите сумму"
            return
        }
        if store.transfer(to: recipient, amount: amount, note: note) {
            error = nil
            done = true
        } else {
            error = "Проверьте получателя и сумму"
        }
    }
}

struct TopUpView: View {
    @EnvironmentObject private var store: BankStore
    @Environment(\.dismiss) private var dismiss

    @State private var amountText = ""
    @State private var done = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                VStack(alignment: .leading, spacing: 14) {
                    Text("Пополнение")
                        .font(.title3.weight(.bold))

                    Text("С карты или наличными — в демо без разницы")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    TextField("Сумма", text: $amountText)
                        .keyboardType(.decimalPad)
                        .padding(14)
                        .glassCard(cornerRadius: 14)

                    HStack(spacing: 8) {
                        ForEach([1000.0, 5000.0, 15000.0], id: \.self) { value in
                            Button(rub(value)) { amountText = String(Int(value)) }
                                .buttonStyle(SecondaryButtonStyle())
                        }
                    }

                    if let error = error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    Spacer()

                    Button("Пополнить") { topUp() }
                        .buttonStyle(PrimaryButtonStyle())
                }
                .padding(20)
            }
            .navigationTitle("Пополнить")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Закрыть") { dismiss() }
                }
            }
            .alert("Готово", isPresented: $done) {
                Button("Ок") { dismiss() }
            } message: {
                Text("Баланс пополнен")
            }
        }
    }

    private func topUp() {
        guard let amount = Double(amountText.replacingOccurrences(of: ",", with: ".")),
              amount > 0 else {
            error = "Введите сумму"
            return
        }
        if store.topUp(amount) {
            error = nil
            done = true
        } else {
            error = "Не удалось пополнить"
        }
    }
}
