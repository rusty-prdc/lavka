import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var store: BankStore

    @State private var showXID = false
    @State private var showReset = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                ScrollView {
                    VStack(spacing: 16) {
                        userCard
                        accountSection
                        settingsSection

                        if store.isAdmin {
                            adminSection
                        }

                        dangerSection

                        HStack(spacing: 6) {
                            Image(systemName: AppCapabilities.liquidGlass ? "sparkles" : "circle.dashed")
                            Text(AppCapabilities.liquidGlass ? "Liquid Glass · iOS 26" : "Material (iOS < 26)")
                        }
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(AppCapabilities.liquidGlass ? AppTheme.green : Color.secondary)
                        .padding(.top, 8)

                        Text("BankFake 2.5 · XPRODC")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Профиль")
            .sheet(isPresented: $showXID) { XIDView() }
            .confirmationDialog("Сбросить данные?", isPresented: $showReset, titleVisibility: .visible) {
                Button("Сбросить", role: .destructive) { store.reset() }
                Button("Отмена", role: .cancel) {}
            }
        }
    }

    // MARK: - Header

    private var userCard: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(AppTheme.green.opacity(0.18))
                    .frame(width: 56, height: 56)
                Text(store.data.user.initials)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(AppTheme.green)
            }

            VStack(alignment: .leading, spacing: 3) {
                Text(store.data.user.name)
                    .font(.headline)
                Text(store.data.user.xid)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Pill(text: store.isAdmin ? "X-8" : "ID",
                 tint: store.isAdmin ? Color.orange : AppTheme.green)
        }
        .padding(18)
        .glassCard(cornerRadius: 22)
    }

    // MARK: - Sections

    private var accountSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionTitle(text: "Аккаунт")

            VStack(spacing: 0) {
                Button {
                    showXID = true
                } label: {
                    row(icon: "shield.lefthalf.filled", title: "XPRODC ID", value: store.data.user.xid)
                }
                .buttonStyle(.plain)

                Divider().opacity(0.25)

                row(icon: "envelope.fill", title: "Почта", value: store.data.user.email)
            }
            .padding(.horizontal, 16)
            .glassCard(cornerRadius: 18)
        }
    }

    private var settingsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionTitle(text: "Настройки")

            VStack(spacing: 0) {
                toggleRow("Тёмная тема", icon: "moon.fill",
                          isOn: Binding(get: { store.data.settings.darkTheme },
                                        set: { store.setDarkTheme($0) }))
                Divider().opacity(0.25)
                toggleRow("Уведомления", icon: "bell.fill",
                          isOn: Binding(get: { store.data.settings.notifications },
                                        set: { store.setNotifications($0) }))
                Divider().opacity(0.25)
                toggleRow("Звуки", icon: "speaker.wave.2.fill",
                          isOn: Binding(get: { store.data.settings.sound },
                                        set: { store.setSound($0) }))
                Divider().opacity(0.25)
                toggleRow("Скрыть баланс", icon: "eye.slash.fill",
                          isOn: Binding(get: { store.data.settings.hideBalance },
                                        set: { store.setHideBalance($0) }))
            }
            .padding(.horizontal, 16)
            .glassCard(cornerRadius: 18)
        }
    }

    private var adminSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionTitle(text: "Админ-панель")

            NavigationLink {
                AdminView()
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "person.badge.key.fill")
                        .foregroundStyle(.orange)
                        .frame(width: 22)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("X-8")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.primary)
                        Text("начисления и сброс")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(16)
            }
            .buttonStyle(.plain)
            .glassCard(cornerRadius: 18)
        }
    }

    private var dangerSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionTitle(text: "Опасная зона")

            VStack(spacing: 10) {
                Button("Сбросить данные") { showReset = true }
                    .buttonStyle(SecondaryButtonStyle())
                Button("Выйти") { store.signOut() }
                    .buttonStyle(SecondaryButtonStyle())
            }
        }
    }

    // MARK: - Rows

    private func row(icon: String, title: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(AppTheme.green)
                .frame(width: 22)

            Text(title)
                .font(.subheadline)
                .foregroundStyle(.primary)

            Spacer()

            Text(value)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .truncationMode(.middle)
        }
        .padding(.vertical, 14)
    }

    private func toggleRow(_ title: String, icon: String, isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .foregroundStyle(AppTheme.green)
                    .frame(width: 22)
                Text(title)
                    .font(.subheadline)
            }
        }
        .tint(AppTheme.green)
        .padding(.vertical, 10)
    }
}

// MARK: - XPRODC ID

struct XIDView: View {
    @EnvironmentObject private var store: BankStore
    @Environment(\.dismiss) private var dismiss

    @State private var xid = ""
    @State private var name = ""
    @State private var email = ""

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()

                VStack(alignment: .leading, spacing: 14) {
                    Text("Вход в XPRODC ID")
                        .font(.title3.weight(.bold))

                    field("Номер X-ID", text: $xid)
                    field("Имя", text: $name)
                    field("Почта", text: $email)

                    Text("Введите X-8, чтобы открыть админ-панель")
                        .font(.caption2)
                        .foregroundStyle(.secondary)

                    Spacer()

                    Button("Войти") {
                        store.signIn(
                            xid: xid.isEmpty ? store.data.user.xid : xid,
                            name: name.isEmpty ? store.data.user.name : name,
                            email: email.isEmpty ? store.data.user.email : email
                        )
                        dismiss()
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(xid.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(20)
                .onAppear {
                    xid = store.data.user.xid
                    name = store.data.user.name
                    email = store.data.user.email
                }
            }
            .navigationTitle("XPRODC ID")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Закрыть") { dismiss() }
                }
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
}

// MARK: - Admin X-8

struct AdminView: View {
    @EnvironmentObject private var store: BankStore

    @State private var amountText = ""
    @State private var message: String?

    var body: some View {
        ZStack {
            AppBackground()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Начисления")
                        .font(.headline)

                    HStack(spacing: 8) {
                        ForEach([1000.0, 10000.0, 100000.0], id: \.self) { value in
                            Button(rub(value)) { grant(value) }
                                .buttonStyle(SecondaryButtonStyle())
                        }
                    }

                    TextField("Своя сумма", text: $amountText)
                        .keyboardType(.decimalPad)
                        .padding(14)
                        .glassCard(cornerRadius: 14)

                    Button("Начислить") { grantCustom() }
                        .buttonStyle(PrimaryButtonStyle())

                    if let message = message {
                        Text(message)
                            .font(.caption)
                            .foregroundStyle(AppTheme.green)
                    }

                    Text("Демо-пользователи")
                        .font(.headline)
                        .padding(.top, 8)

                    ForEach(["X-1024 · Макс", "X-2048 · Аркадий", "X-4096 · Лиза"], id: \.self) { user in
                        HStack {
                            Text(user)
                                .font(.subheadline)
                            Spacer()
                            Text("активен")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        .padding(14)
                        .glassCard(cornerRadius: 14)
                    }

                    Button("Сбросить демо-данные") {
                        store.reset()
                        message = "Данные сброшены"
                    }
                    .buttonStyle(SecondaryButtonStyle())
                    .padding(.top, 8)
                }
                .padding(20)
            }
        }
        .navigationTitle("Админ · X-8")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func grant(_ amount: Double) {
        if store.grant(amount) {
            message = "Начислено \(rub(amount))"
        } else {
            message = "Нет прав"
        }
    }

    private func grantCustom() {
        guard let amount = Double(amountText.replacingOccurrences(of: ",", with: ".")),
              amount > 0 else {
            message = "Введите сумму"
            return
        }
        grant(amount)
    }
}
