import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import { dashboardCopy } from "../copy/dashboardCopy";
import { DashboardCollectionsWeekZone } from "./DashboardCollectionsWeekZone";

const navState = { from: DASHBOARD_PATH, fromLabel: "Inicio" };

const { mockUseCollectionsWeek } = vi.hoisted(() => ({
  mockUseCollectionsWeek: vi.fn(),
}));

vi.mock("@features/finance", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/finance")>();
  return {
    ...actual,
    useCollectionsWeek: () => mockUseCollectionsWeek(),
  };
});

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
        <DashboardCollectionsWeekZone navState={navState} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DashboardCollectionsWeekZone", () => {
  beforeEach(() => {
    mockUseCollectionsWeek.mockReturnValue({
      data: {
        weekStart: "2026-11-16",
        weekEnd: "2026-11-22",
        days: [
          {
            date: "2026-11-16",
            withInvoice: 8000,
            withoutInvoice: 3200,
            total: 11200,
          },
          {
            date: "2026-11-17",
            withInvoice: 0,
            withoutInvoice: 0,
            total: 0,
          },
          {
            date: "2026-11-13",
            withInvoice: 21900,
            withoutInvoice: 0,
            total: 21900,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    });
  });

  it("muestra días con cobro y oculta ceros; fila abre Cobros por fecha", () => {
    renderZone();
    expect(
      screen.getByRole("heading", {
        name: dashboardCopy.collectionsWeek.title,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/16/)).toBeInTheDocument();
    expect(screen.queryByText(/17/)).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: /16/i });
    expect(link).toHaveAttribute("href", "/finance/payments?date=2026-11-16");
    expect(
      screen.getByText(dashboardCopy.collectionsWeek.footer),
    ).toBeInTheDocument();
  });

  it("pasa state.from y fromLabel al día de Cobros (H-U01-N01)", async () => {
    const user = userEvent.setup();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[DASHBOARD_PATH]}>
          <Routes>
            <Route
              path={DASHBOARD_PATH}
              element={<DashboardCollectionsWeekZone navState={navState} />}
            />
            <Route path="/finance/payments" element={<DestinationProbe />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("link", { name: /16/i }));

    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"from":"/dashboard"',
    );
    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"fromLabel":"Inicio"',
    );
  });
});
