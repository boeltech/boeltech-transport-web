/**
 * Register F2 — paso Plan densificado (preferencia orientativa, sin pricing hero).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const usePublicSelfServeRegister = vi.fn();

vi.mock("@shared/commercial/usePublicSelfServeRegister", () => ({
  usePublicSelfServeRegister: () => usePublicSelfServeRegister(),
}));

vi.mock("../AuthFunnelShellContext", () => ({
  useAuthFunnelBrandSlot: () => undefined,
}));

vi.mock("@shared/commercial/usePublicOperationalPlans", () => ({
  usePublicOperationalPlans: () => ({
    plans: [
      {
        code: "operacion_micro",
        name: "Operación Micro",
        priceAmount: "$389",
        pricePeriod: "/motriz · mes",
        unitsLabel: "1–5 motrices",
        usersLabel: "5 usuarios",
        branchesLabel: "1 sucursal",
        stampsLabel: "30 timbres/motriz",
      },
    ],
    getByCode: () => ({
      code: "operacion_micro",
      name: "Operación Micro",
      priceAmount: "$389",
      pricePeriod: "/motriz · mes",
      unitsLabel: "1–5 motrices",
      usersLabel: "5 usuarios",
      branchesLabel: "1 sucursal",
      stampsLabel: "30 timbres/motriz",
    }),
  }),
}));

vi.mock("@shared/commercial/useCheckSubdomainAvailability", () => ({
  useCheckSubdomainAvailability: () => ({
    available: true,
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

describe("RegisterPage F2 plan density", () => {
  beforeEach(() => {
    usePublicSelfServeRegister.mockReturnValue({
      open: true,
      resolved: true,
    });
  });

  it("shows orientative plan preview without pricing hero or duplicate trial", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(
      screen.getByLabelText(copy.company.nameLabel),
      "Transportes Demo",
    );
    await user.type(screen.getByLabelText(copy.company.subdomainLabel), "demo");
    await user.click(screen.getByRole("button", { name: copy.actions.continue }));

    expect(
      screen.getByRole("heading", { name: copy.steps.plan.title }),
    ).toBeInTheDocument();

    const previewTitle = screen.getByText(copy.plan.previewTitle);
    const card = previewTitle.closest("div.rounded-md") ?? previewTitle.parentElement!;
    expect(within(card as HTMLElement).getByText(copy.plan.orientativeBadge)).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("$389")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText("$389").className).not.toMatch(
      /text-xl/,
    );
    expect(within(card as HTMLElement).queryByText(copy.trialHint)).not.toBeInTheDocument();
    expect(screen.queryByText(/Incluye prueba/i)).not.toBeInTheDocument();
  });
});
