import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { tripsListCopy } from "../copy/listCopy";
import { OPERATOR_COSTS_ORIENTATION_STORAGE_KEY } from "../components/OperatorCostsOrientationAlert";
import { CLIENT_PORTAL_ORIENTATION_STORAGE_KEY } from "../components/ClientPortalOrientationAlert";
import { DRIVER_PORTAL_ORIENTATION_STORAGE_KEY } from "../components/DriverPortalOrientationAlert";
import { TripsListPage } from "./TripsListPage";

const { mockUseRole, mockHasPermission } = vi.hoisted(() => ({
  mockUseRole: vi.fn(() => "operator"),
  mockHasPermission: vi.fn(() => true),
}));

vi.mock("../../application", () => ({
  useTrips: () => ({
    data: {
      data: [],
      pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  useDeleteTrip: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelTrip: () => ({ mutate: vi.fn(), isPending: false }),
  useTripWorkbenchSummary: () => ({
    summary: {
      draft: 0,
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      fiscalAttention: 0,
      overdue: 0,
    },
    isLoading: false,
    isFetching: false,
    hasError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [] } }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
  useRole: () => mockUseRole(),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function renderPage(role: string) {
  mockUseRole.mockReturnValue(role);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/trips"]}>
        <TripsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TripsListPage — orientación operator", () => {
  beforeEach(() => {
    window.localStorage.removeItem(OPERATOR_COSTS_ORIENTATION_STORAGE_KEY);
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "trips" && (action === "create" || action === "read"),
    );
  });

  it("operator ve description + Alert L1 y no los 4 pasos de patio", () => {
    renderPage("operator");

    expect(
      screen.getByText(tripsListCopy.page.descriptionOperator),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripsListCopy.operatorOrientation.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripsListCopy.empty.noDataDescriptionOperator),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(tripsListCopy.empty.jobLead),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Reservar el viaje")).not.toBeInTheDocument();
    expect(screen.queryByText("Confirmar la reserva")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: tripsListCopy.actions.create })
        .length,
    ).toBeGreaterThan(0);
  });

  it("dispatcher conserva empty de 4 pasos y no monta el Alert del operator", () => {
    renderPage("dispatcher");

    expect(
      screen.getByText(tripsListCopy.page.descriptionDispatcher),
    ).toBeInTheDocument();
    expect(screen.getByText(tripsListCopy.empty.jobLead)).toBeInTheDocument();
    expect(screen.getAllByText("Reservar el viaje").length).toBeGreaterThan(0);
    expect(
      screen.queryByText(tripsListCopy.operatorOrientation.title),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(tripsListCopy.driverOrientation.title),
    ).not.toBeInTheDocument();
  });
});

describe("TripsListPage — orientación driver", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DRIVER_PORTAL_ORIENTATION_STORAGE_KEY);
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "trips" && (action === "read" || action === "updateStatus"),
    );
  });

  it("driver ve description + Alert L1 y no Reservar ni 4 pasos", () => {
    renderPage("driver");

    expect(
      screen.getByText(tripsListCopy.page.descriptionDriver),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripsListCopy.driverOrientation.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripsListCopy.empty.noDataDescriptionDriver),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(tripsListCopy.empty.jobLead),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Reservar el viaje")).not.toBeInTheDocument();
    expect(screen.queryByText("Confirmar la reserva")).not.toBeInTheDocument();
    expect(
      screen.queryByText(tripsListCopy.operatorOrientation.title),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: tripsListCopy.actions.create }),
    ).not.toBeInTheDocument();
  });
});

describe("TripsListPage — orientación client", () => {
  beforeEach(() => {
    window.localStorage.removeItem(CLIENT_PORTAL_ORIENTATION_STORAGE_KEY);
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "trips" && action === "read",
    );
  });

  it("client ve Alert L1a + empty de asignación y no Reservar ni 4 pasos", () => {
    renderPage("client");

    expect(
      screen.getByText(tripsListCopy.page.descriptionClient),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripsListCopy.clientOrientation.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripsListCopy.empty.noDataDescriptionClient),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(tripsListCopy.empty.jobLead),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Reservar el viaje")).not.toBeInTheDocument();
    expect(
      screen.queryByText(tripsListCopy.driverOrientation.title),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: tripsListCopy.actions.create }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/aún no salen/i)).toBeInTheDocument();
    expect(screen.queryByText(/listos para iniciar/i)).not.toBeInTheDocument();
  });
});
