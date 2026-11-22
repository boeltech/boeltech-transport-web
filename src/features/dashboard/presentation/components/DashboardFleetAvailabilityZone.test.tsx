import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import { dashboardCopy } from "../copy/dashboardCopy";
import { DashboardFleetAvailabilityZone } from "./DashboardFleetAvailabilityZone";

const navState = { from: DASHBOARD_PATH, fromLabel: "Inicio" };

const { mockUseFleetAvailability } = vi.hoisted(() => ({
  mockUseFleetAvailability: vi.fn(),
}));

vi.mock("../../application/hooks/useFleetAvailability", () => ({
  useFleetAvailability: () => mockUseFleetAvailability(),
}));

function DestinationProbe() {
  const location = useLocation();
  return (
    <pre data-testid="dest-state">{JSON.stringify(location.state)}</pre>
  );
}

function renderZone() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardFleetAvailabilityZone navState={navState} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DashboardFleetAvailabilityZone", () => {
  beforeEach(() => {
    mockUseFleetAvailability.mockReset();
  });

  it("muestra libres, leyendas DOM y nota Libre", () => {
    mockUseFleetAvailability.mockReturnValue({
      data: {
        vehicles: {
          totalActive: 18,
          free: 4,
          onTrip: 11,
          inMaintenance: 2,
          outOfService: 1,
        },
        drivers: {
          totalActive: 22,
          free: 5,
          onTrip: 13,
          resting: 4,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderZone();

    expect(
      screen.getByRole("heading", {
        name: dashboardCopy.fleetAvailability.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.fleetAvailability.vehiclesFreeCaption(18)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.fleetAvailability.legend.inMaintenance),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.fleetAvailability.legend.resting),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.fleetAvailability.note),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: dashboardCopy.fleetAvailability.vehiclesLink,
      }),
    ).toHaveAttribute("href", "/vehicles");
  });

  it("pasa state.from y fromLabel a Unidades (H-U01-N01)", async () => {
    const user = userEvent.setup();
    mockUseFleetAvailability.mockReturnValue({
      data: {
        vehicles: {
          totalActive: 18,
          free: 4,
          onTrip: 11,
          inMaintenance: 2,
          outOfService: 1,
        },
        drivers: {
          totalActive: 22,
          free: 5,
          onTrip: 13,
          resting: 4,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[DASHBOARD_PATH]}>
          <Routes>
            <Route
              path={DASHBOARD_PATH}
              element={<DashboardFleetAvailabilityZone navState={navState} />}
            />
            <Route path="/vehicles" element={<DestinationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("link", {
        name: dashboardCopy.fleetAvailability.vehiclesLink,
      }),
    );

    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"from":"/dashboard"',
    );
    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"fromLabel":"Inicio"',
    );
  });
});
