/**
 * Auth funnel shell — brand modes + Puente Patio (señal ámbar + atmósfera teal↔ink).
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@shared/ui/theme", () => ({
  ThemeToggle: () => <button type="button">Tema</button>,
}));

vi.mock("./AuthFunnelProductPreview", () => ({
  AuthFunnelProductPreview: () => (
    <div data-testid="auth-product-preview">preview</div>
  ),
}));

import { AuthFunnelShell } from "./AuthFunnelShell";
import { useAuthFunnelBrandSlot } from "./AuthFunnelShellContext";
import { authFunnelCopy } from "./authFunnelCopy";

function renderShell(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthFunnelShell>
        <p>Contenido del formulario</p>
      </AuthFunnelShell>
    </MemoryRouter>,
  );
}

function RegisterSlotProbe() {
  useAuthFunnelBrandSlot(
    () => <div data-testid="register-stepper-slot">stepper</div>,
    [],
  );
  return null;
}

describe("AuthFunnelShell F1", () => {
  it("exposes skip-link to #auth-form", () => {
    renderShell("/login");
    const skip = screen.getByRole("link", { name: authFunnelCopy.skipLink });
    expect(skip).toHaveAttribute("href", "#auth-form");
    expect(document.getElementById("auth-form")).toBeTruthy();
  });

  it("shows claim, compact trust and preview on login", () => {
    renderShell("/login");
    const claim = screen.getByText(authFunnelCopy.claimTitle);
    expect(claim).toBeInTheDocument();
    expect(claim).toHaveClass("auth-funnel-claim");
    const trust = screen.getByLabelText(authFunnelCopy.trust.ariaLabel);
    expect(trust.tagName).toBe("UL");
    expect(within(trust).getByText("CFDI 4.0")).toBeInTheDocument();
    expect(screen.getByTestId("auth-product-preview")).toBeInTheDocument();
  });

  it("uses minimal brand panel on reset (no claim, trust or preview)", () => {
    renderShell("/reset-password");
    expect(
      screen.queryByText(authFunnelCopy.claimTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(authFunnelCopy.trust.ariaLabel),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("auth-product-preview"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(authFunnelCopy.reset.line)).toBeInTheDocument();
  });

  it("uses minimal brand panel on verify", () => {
    renderShell("/verify-email");
    expect(
      screen.queryByText(authFunnelCopy.claimTitle),
    ).not.toBeInTheDocument();
    expect(screen.getByText(authFunnelCopy.verify.line)).toBeInTheDocument();
  });

  it("uses minimal brand panel on invite (no claim, trust or preview)", () => {
    renderShell("/accept-invitation");
    expect(
      screen.queryByText(authFunnelCopy.claimTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(authFunnelCopy.trust.ariaLabel),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("auth-product-preview"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(authFunnelCopy.invite.line)).toBeInTheDocument();
  });

  it("uses minimal brand panel on activate (no claim, trust or preview)", () => {
    renderShell("/activate-tenant");
    expect(
      screen.queryByText(authFunnelCopy.claimTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(authFunnelCopy.trust.ariaLabel),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("auth-product-preview"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(authFunnelCopy.activate.line)).toBeInTheDocument();
  });

  it("uses minimal brand panel on forgot", () => {
    renderShell("/forgot-password");
    expect(screen.getByText(authFunnelCopy.forgot.line)).toBeInTheDocument();
    expect(
      screen.queryByTestId("auth-product-preview"),
    ).not.toBeInTheDocument();
  });
});

describe("AuthFunnelShell register mode (F2)", () => {
  it("register without brandSlot uses LoginBrandPanel (no fake stepper)", () => {
    renderShell("/register");
    expect(screen.getByText(authFunnelCopy.claimTitle)).toBeInTheDocument();
    expect(screen.getByTestId("auth-product-preview")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Pasos del registro"),
    ).not.toBeInTheDocument();
  });

  it("register with brandSlot shows custom stepper slot + compact preview", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <AuthFunnelShell>
          <RegisterSlotProbe />
          <p>Contenido del formulario</p>
        </AuthFunnelShell>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("register-stepper-slot")).toBeInTheDocument();
    expect(screen.getByTestId("auth-product-preview")).toBeInTheDocument();
    expect(
      screen.queryByText(authFunnelCopy.claimTitle),
    ).not.toBeInTheDocument();
  });
});

describe("AuthFunnelShell F2 Patio bridge", () => {
  it("roots the funnel with auth-funnel-root and patio brand panel", () => {
    const { container } = renderShell("/login");
    expect(container.querySelector(".auth-funnel-root")).toBeTruthy();
    const brand = container.querySelector("aside.auth-funnel-brand");
    expect(brand).toBeTruthy();
    expect(brand?.querySelector(".auth-funnel-brand-atmosphere")).toBeTruthy();
    expect(brand?.querySelector(".auth-funnel-brand-signal")).toBeNull();
    expect(brand?.querySelector(".auth-funnel-brand-stagger")).toBeTruthy();
  });

  it("uses patio mobile header instead of solid bg-primary", () => {
    const { container } = renderShell("/login");
    const mobileHeader = container.querySelector(".auth-funnel-mobile-header");
    expect(mobileHeader).toBeTruthy();
    expect(mobileHeader?.className).not.toMatch(/\bbg-primary\b/);
    expect(mobileHeader?.className).not.toMatch(/\btext-primary-foreground\b/);
  });

  it("keeps BrandLockup in the desktop brand aside and in the mobile header", () => {
    const { container } = renderShell("/login");
    const brand = container.querySelector("aside.auth-funnel-brand");
    const mobileHeader = container.querySelector(".auth-funnel-mobile-header");
    expect(brand).toBeTruthy();
    expect(mobileHeader).toBeTruthy();

    expect(
      within(brand as HTMLElement).getByText(authFunnelCopy.brandTagline),
    ).toBeInTheDocument();
    expect(
      within(brand as HTMLElement).getByText(authFunnelCopy.brandByline),
    ).toBeInTheDocument();
    expect(
      within(mobileHeader as HTMLElement).getByText(authFunnelCopy.brandTagline),
    ).toBeInTheDocument();
    expect(
      within(brand as HTMLElement).getByText(authFunnelCopy.claimTitle),
    ).toBeInTheDocument();
  });

  it("keeps brand teal mark + onInk wordmark on ink", () => {
    const { container } = renderShell("/login");
    const brand = container.querySelector("aside.auth-funnel-brand") as HTMLElement;
    expect(brand.querySelector(".text-primary")).toBeTruthy();
    expect(brand.querySelector(".text-palette-brand-on-ink")).toBeTruthy();
    expect(brand.querySelector(".text-primary-foreground")).toBeNull();
  });

  it("does not rely on Tailwind lg:hidden alone for the mobile header", () => {
    const { container } = renderShell("/login");
    const mobileHeader = container.querySelector(".auth-funnel-mobile-header");
    expect(mobileHeader).toBeTruthy();
    // Visibilidad lg vive en authFunnel.css (display:none @ 1024px).
    expect(mobileHeader?.className).not.toMatch(/\blg:hidden\b/);
  });

  it("marks trust with amber signal tip on login", () => {
    renderShell("/login");
    const trust = screen.getByLabelText(authFunnelCopy.trust.ariaLabel);
    expect(trust.querySelector(".auth-funnel-trust-tip")).toBeTruthy();
  });
});
