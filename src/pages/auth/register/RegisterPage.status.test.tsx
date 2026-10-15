/**
 * Register F1 — loading / closed StatusBlock (paridad forgot/reset Operate).
 * No monta el wizard self-serve abierto.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const usePublicSelfServeRegister = vi.fn();

vi.mock("@shared/commercial/usePublicSelfServeRegister", () => ({
  usePublicSelfServeRegister: () => usePublicSelfServeRegister(),
}));

vi.mock("../AuthFunnelShellContext", () => ({
  useAuthFunnelBrandSlot: () => undefined,
}));

vi.mock("@shared/commercial/usePublicOperationalPlans", () => ({
  usePublicOperationalPlans: () => ({ plans: [], getByCode: () => undefined }),
}));

vi.mock("@shared/commercial/useCheckSubdomainAvailability", () => ({
  useCheckSubdomainAvailability: () => ({
    available: null,
    suggestion: null,
    isChecking: false,
  }),
}));

import RegisterPage from "./RegisterPage";
import { registerFunnelCopy as copy } from "./registerFunnelCopy";

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

describe("RegisterPage F1 status states", () => {
  beforeEach(() => {
    usePublicSelfServeRegister.mockReset();
  });

  it("uses StatusBlock loading while self-serve flag resolves", () => {
    usePublicSelfServeRegister.mockReturnValue({
      open: true,
      resolved: false,
    });
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(copy.loading)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("uses StatusBlock closed with Operate CTA hierarchy", () => {
    usePublicSelfServeRegister.mockReturnValue({
      open: false,
      resolved: true,
    });
    renderPage();
    expect(
      screen.getByRole("heading", { name: copy.closed.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.closed.contact }),
    ).toHaveAttribute("href", copy.closed.contactHref);
    expect(
      screen.getByRole("link", { name: copy.closed.login }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("link", { name: copy.closed.home }),
    ).toHaveAttribute("href", "/welcome");
  });
});
