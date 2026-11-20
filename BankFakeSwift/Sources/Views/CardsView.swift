import SwiftUI

// MARK: - Card visual

struct CardVisual: View {
    let card: BankCard
    var compact: Bool = false

    private var gradient: LinearGradient {
        if card.gold {
            return LinearGradient(
                colors: [Color(hex: 0xC99A3F), Color(hex: 0x6B4A12)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
        let hue = card.hue / 360
        return LinearGradient(
            colors: [
                Color(hue: hue, saturation: 0.55, brightness: 0.42),
                Color(hue: hue, saturation: 0.72, brightness: 0.16)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text(card.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                Spacer()
                Text(card.brand.mark)
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.white.opacity(0.85))
            }

            Spacer(minLength: 8)

            Text(card.masked)
                .font(.system(size: compact ? 15 : 19, weight: .semibold, design: .monospaced))
                .foregroundStyle(.white)

            Spacer(minLength: 8)

            HStack {
                Text(card.frozen ? "заморожена" : rub(card.balance))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.92))
                Spacer()
                Text(card.expiry)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.7))
            }
        }
        .padding(compact ? 14 : 20)
        .frame(height: compact ? 116 : 196)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(gradient, in: RoundedRectangle(cornerRadius: compact ? 18 : 26, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: compact ? 18 : 26, style: .continuous)
                .strokeBorder(Color.white.opacity(0.18), lineWidth: 1)
        )
    }
}

// MARK: - Cards list

struct CardsView: View {
    @EnvironmentObject private var store: BankStore
    @State private var showNew = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                ScrollView {
                    VStack(spacing: 14) {
                        ForEach(store.data.cards) { card in
                            NavigationLink {
                                CardDetailView(cardID: card.id)
                            } label: {
                                CardVisual(card: card)
                            }
                            .buttonStyle(.plain)
                        }

                        Button("Новая карта") { showNew = true }
                            .buttonStyle(SecondaryButtonStyle())
                            .padding(.top, 4)
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Карты")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showNew = true } label: {
                        Image(systemName: "plus.circle.fill")
                    }
                    .foregroundStyle(AppTheme.green)
                }
            }
            .sheet(isPresented: $showNew) { NewCardView() }
        }
    }
}

// MARK: - Card detail

struct CardDetailView: View {
    @EnvironmentObject private var store: BankStore
    let cardID: UUID

    @State private var showTransfer = false
    @State private var showFreezeConfirm = false

    private var card: BankCard? {
        store.data.cards.first { $0.id == cardID }
    }

    var body: some View {
        ZStack {
            AppBackground()

            ScrollView {
                if let card = card {
                    VStack(spacing: 16) {
                        CardVisual(card: card)
                        requisites(card)
                        actions(card)
                    }
                    .padding(20)
                } else {
                    Text("Карта не найдена")
                        .foregroundStyle(.secondary)
                        .padding(40)
                }
            }
        }
        .navigationTitle("Карта")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showTransfer) {
            if let card = card {
                CardTransferView(source: card)
            }
        }
        .confirmationDialog("Заморозить карту?",
                            isPresented: $showFreezeConfirm,
                            titleVisibility: .visible) {
            Button(card?.frozen == true ? "Разморозить" : "Заморозить", role: .destructive) {
                store.toggleFreeze(cardID)
            }
            Button("Отмена", role: .cancel) {}
        }
    }

    private func requisites(_ card: BankCard) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionTitle(text: "Реквизиты")
            row("Номер", card.requisites)
            row("Владелец", card.holder)
            row("Баланс", rub(card.balance))
            row("Статус", card.frozen ? "заморожена" : "активна")
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassCard(cornerRadius: 22)
    }

    private func row(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline.weight(.semibold))
                .multilineTextAlignment(.trailing)
        }
    }

    private func actions(_ card: BankCard) -> some View {
        VStack(spacing: 10) {
            Button("Перевести между картами") { showTransfer = true }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(store.data.cards.count < 2)

            Button(card.frozen ? "Разморозить карту" : "Заморозить карту") {
                showFreezeConfirm = true
            }
            .buttonStyle(SecondaryButtonStyle())
        }
    }
}

// MARK: - New card

struct NewCardView: View {
    @EnvironmentObject private var store: BankStore
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var hue: Double = 158

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                VStack(spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Название")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("Например, XPRODC Card", text: $title)
                            .textFieldStyle(.plain)
                            .padding(14)
                            .glassCard(cornerRadius: 14)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Цвет")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Slider(value: $hue, in: 0...360)
                            .tint(AppTheme.green)
                    }

                    Spacer()

                    Button("Создать карту") {
                        store.createCard(title: title, hue: hue)
                        dismiss()
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
                .padding(20)
            }
            .navigationTitle("Новая карта")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Закрыть") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Transfer between cards

struct CardTransferView: View {
    @EnvironmentObject private var store: BankStore
    @Environment(\.dismiss) private var dismiss

    let source: BankCard

    @State private var targetID: UUID?
    @State private var amountText = ""
    @State private var error: String?

    private var targets: [BankCard] {
        store.data.cards.filter { $0.id != source.id }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                VStack(alignment: .leading, spacing: 16) {
                    Text("Со счёта \(source.masked)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    Picker("Куда", selection: Binding(
                        get: { targetID ?? targets.first?.id },
                        set: { targetID = $0 }
                    )) {
                        ForEach(targets) { card in
                            Text("\(card.title) · \(card.masked)").tag(Optional(card.id))
                        }
                    }
                    .pickerStyle(.menu)
                    .padding(12)
                    .glassCard(cornerRadius: 14)

                    TextField("Сумма", text: $amountText)
                        .keyboardType(.decimalPad)
                        .padding(14)
                        .glassCard(cornerRadius: 14)

                    if let error = error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }

                    Spacer()

                    Button("Перевести") {
                        transfer()
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
                .padding(20)
            }
            .navigationTitle("Между картами")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Закрыть") { dismiss() }
                }
            }
        }
    }

    private func transfer() {
        guard let targetID = targetID ?? targets.first?.id,
              let amount = Double(amountText.replacingOccurrences(of: ",", with: ".")),
              amount > 0 else {
            error = "Введите сумму"
            return
        }

        if store.transferBetweenCards(from: source.id, to: targetID, amount: amount) {
            dismiss()
        } else {
            error = "Недостаточно средств или карта заморожена"
        }
    }
}
