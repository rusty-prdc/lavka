import SwiftUI

struct PaymentService: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    let category: TxCategory
}

let paymentServices: [PaymentService] = [
    PaymentService(title: "ЖКХ", icon: "house.fill", category: .utilities),
    PaymentService(title: "Мобильная связь", icon: "iphone", category: .other),
    PaymentService(title: "Интернет", icon: "wifi", category: .other),
    PaymentService(title: "Транспорт", icon: "bus.fill", category: .transport),
    PaymentService(title: "Штрафы", icon: "exclamationmark.triangle.fill", category: .other),
    PaymentService(title: "Кафе", icon: "cup.and.saucer.fill", category: .cafe),
    PaymentService(title: "Лавка", icon: "cart.fill", category: .shopping),
    PaymentService(title: "Благотворительность", icon: "heart.fill", category: .other)
]

struct PaymentsView: View {
    @EnvironmentObject private var store: BankStore
    @State private var selected: PaymentService?

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                ScrollView {
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 12),
                        GridItem(.flexible(), spacing: 12)
                    ], spacing: 12) {
                        ForEach(paymentServices) { service in
                            Button {
                                selected = service
                            } label: {
                                VStack(alignment: .leading, spacing: 12) {
                                    Image(systemName: service.icon)
                                        .font(.system(size: 20, weight: .semibold))
                                        .foregroundStyle(AppTheme.green)
                                        .frame(width: 42, height: 42)
                                        .background(
                                            AppTheme.green.opacity(0.14),
                                            in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        )

                                    Text(service.title)
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(.primary)
                                        .multilineTextAlignment(.leading)
                                        .lineLimit(2)

                                    Text("Оплатить")
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(16)
                            }
                            .buttonStyle(.plain)
                            .glassCard(cornerRadius: 20)
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Платежи")
            .sheet(item: $selected) { service in
                PaymentSheet(service: service)
            }
        }
    }
}

struct PaymentSheet: View {
    @EnvironmentObject private var store: BankStore
    @Environment(\.dismiss) private var dismiss

    let service: PaymentService

    @State private var amountText = ""
    @State private var done = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                VStack(alignment: .leading, spacing: 16) {
                    Text(service.title)
                        .font(.title2.weight(.bold))

                    Text("Доступно: \(rub(store.data.balance))")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    TextField("Сумма", text: $amountText)
                        .keyboardType(.decimalPad)
                        .padding(14)
                        .glassCard(cornerRadius: 14)

                    HStack(spacing: 8) {
                        ForEach([500.0, 1000.0, 2000.0], id: \.self) { value in
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

                    Button("Оплатить") { pay() }
                        .buttonStyle(PrimaryButtonStyle())
                }
                .padding(20)
            }
            .navigationTitle("Платёж")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Закрыть") { dismiss() }
                }
            }
            .alert("Готово", isPresented: $done) {
                Button("Ок") { dismiss() }
            } message: {
                Text("Платёж проведён")
            }
        }
    }

    private func pay() {
        guard let amount = Double(amountText.replacingOccurrences(of: ",", with: ".")),
              amount > 0 else {
            error = "Введите сумму"
            return
        }

        if store.pay(service: service.title, amount: amount, category: service.category) {
            error = nil
            done = true
        } else {
            error = "Недостаточно средств"
        }
    }
}
