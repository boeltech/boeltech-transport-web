import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { monitoringCopy } from "../copy/monitoringCopy";
import { FleetMapPage } from "./FleetMapPage";

const mockGetFleet = vi.fn();
const mockUseHasBillingModule = vi.fn();

vi.mock("@features/monitoring/infrastructure", () => ({
  monitoringApi: {
    getFleetPositions: (...args: unknown[]) => mockGetFleet(...args),
  },
}));

vi.mock("@features/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/billing")>();
  return {
    ...actual,
    useHasBillingModule: (...args: unknown[]) =>
      mockUseHasBillingModule(...args),
  };
});

vi.mock("@shared/config", () => ({
  config: {
    geolocation: { mapboxPublicToken: "" },
    api: { baseUrl: "http://localhost:3000/api/v1", timeout: 30000, headers: {} },
  },
}));

function entitledAccess(hasModule: boolean) {
  return {
    hasModule,
    isSuccess: true,
    isLoading: false,
    isFetching: false,
    isError: false,
    isPending: false,
    data: {
      effectiveModuleCodes: hasModule ? ["gps_tracking"] : [],
    },
  };
}

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FleetMapPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FleetMapPage — module gate (F4.2)", () => {
  beforeEach(() => {
    mockGetFleet.mockReset();
    mockUseHasBillingModule.mockReset();
  });

  it("shows module-not-activated empty without paywall CTA", () => {
    mockUseHasBillingModule.mockReturnValue(entitledAccess(false));

    renderPage();

    expect(mockUseHasBillingModule).toHaveBeenCalledWith("gps_tracking");
    expect(screen.getByTestId("gps-module-not-activated")).toBeInTheDocument();
    expect(
      screen.getByText(monitoringCopy.moduleGate.title),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("fleet-map-empty")).not.toBeInTheDocument();
    expect(mockGetFleet).not.toHaveBeenCalled();

    const blob =
      screen.getByTestId("gps-module-not-activated").textContent ?? "";
    expect(blob).not.toMatch(/comprar|upgrade|precio|\$/i);
  });

  it("loads fleet when module is entitled", async () => {
    mockUseHasBillingModule.mockReturnValue(entitledAccess(true));
    mockGetFleet.mockResolvedValue({
      positions: [],
      summary: { totalLinked: 0, online: 0, stale: 0, offline: 0 },
      fetchedAt: "2026-11-13T12:00:00Z",
    });

    renderPage();

    expect(await screen.findByTestId("fleet-map-empty")).toBeInTheDocument();
    expect(mockGetFleet).toHaveBeenCalled();
  });
});
