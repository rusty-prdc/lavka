import SwiftUI

// Liquid Glass на iOS 26+ (Xcode 26 / Swift 6.2).
// На старых SDK и версиях iOS — .ultraThinMaterial.

private extension View {
    func materialCard(cornerRadius: CGFloat) -> some View {
        self
            .background(
                .ultraThinMaterial,
                in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(Color.white.opacity(0.14), lineWidth: 1)
            )
    }

    func materialTint(_ tint: Color, cornerRadius: CGFloat) -> some View {
        self
            .background(
                tint.opacity(0.16),
                in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(tint.opacity(0.35), lineWidth: 1)
            )
    }
}

extension View {
    @ViewBuilder
    func glassCard(cornerRadius: CGFloat = 24) -> some View {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            self.glassEffect(.regular, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        } else {
            self.materialCard(cornerRadius: cornerRadius)
        }
        #else
        self.materialCard(cornerRadius: cornerRadius)
        #endif
    }

    @ViewBuilder
    func glassTinted(_ tint: Color, cornerRadius: CGFloat = 18) -> some View {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            self
                .background(
                    tint.opacity(0.16),
                    in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                )
                .glassEffect(.regular, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
        } else {
            self.materialTint(tint, cornerRadius: cornerRadius)
        }
        #else
        self.materialTint(tint, cornerRadius: cornerRadius)
        #endif
    }
}

struct GlassIconButton: View {
    let systemName: String
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 16, weight: .semibold))
                .frame(width: 44, height: 44)
        }
        .buttonStyle(.plain)
        .glassCard(cornerRadius: 16)
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(Color(hex: 0x04130A))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(
                LinearGradient(
                    colors: [Color(hex: 0x34D399), Color(hex: 0x10B981)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                in: RoundedRectangle(cornerRadius: 16, style: .continuous)
            )
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.primary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .glassCard(cornerRadius: 14)
            .opacity(configuration.isPressed ? 0.8 : 1)
    }
}

enum AppCapabilities {
    static var liquidGlass: Bool {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) { return true }
        return false
        #else
        return false
        #endif
    }
}
