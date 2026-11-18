import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { FleetMapPage } from "./FleetMapPage";

const mockGetFleet = vi.fn();
const mockUseEntitlement = vi.fn();

vi.mock("@features/monitoring/infrastructure", () => ({
  monitoringApi: {
    getFleetPositions: (...args: unknown[]) => mockGetFleet(...args),
  },
}));

vi.mock("@features/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/billing")>();
  return {
    ...actual,
    useEntitlement: (...args: unknown[]) => mockUseEntitlement(...args),
  };
});

vi.mock("@shared/config", () => ({
  config: {
    geolocation: { mapboxPublicToken: "" },
    api: { baseUrl: "http://localhost:3000/api/v1", timeout: 30000, headers: {} },
  },
}));

function entitlementState(state: "active" | "not_contracted") {
  return {
    state,
    isSuccess: true,
    isLoading: false,
    isFetching: false,
    isError: false,
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

describe("FleetMapPage — entitlement gates (F3)", () => {
  beforeEach(() => {
    mockGetFleet.mockReset();
    mockUseEntitlement.mockReset();
  });

  it("does not fetch fleet when not_contracted (EntitlementRoute owns UI)", () => {
    mockUseEntitlement.mockReturnValue(entitlementState("not_contracted"));

    renderPage();

    expect(mockUseEntitlement).toHaveBeenCalledWith("gps_tracking");
    expect(mockGetFleet).not.toHaveBeenCalled();
    expect(screen.getByTestId("fleet-map-page")).toBeInTheDocument();
  });

  it("loads fleet when module is entitled", async () => {
    mockUseEntitlement.mockReturnValue(entitlementState("active"));
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
