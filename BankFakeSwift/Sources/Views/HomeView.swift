import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: BankStore
    @EnvironmentObject private var router: TabRouter

    @State private var showTransfer = false
    @State private var showTopUp = false
    @State private var showPayments = false

    private let quick: [(String, String)] = [
        ("Перевод", "arrow.left.arrow.right"),
        ("Пополнить", "plus.circle.fill"),
        ("Платежи", "bolt.fill"),
        ("История", "clock.arrow.circlepath")
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        header
                        balanceCard
                        quickActions
                        cardsRow
                        recentSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 40)
                }
                .scrollIndicators(.hidden)
            }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showTransfer) { TransferView() }
            .sheet(isPresented: $showTopUp) { TopUpView() }
            .sheet(isPresented: $showPayments) { NavigationStack { PaymentsView() } }
        }
    }

    // MARK: - Header

    private var header: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(AppTheme.green.opacity(0.18))
                    .frame(width: 44, height: 44)
                Text(store.data.user.initials)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(AppTheme.green)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("Привет, \(store.data.user.name)")
                    .font(.headline)
                Text(store.data.user.xid)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            GlassIconButton(systemName: "bell.fill")
        }
    }

    // MARK: - Balance

    private var balanceCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(store.data.bankName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)

                Spacer()

                Button {
                    store.setHideBalance(!store.data.settings.hideBalance)
                } label: {
                    Image(systemName: store.data.settings.hideBalance ? "eye.slash" : "eye")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }

            Text(store.balanceText)
                .font(.system(size: 38, weight: .bold, design: .rounded))
                .minimumScaleFactor(0.5)
                .lineLimit(1)

            HStack(spacing: 8) {
                Pill(text: store.data.user.xid)
                Text("XPRODC ID")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("+5% кэшбэк")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(AppTheme.green)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassCard(cornerRadius: 28)
    }

    // MARK: - Quick actions

    private var quickActions: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 4), spacing: 10) {
            ForEach(Array(quick.enumerated()), id: \.offset) { index, item in
                Button {
                    quickAction(index)
                } label: {
                    VStack(spacing: 8) {
                        Image(systemName: item.1)
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(AppTheme.green)
                            .frame(width: 42, height: 42)
                        Text(item.0)
                            .font(.caption2.weight(.medium))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                            .foregroundStyle(.primary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
                .buttonStyle(.plain)
                .glassCard(cornerRadius: 18)
            }
        }
    }

    private func quickAction(_ index: Int) {
        switch index {
        case 0: showTransfer = true
        case 1: showTopUp = true
        case 2: showPayments = true
        default: router.tab = 2
        }
    }

    // MARK: - Cards

    private var cardsRow: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                SectionTitle(text: "Мои карты")
                Spacer()
                Button("Все") { router.tab = 3 }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(AppTheme.green)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(store.data.cards) { card in
                        NavigationLink {
                            CardDetailView(cardID: card.id)
                        } label: {
                            CardVisual(card: card, compact: true)
                                .frame(width: 250)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    // MARK: - Recent

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                SectionTitle(text: "Последние операции")
                Spacer()
                Button("Все") { router.tab = 2 }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(AppTheme.green)
            }

            VStack(spacing: 8) {
                ForEach(store.recentTransactions) { tx in
                    TransactionRow(transaction: tx)
                }
            }
        }
    }
}
