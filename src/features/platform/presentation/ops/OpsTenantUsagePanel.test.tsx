import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OpsTenantUsagePanel } from "./OpsTenantUsagePanel";
import "./opsTokens.css";

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    downloadTenantReconciliationCsv: vi.fn(),
  },
}));

vi.mock("../../application/hooks/usePlatformBilling", () => ({
  usePlatformTenantSubscription: () => ({
    data: {
      planName: "Operación",
      status: "active",
      stampsUsedThisPeriod: 90,
      includedStamps: 100,
      stampsPerMotriz: 30,
      qFact: null,
      monthlyPriceCents: 9900,
      pricePerMotrizCents: 9900,
      trialEndsAt: null,
    },
    isLoading: false,
  }),
  usePlatformTenantStampUsage: () => ({
    data: {
      stampsUsed: 90,
      includedStamps: 100,
      periodKey: "2026-10",
      overageStamps: 4,
      overageTotalCents: 8000,
    },
    isLoading: false,
  }),
}));

describe("OpsTenantUsagePanel", () => {
  it("shows the stamp meter and hides price amounts", () => {
    render(
      <div className="platform-ops">
        <OpsTenantUsagePanel tenantId="t1" planName="Operación" />
      </div>,
    );

    expect(screen.getByText("90 / 100")).toBeInTheDocument();
    expect(document.querySelector("[data-ops-quota-fill]")).toHaveAttribute(
      "data-ops-quota-fill",
      "warn",
    );
    expect(screen.getByText("4 timbres fuera del paquete")).toBeInTheDocument();
    expect(screen.queryByText("Precio del plan")).not.toBeInTheDocument();
    expect(screen.queryByText(/Total estimado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/8,?000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });
});