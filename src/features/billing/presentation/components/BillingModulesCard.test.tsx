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

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: {
      email: "ana@norte.mx",
      getFullName: () => "Ana López",
      getTenantName: () => "Transportes del Norte SA",
    },
  }),
}));

vi.mock("@features/settings", () => ({
  useCompanySettings: () => ({
    data: { rfc: "TNO010101ABC" },
  }),
}));

const ENTITLEMENTS: BillingEntitlements = {
  directEntitlements: [
    {
      moduleCode: "gps_tracking",
      moduleName: "Monitoreo GPS",
      kind: "addon",
      status: "active",
      activatedAt: "2026-07-01T12:00:00.000Z",
      priceLockedCents: 5900,
      priceTier: "ea",
      memberCodes: [],
    },
  ],
  effectiveModuleCodes: ["gps_tracking"],
  profitabilityLevel: "L0",
  catalog: [],
  availableModules: [],
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

const AVAILABLE_GPS = {
  code: "gps_tracking",
  name: "Monitoreo GPS",
  kind: "addon",
  maturity: "ga",
};

function renderCard(props: Partial<Parameters<typeof BillingModulesCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <BillingModulesCard
        entitlements={ENTITLEMENTS}
        isLoading={false}
        planName="Operación Esencial"
        profitabilityLevel="L0"
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("BillingModulesCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation((resource: string, action: string) => {
      if (resource === "invoices" && action === "read") return true;
      if (resource === "billing" && action === "update") return true;
      return false;
    });
  });

  it("usa el título Complementos (DC1)", () => {
    renderCard();
    expect(screen.getByText(billingCopy.modules.title)).toBeInTheDocument();
    expect(screen.queryByText("Extras contratados")).not.toBeInTheDocument();
  });

  it("muestra la etiqueta humana del nivel sin código Lx", () => {
    renderCard();

    expect(
      screen.getByText(PROFITABILITY_LEVEL_COPY.L0.label),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nivel L0")).not.toBeInTheDocument();
    expect(screen.queryByText("L0")).not.toBeInTheDocument();
    expect(
      screen.getByText(PROFITABILITY_LEVEL_COPY.L0.includes),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(PROFITABILITY_LEVEL_COPY.L0.pending as string),
    ).not.toBeInTheDocument();
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
    ).toHaveAttribute("href", "/finance/analysis?view=margin");
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
    expect(screen.queryByText("Nivel L9")).not.toBeInTheDocument();
  });

  it("muestra activo con precio congelado, badge EA y mapa de flota", () => {
    renderCard();

    expect(screen.getByText(billingCopy.modules.activeBadge)).toBeInTheDocument();
    expect(screen.getByText(billingCopy.modules.eaBadge)).toBeInTheDocument();
    expect(screen.getByText("$59.00/mes")).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.modules.priceFrozenCaption),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: billingCopy.modules.openFleetMap }),
    ).toHaveAttribute("href", "/monitoring/fleet");
    expect(screen.queryByText("Add-on")).not.toBeInTheDocument();
  });

  it("explica el estado vacío sin disponibles", () => {
    renderCard({
      entitlements: { ...ENTITLEMENTS, directEntitlements: [] },
    });

    expect(
      screen.getByText(billingCopy.modules.empty.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.modules.empty.description),
    ).toBeInTheDocument();
  });

  it("admin ve disponible con mailto y Conocer más (sin precio)", () => {
    renderCard({
      entitlements: {
        ...ENTITLEMENTS,
        directEntitlements: [],
        availableModules: [AVAILABLE_GPS],
      },
    });

    expect(
      screen.getByText(billingCopy.modules.availableBadge),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.modules.availableBlurb),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: billingCopy.modules.learnMore }),
    ).toHaveAttribute("href", "/monitoring/fleet");

    const cta = screen.getByTestId("billing-module-request-gps_tracking");
    expect(cta).toHaveTextContent(billingCopy.modules.requestActivation);
    expect(cta.getAttribute("href")).toMatch(/^mailto:billing@boeltech\.com\?/);
    expect(decodeURIComponent(cta.getAttribute("href") ?? "")).not.toMatch(
      /precio|\$/i,
    );
    expect(screen.queryByText(/\/mes$/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(billingCopy.modules.priceFrozenCaption),
    ).not.toBeInTheDocument();
  });

  it("contador ve disponible sin mailto ni enlace a monitoreo", () => {
    mockHasPermission.mockImplementation((resource: string, action: string) => {
      if (resource === "invoices" && action === "read") return true;
      return false;
    });

    renderCard({
      entitlements: {
        ...ENTITLEMENTS,
        directEntitlements: [],
        availableModules: [AVAILABLE_GPS],
      },
    });

    expect(
      screen.getByText(billingCopy.modules.requestByAdmin),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("billing-module-request-gps_tracking"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: billingCopy.modules.learnMore }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: billingCopy.modules.openFleetMap }),
    ).not.toBeInTheDocument();
  });
});
