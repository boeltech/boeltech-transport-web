import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { TripInvoiceActions } from "./TripInvoiceActions";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

const TRIP_ID = "trip-false-1";

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: TRIP_ID,
    status: TripStatus.COMPLETED,
    tripCode: "VJ-FALSO-001",
    operationalOutcome: "false_trip",
    invoicing: tripInvoicingFixture({
      canGenerateInvoice: false,
      canGenerateAccessoryInvoice: false,
      canGenerateFalseTripInvoice: true,
    }),
    ...overrides,
  } as Trip;
}

function renderActions(trip: Trip) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TripInvoiceActions trip={trip} presentation="inline" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TripInvoiceActions false trip (ADR-0079)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("hides primary CP CTA and navigates to scope=false_trip", async () => {
    const user = userEvent.setup();
    renderActions(makeTrip());

    const cta = screen.getByRole("button", {
      name: tripFiscalCopy.invoiceActions.generateFalseTrip,
    });
    expect(cta).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).not.toBeInTheDocument();

    await user.click(cta);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/invoices/new?trip_id=${TRIP_ID}&scope=false_trip`,
    );
  });

  it("hides CP generate CTA even if canGenerateInvoice is true on a false trip", () => {
    renderActions(
      makeTrip({
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: true,
          canGenerateAccessoryInvoice: true,
          canGenerateFalseTripInvoice: true,
        }),
      }),
    );

    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).not.toBeInTheDocument();
  });
});
