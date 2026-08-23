import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  TripStatus,
  type Trip,
  type TripRevenueSplit,
} from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { TripInvoiceActions } from "./TripInvoiceActions";
import { TripRevenueSplitSummaryLine } from "./TripRevenueSplitSummaryLine";

const mockNavigate = vi.fn();
const mockOpenSheet = vi.fn();

let mockRevenueSplitData: TripRevenueSplit | null | undefined = undefined;

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

vi.mock("@features/trips/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/trips/application")>();
  return {
    ...actual,
    useTripRevenueSplit: () => ({
      data: mockRevenueSplitData,
      isLoading: false,
      isFetched: true,
    }),
  };
});

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-ready-1",
    status: TripStatus.SCHEDULED,
    tripCode: "VJ-001",
    operationalOutcome: "standard",
    invoicing: tripInvoicingFixture({
      canGenerateInvoice: true,
      blockReason: null,
    }),
    ...overrides,
  } as Trip;
}

function renderHeaderMenu(trip: Trip) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <TripInvoiceActions
          trip={trip}
          presentation="headerMenu"
          onOpenRevenueSplit={mockOpenSheet}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TripInvoiceActions revenue split handoff (Capa 3)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockOpenSheet.mockReset();
    mockRevenueSplitData = undefined;
  });

  it("offers primary billing and reparto entry when trip is ready to bill", async () => {
    const user = userEvent.setup();
    renderHeaderMenu(makeTrip());

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(tripFiscalCopy.invoiceActions.menuLabel, "i"),
      }),
    );

    expect(
      screen.getByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.openRevenueSplit,
      }),
    ).toBeInTheDocument();
  });

  it("opens revenue split sheet from menu entry", async () => {
    const user = userEvent.setup();
    renderHeaderMenu(makeTrip());

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(tripFiscalCopy.invoiceActions.menuLabel, "i"),
      }),
    );
    await user.click(
      screen.getByRole("menuitem", {
        name: tripFiscalCopy.invoiceActions.openRevenueSplit,
      }),
    );

    expect(mockOpenSheet).toHaveBeenCalledTimes(1);
  });

  it("shows split progress only in menu header when split is active", async () => {
    const user = userEvent.setup();
    renderHeaderMenu(
      makeTrip({
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: false,
          hasActiveSplit: true,
          splitLegsInvoiced: 1,
          splitLegsTotal: 2,
          canGenerateSplitShareInvoice: true,
        }),
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(tripFiscalCopy.invoiceActions.menuLabel, "i"),
      }),
    );

    expect(
      screen.getByText(
        tripFiscalCopy.invoiceActions.splitProgress(1, 2),
      ),
    ).toBeInTheDocument();
  });
});

describe("TripRevenueSplitSummaryLine", () => {
  beforeEach(() => {
    mockRevenueSplitData = undefined;
  });

  it("renders compact pending summary without numeric progress", () => {
    render(
      <MemoryRouter>
        <TripRevenueSplitSummaryLine
          trip={
            makeTrip({
              invoicing: tripInvoicingFixture({
                hasActiveSplit: true,
                splitLegsInvoiced: 0,
                splitLegsTotal: 2,
              }),
            })
          }
          onViewRevenueSplit={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tripFiscalCopy.revenueSplit.summaryPending(2)),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(tripFiscalCopy.invoiceActions.splitProgress(0, 2)),
    ).not.toBeInTheDocument();
  });

  it("shows draft chip when split query returns draft and trip can generate invoice", () => {
    mockRevenueSplitData = {
      id: "split-draft",
      tripId: "trip-ready-1",
      status: "draft",
      basisAmount: 1000,
      currency: "MXN",
      notes: null,
      createdAt: "2026-08-22T10:00:00.000Z",
      updatedAt: "2026-08-22T10:00:00.000Z",
      legs: [],
    };

    render(
      <MemoryRouter>
        <TripRevenueSplitSummaryLine
          trip={
            makeTrip({
              invoicing: tripInvoicingFixture({
                canGenerateInvoice: true,
                hasActiveSplit: false,
                splitLegsTotal: 0,
              }),
            })
          }
          onViewRevenueSplit={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(tripFiscalCopy.revenueSplit.draftChip),
    ).toBeInTheDocument();
  });
});
