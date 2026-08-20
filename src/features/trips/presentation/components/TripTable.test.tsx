import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import { TripStatus, type TripListItem } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { tripsListCopy } from "../copy/listCopy";
import { TripTable } from "./TripTable";

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function listTrip(
  overrides: Partial<TripListItem> = {},
): TripListItem {
  return {
    id: "t1",
    tripCode: "T-100",
    client: { id: "c1", legalName: "Transportes del Norte SA" },
    vehicle: {
      id: "v1",
      unitNumber: "U-12",
      licensePlate: "ABC-123",
    },
    driver: { id: "d1", fullName: "Ana Pérez" },
    originCity: "Guadalajara",
    originState: "JAL",
    destinationCity: "Monterrey",
    destinationState: "NLE",
    scheduledDeparture: new Date("2026-05-17T10:00:00.000Z"),
    scheduledArrival: null,
    status: TripStatus.SCHEDULED,
    operationalOutcome: "standard",
    falseTripDeclaredAt: null,
    falseTripDeclaredBy: null,
    cargoDescription: null,
    baseRate: 0,
    totalCost: 0,
    totalRevenue: 0,
    estimatedProfit: 0,
    cargoCount: 0,
    clientCount: 0,
    invoicing: tripInvoicingFixture({ canGenerateInvoice: true }),
    requiresFiscalAttention: false,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("TripTable", () => {
  it("muestra la columna Cliente con el nombre del list DTO", () => {
    renderWithProviders(
      <TripTable trips={[listTrip()]} isLoading={false} onView={vi.fn()} />,
    );

    expect(
      screen.getByRole("columnheader", { name: tripsListCopy.columns.client }),
    ).toBeInTheDocument();
    expect(screen.getByText("Transportes del Norte SA")).toBeInTheDocument();
  });

  it("muestra Sin cliente cuando no hay cliente", () => {
    renderWithProviders(
      <TripTable
        trips={[listTrip({ client: null })]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText(tripsListCopy.columns.noClient)).toBeInTheDocument();
  });

  it("oculta columna Cliente cuando hideClientColumn (portal cliente)", () => {
    renderWithProviders(
      <TripTable
        trips={[listTrip()]}
        isLoading={false}
        onView={vi.fn()}
        hideClientColumn
      />,
    );

    expect(
      screen.queryByRole("columnheader", {
        name: tripsListCopy.columns.client,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Transportes del Norte SA"),
    ).not.toBeInTheDocument();
  });

  it("usa el badge Requiere atención en lugar de Fiscal", () => {
    renderWithProviders(
      <TripTable
        trips={[listTrip({ requiresFiscalAttention: true })]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(
      screen.getByText(tripsListCopy.badge.fiscalAttention),
    ).toBeInTheDocument();
    expect(screen.queryByText("Fiscal")).not.toBeInTheDocument();
  });
});
