import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { BillingEntitlements } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { PROFITABILITY_LEVEL_COPY } from "../copy/profitabilityLevelCopy";
import { BillingModulesCard } from "./BillingModulesCard";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

const ENTITLEMENTS: BillingEntitlements = {
  directEntitlements: [
    {
      moduleCode: "internal_staff_compensation",
      moduleName: "Equipo de apoyo en viajes",
      kind: "addon",
      status: "active",
      activatedAt: "2026-07-01T12:00:00.000Z",
      priceLockedCents: 5900,
      priceTier: "ea",
      memberCodes: [],
    },
  ],
  effectiveModuleCodes: ["internal_staff_compensation"],
  profitabilityLevel: "L0.5",
  catalog: [],
  commercialSummary: {
    planMonthlyPriceCents: 74900,
    modulesTotalCents: 5900,
    overageTotalCents: 0,
    subtotalCents: 80800,
    ivaCents: 12928,
    estimatedTotalCents: 93728,
    currency: "MXN",
    periodKey: "2026-07",
    billingCycle: "monthly",
  },
};

function renderCard(props: Partial<Parameters<typeof BillingModulesCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <BillingModulesCard
        entitlements={ENTITLEMENTS}
        isLoading={false}
        planName="Operación Esencial"
        profitabilityLevel="L0.5"
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("BillingModulesCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it("muestra la etiqueta del nivel, el código y qué incluye el cálculo", () => {
    renderCard();

    expect(
      screen.getByText(PROFITABILITY_LEVEL_COPY["L0.5"].label),
    ).toBeInTheDocument();
    expect(screen.getByText("Nivel L0.5")).toBeInTheDocument();
    expect(
      screen.getByText(PROFITABILITY_LEVEL_COPY["L0.5"].includes),
    ).toBeInTheDocument();
    expect(
      screen.getByText(PROFITABILITY_LEVEL_COPY["L0.5"].pending as string),
    ).toBeInTheDocument();
  });

  it("no muestra qué falta por cubrir desde L3", () => {
    renderCard({ profitabilityLevel: "L3" });

    expect(
      screen.getByText(PROFITABILITY_LEVEL_COPY.L3.includes),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(PROFITABILITY_LEVEL_COPY.L0.pending as string),
    ).not.toBeInTheDocument();
  });

  it("enlaza a rentabilidad de viajes con permiso de facturas", () => {
    renderCard();

    expect(mockHasPermission).toHaveBeenCalledWith("invoices", "read");
    expect(
      screen.getByRole("link", {
        name: billingCopy.modules.level.profitabilityLink,
      }),
    ).toHaveAttribute("href", "/finance?tab=analysis&view=margin");
  });

  it("oculta el enlace de rentabilidad sin permiso de facturas", () => {
    mockHasPermission.mockReturnValue(false);
    renderCard();

    expect(
      screen.queryByRole("link", {
        name: billingCopy.modules.level.profitabilityLink,
      }),
    ).not.toBeInTheDocument();
  });

  it("cae al código crudo si el API envía un nivel desconocido", () => {
    renderCard({ profitabilityLevel: "L9" });

    expect(screen.getByText("L9")).toBeInTheDocument();
    expect(screen.getByText("Nivel L9")).toBeInTheDocument();
  });

  it("muestra un solo badge por módulo y el precio mensual", () => {
    renderCard();

    expect(screen.getByText(billingCopy.modules.eaBadge)).toBeInTheDocument();
    expect(screen.getByText("$59.00/mes")).toBeInTheDocument();
    expect(screen.queryByText("Add-on")).not.toBeInTheDocument();
    expect(screen.queryByText("Activo")).not.toBeInTheDocument();
  });

  it("explica el estado vacío con el nombre del plan", () => {
    renderCard({
      entitlements: { ...ENTITLEMENTS, directEntitlements: [] },
    });

    expect(
      screen.getByText(billingCopy.modules.empty.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        billingCopy.modules.empty.description("Operación Esencial"),
      ),
    ).toBeInTheDocument();
  });
});
