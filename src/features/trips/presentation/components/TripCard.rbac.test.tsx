import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import { TripStatus, type TripListItem } from "@features/trips/domain";
import { TripCard } from "./TripCard";

function listTrip(
  overrides: Partial<TripListItem> & Pick<TripListItem, "id" | "status">,
): TripListItem {
  return {
    tripCode: "T-001",
    client: { id: "c1", legalName: "Cliente" },
    vehicle: { id: "v1", plateNumber: "ABC-123" },
    driver: { id: "d1", fullName: "Conductor" },
    originCity: "A",
    originState: null,
    destinationCity: "B",
    destinationState: null,
    scheduledDeparture: new Date("2026-05-17T10:00:00.000Z"),
    scheduledArrival: null,
    cargoDescription: null,
    baseRate: 0,
    totalCost: 0,
    totalRevenue: 0,
    estimatedProfit: 0,
    cargoCount: 0,
    clientCount: 0,
    invoicing: {
      invoiceId: null,
      invoiceFolio: null,
      invoiceStatus: null,
      invoiceUuid: null,
      invoiceable: false,
      invoiceableReason: null,
    },
    requiresFiscalAttention: false,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  } as TripListItem;
}

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("TripCard RBAC cancel", () => {
  it("no muestra menú Acciones cuando solo hay onView (read-only / portal)", () => {
    renderWithQuery(
      <TripCard
        trip={listTrip({ id: "t1", status: TripStatus.SCHEDULED })}
        onView={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Acciones/i }),
    ).not.toBeInTheDocument();
  });

  it("muestra Cancelar cuando onCancel está definido y el status lo permite", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <TripCard
        trip={listTrip({ id: "t1", status: TripStatus.SCHEDULED })}
        onView={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Acciones/i }));
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });
});
