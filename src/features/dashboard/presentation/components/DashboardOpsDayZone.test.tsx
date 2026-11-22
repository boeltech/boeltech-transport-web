import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import { dashboardCopy } from "../copy/dashboardCopy";
import { DashboardOpsDayZone } from "./DashboardOpsDayZone";

const navState = { from: DASHBOARD_PATH, fromLabel: "Inicio" };

const { mockUseTripOpsDaySummary } = vi.hoisted(() => ({
  mockUseTripOpsDaySummary: vi.fn(),
}));

vi.mock("@features/trips/application", () => ({
  useTripOpsDaySummary: () => mockUseTripOpsDaySummary(),
}));

function DestinationProbe() {
  const location = useLocation();
  return (
    <pre data-testid="dest-state">{JSON.stringify(location.state)}</pre>
  );
}

function renderZone(role = "manager") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardOpsDayZone role={role} navState={navState} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DashboardOpsDayZone", () => {
  beforeEach(() => {
    mockUseTripOpsDaySummary.mockReset();
  });

  it("muestra franja, filas y pie con deep-links", () => {
    mockUseTripOpsDaySummary.mockReturnValue({
      data: {
        counts: { departing: 5, inProgress: 7, overdue: 2, arrived: 3 },
        overdueBreakdown: { departureLate: 1, arrivalLate: 1 },
        items: [
          {
            id: "t1",
            tripCode: "V-2479",
            originCity: "Celaya",
            destinationCity: "CDMX",
            status: "in_progress",
            scheduledDeparture: "2026-11-17T18:00:00.000Z",
            scheduledArrival: "2026-11-17T19:10:00.000Z",
            actualDeparture: "2026-11-17T18:00:00.000Z",
            actualArrival: null,
            delayKind: "arrival",
            delayMs: 3_600_000,
            driverFullName: "M. Torres",
            vehicleUnitNumber: "T-08",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderZone("manager");

    expect(
      screen.getByRole("heading", { name: dashboardCopy.opsDay.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(dashboardCopy.opsDay.strip.departing)).toBeInTheDocument();
    expect(
      screen.getAllByText(dashboardCopy.opsDay.strip.overdue).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("V-2479")).toBeInTheDocument();
    expect(screen.getByText("llegada · 1 h tarde")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: dashboardCopy.opsDay.viewAll(15) }),
    ).toHaveAttribute("href", expect.stringMatching(/^\/trips\?opsDay=/));
    expect(
      screen.getByRole("link", { name: /Con retraso/ }),
    ).toHaveAttribute("href", "/trips?overdue=1");
  });

  it("pasa state.from y fromLabel al bucket Con retraso (H-U01-N01)", async () => {
    const user = userEvent.setup();
    mockUseTripOpsDaySummary.mockReturnValue({
      data: {
        counts: { departing: 1, inProgress: 0, overdue: 2, arrived: 0 },
        overdueBreakdown: { departureLate: 1, arrivalLate: 1 },
        items: [],
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
              element={
                <DashboardOpsDayZone role="manager" navState={navState} />
              }
            />
            <Route path="/trips" element={<DestinationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("link", { name: /Con retraso/ }));

    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"from":"/dashboard"',
    );
    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"fromLabel":"Inicio"',
    );
  });

  it("vacío + próximo viaje", () => {
    mockUseTripOpsDaySummary.mockReturnValue({
      data: {
        counts: { departing: 0, inProgress: 0, overdue: 0, arrived: 0 },
        overdueBreakdown: { departureLate: 0, arrivalLate: 0 },
        items: [],
        nextTrip: {
          id: "n1",
          tripCode: "V-2500",
          originCity: "Qro",
          destinationCity: "GDL",
          status: "scheduled",
          scheduledDeparture: "2026-11-18T15:00:00.000Z",
          scheduledArrival: null,
          actualDeparture: null,
          actualArrival: null,
          delayKind: null,
          delayMs: null,
          driverFullName: null,
          vehicleUnitNumber: null,
        },
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });

    renderZone("dispatcher");
    expect(screen.getByText(dashboardCopy.opsDay.empty)).toBeInTheDocument();
    expect(screen.getByText(/V-2500/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: dashboardCopy.opsDay.nextTripCta }),
    ).toHaveAttribute("href", "/trips/n1");
  });
});
