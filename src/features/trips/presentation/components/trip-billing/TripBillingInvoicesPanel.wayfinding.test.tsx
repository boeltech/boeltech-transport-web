import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Trip } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { billingCopy } from "../../copy/tripDetail/billingCopy";
import { tripInvoiceNavState } from "../../utils/tripWayfinding";
import { TripBillingInvoicesPanel } from "./TripBillingInvoicesPanel";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@features/trips/application", () => ({
  useTripLinkedInvoices: () => ({ data: [], isLoading: false }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@features/invoicing/application/invoiceCreateHref", () => ({
  buildInvoiceCreateHref: (params: { tripId: string; scope?: string }) =>
    `/invoices/new?trip_id=${params.tripId}&scope=${params.scope ?? ""}`,
}));

function baseTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tripCode: "TRP-77",
    tenantId: "t1",
    vehicleId: "v1",
    driverId: "d1",
    clientId: "c1",
    status: "completed",
    operationalOutcome: null,
    invoicing: tripInvoicingFixture({
      canGenerateAccessoryInvoice: true,
    }),
    ...overrides,
  } as Trip;
}

describe("TripBillingInvoicesPanel wayfinding (N01)", () => {
  it("CTA accesoria navega con tripInvoiceNavState (from + fromLabel)", async () => {
    mockNavigate.mockReset();
    const user = userEvent.setup();
    const trip = baseTrip();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TripBillingInvoicesPanel trip={trip} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("button", {
        name: billingCopy.invoices.accessoryCta,
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining("/invoices/new"),
      { state: tripInvoiceNavState("trip-1", "TRP-77") },
    );
    expect(mockNavigate.mock.calls[0][1].state).toEqual({
      from: "/trips/trip-1",
      fromLabel: "TRP-77",
    });
  });
});
