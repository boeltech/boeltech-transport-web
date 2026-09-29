import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { TripInvoiceActions } from "./TripInvoiceActions";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
    isLoading: false,
    isAuthenticated: true,
    role: "dispatcher",
  }),
}));

function makeTrip(): Trip {
  return {
    id: "trip-ready",
    status: TripStatus.COMPLETED,
    tripCode: "TRP-READY",
    invoicing: tripInvoicingFixture({
      canGenerateInvoice: true,
      canGenerateAccessoryInvoice: false,
      canGenerateFalseTripInvoice: false,
    }),
  } as Trip;
}

function renderActions(trip: Trip) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TripInvoiceActions trip={trip} presentation="headerMenu" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TripInvoiceActions wayfinding (dispatcher)", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "trips" && (action === "read" || action === "update"),
    );
  });

  it("muestra pendiente de facturar sin CTA Facturar", () => {
    renderActions(makeTrip());

    expect(
      screen.getByText(tripFiscalCopy.invoiceActions.pendingAccountant),
    ).toBeInTheDocument();
    expect(tripFiscalCopy.invoiceActions.pendingAccountant).toBe(
      "Pendiente de facturar",
    );
    expect(tripFiscalCopy.invoiceActions.pendingAccountant).not.toMatch(
      /contador|gerente|por facturar/i,
    );
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).not.toBeInTheDocument();
  });
});
