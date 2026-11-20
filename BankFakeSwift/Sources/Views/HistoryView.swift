import SwiftUI

struct HistoryView: View {
    @EnvironmentObject private var store: BankStore

    @State private var query = ""
    @State private var category: TxCategory?

    private struct DayGroup: Identifiable {
        let id: Date
        let items: [Transaction]
    }

    private var filtered: [Transaction] {
        store.data.transactions
            .filter { category == nil || $0.category == category }
            .filter { query.isEmpty || $0.title.localizedCaseInsensitiveContains(query) }
            .sorted { $0.date > $1.date }
    }

    private var grouped: [DayGroup] {
        let calendar = Calendar.current
        let dict = Dictionary(grouping: filtered) { calendar.startOfDay(for: $0.date) }
        return dict
            .map { DayGroup(id: $0.key, items: $0.value.sorted { $0.date > $1.date }) }
            .sorted { $0.id > $1.id }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                VStack(spacing: 12) {
                    searchBar
                    chips

                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            ForEach(grouped) { group in
                                VStack(alignment: .leading, spacing: 8) {
                                    SectionTitle(text: dayLabel(group.id))
                                    ForEach(group.items) { tx in
                                        TransactionRow(transaction: tx)
                                    }
                                }
                            }

                            if filtered.isEmpty {
                                Text("Ничего не найдено")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .frame(maxWidth: .infinity)
                                    .padding(40)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationTitle("История")
        }
    }

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
            TextField("Поиск по операциям", text: $query)
                .textFieldStyle(.plain)
        }
        .padding(12)
        .glassCard(cornerRadius: 14)
        .padding(.horizontal, 20)
    }

    private var chips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip("Все", active: category == nil) { category = nil }
                ForEach(TxCategory.allCases) { cat in
                    chip(cat.title, active: category == cat) { category = cat }
                }
            }
            .padding(.horizontal, 20)
        }
    }

    private func chip(_ title: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .foregroundStyle(active ? AppTheme.green : Color.secondary)
                .background(
                    (active ? AppTheme.green.opacity(0.16) : Color.clear),
                    in: Capsule()
                )
                .overlay(
                    Capsule()
                        .strokeBorder(
                            active ? AppTheme.green.opacity(0.35) : Color.secondary.opacity(0.18),
                            lineWidth: 1
                        )
                )
        }
        .buttonStyle(.plain)
    }

    private func dayLabel(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Сегодня" }
        if calendar.isDateInYesterday(date) { return "Вчера" }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ru_RU")
        formatter.dateFormat = "d MMMM"
        return formatter.string(from: date)
    }
}

struct TransactionRow: View {
    let transaction: Transaction

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(tint.opacity(0.16))
                    .frame(width: 40, height: 40)
                Image(systemName: transaction.category.icon)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(tint)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.title)
                    .font(.subheadline.weight(.medium))
                    .lineLimit(1)
                Text(transaction.date.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(transaction.isIncome ? "+\(rub(transaction.amount))" : "−\(rub(abs(transaction.amount)))")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(transaction.isIncome ? AppTheme.green : Color.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .padding(12)
        .glassCard(cornerRadius: 16)
    }

    private var tint: Color {
        switch transaction.category {
        case .income: return AppTheme.green
        case .transfer: return Color(hex: 0x0EA5E9)
        case .utilities: return Color(hex: 0xF59E0B)
        case .cafe: return Color(hex: 0xB45309)
        default: return Color(hex: 0x64748B)
        }
    }
}
