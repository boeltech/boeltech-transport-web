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

  it("Facturar (skip 1 scope) navega a scope=false_trip sin sheet", async () => {
    const user = userEvent.setup();
    renderActions(makeTrip());

    const cta = screen.getByRole("button", {
      name: tripFiscalCopy.invoiceActions.generatePrimary,
    });
    expect(cta).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: tripFiscalCopy.scopeDecisionSheet.title,
      }),
    ).not.toBeInTheDocument();

    await user.click(cta);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/invoices/new?trip_id=${TRIP_ID}&scope=false_trip`,
      {
        state: {
          from: `/trips/${TRIP_ID}`,
          fromLabel: "VJ-FALSO-001",
        },
      },
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

  it("headerMenu: stamped false_trip sin Facturar ni overflow (ver factura → tab)", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TripInvoiceActions
            trip={makeTrip({
              invoicing: tripInvoicingFixture({
                canGenerateInvoice: false,
                canGenerateAccessoryInvoice: false,
                canGenerateFalseTripInvoice: false,
                hasActiveInvoice: false,
                hasActivePrimaryInvoice: false,
                hasActivePrincipalInvoice: true,
                invoiceId: "inv-falso-1",
                invoiceFolio: "B8S-99",
                invoiceStatus: "stamped",
                blockReason:
                  "Este viaje ya tiene una factura activa y no se puede facturar nuevamente.",
              }),
            })}
            presentation="headerMenu"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.queryByTestId("trip-header-facturar"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("trip-invoice-header-overflow"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: new RegExp(tripFiscalCopy.invoiceActions.menuLabel, "i"),
      }),
    ).not.toBeInTheDocument();
  });
});

describe("TripInvoiceActions cancelled trip (hard-gate create)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("headerMenu: cancelled hides Facturar/overflow even if API canGenerate* is true", () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <TripInvoiceActions
            trip={makeTrip({
              status: TripStatus.CANCELLED,
              operationalOutcome: "standard",
              invoicing: tripInvoicingFixture({
                canGenerateInvoice: true,
                canGenerateAccessoryInvoice: true,
                canGenerateFalseTripInvoice: true,
                canGenerateSplitShareInvoice: true,
                invoiceId: "inv-cancelled-1",
                invoiceFolio: "A-1",
                invoiceStatus: "stamped",
                hasActivePrincipalInvoice: true,
                accessoryInvoices: [
                  {
                    id: "acc-1",
                    folio: "ACC-1",
                    status: "stamped",
                    total: 100,
                  },
                ],
              }),
            })}
            presentation="headerMenu"
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      screen.queryByTestId("trip-header-facturar"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("trip-invoice-header-overflow"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).not.toBeInTheDocument();
  });

  it("inline: does not offer create CTA when cancelled despite canGenerate flags", () => {
    renderActions(
      makeTrip({
        status: TripStatus.CANCELLED,
        operationalOutcome: "false_trip",
        invoicing: tripInvoicingFixture({
          canGenerateFalseTripInvoice: true,
          canGenerateInvoice: true,
          canGenerateAccessoryInvoice: true,
        }),
      }),
    );

    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).not.toBeInTheDocument();
  });
});

describe("TripInvoiceActions decision sheet (F3 / D2)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("1 scope primary: Facturar navega directo (skip sheet)", async () => {
    const user = userEvent.setup();
    renderActions(
      makeTrip({
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: true,
          canGenerateFalseTripInvoice: false,
          canGenerateAccessoryInvoice: false,
        }),
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      `/invoices/new?trip_id=${TRIP_ID}`,
      {
        state: {
          from: `/trips/${TRIP_ID}`,
          fromLabel: "VJ-FALSO-001",
        },
      },
    );
    expect(
      screen.queryByRole("heading", {
        name: tripFiscalCopy.scopeDecisionSheet.title,
      }),
    ).not.toBeInTheDocument();
  });

  it(">1 scopes: Facturar abre sheet con opciones elegibles", async () => {
    const user = userEvent.setup();
    renderActions(
      makeTrip({
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: true,
          canGenerateFalseTripInvoice: false,
          canGenerateAccessoryInvoice: true,
        }),
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    );

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", {
        name: tripFiscalCopy.scopeDecisionSheet.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripFiscalCopy.scopeDecisionSheet.optionPrimary),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripFiscalCopy.scopeDecisionSheet.optionAccessory),
    ).toBeInTheDocument();
    expect(
      screen.getByText(tripFiscalCopy.scopeDecisionSheet.cancelVsFalseHint),
    ).toBeInTheDocument();
  });
});

describe("TripInvoiceActions headerMenu D5 / D-HF1 (sin Select hermano)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  function renderHeader(trip: Trip) {
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

  it("solo accessory: sin Facturar ni overflow (accesoria → tab)", () => {
    renderHeader(
      makeTrip({
        status: TripStatus.COMPLETED,
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: false,
          canGenerateFalseTripInvoice: false,
          canGenerateAccessoryInvoice: true,
          invoiceId: "inv-flete-1",
          invoiceFolio: "A-100",
          invoiceStatus: "stamped",
          hasActivePrincipalInvoice: true,
        }),
      }),
    );

    expect(
      screen.queryByTestId("trip-header-facturar"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("trip-invoice-header-overflow"),
    ).not.toBeInTheDocument();
  });

  it.each([
    TripStatus.SCHEDULED,
    TripStatus.IN_PROGRESS,
    TripStatus.COMPLETED,
  ] as const)(
    "%s + solo accessory: sin Facturar ni overflow",
    (status) => {
      renderHeader(
        makeTrip({
          status,
          operationalOutcome: "standard",
          invoicing: tripInvoicingFixture({
            canGenerateInvoice: false,
            canGenerateFalseTripInvoice: false,
            canGenerateAccessoryInvoice: true,
            invoiceId: "inv-flete-1",
            invoiceFolio: "A-100",
            invoiceStatus: "stamped",
            hasActivePrincipalInvoice: true,
          }),
        }),
      );

      expect(
        screen.queryByTestId("trip-header-facturar"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("trip-invoice-header-overflow"),
      ).not.toBeInTheDocument();
    },
  );

  it("freight-family elegible: Facturar outline en header; cero overflow", async () => {
    const user = userEvent.setup();
    renderHeader(
      makeTrip({
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: true,
          canGenerateFalseTripInvoice: false,
          canGenerateAccessoryInvoice: false,
        }),
      }),
    );

    const facturar = screen.getByTestId("trip-header-facturar");
    expect(facturar).toBeInTheDocument();
    expect(facturar).toHaveTextContent(
      tripFiscalCopy.invoiceActions.generatePrimary,
    );
    expect(facturar.className).toMatch(/border-input|bg-background/);
    expect(facturar.className).not.toMatch(/bg-primary(?:\/|$|\s)/);
    expect(
      screen.queryByTestId("trip-invoice-header-overflow"),
    ).not.toBeInTheDocument();

    await user.click(facturar);
    expect(mockNavigate).toHaveBeenCalledWith(
      `/invoices/new?trip_id=${TRIP_ID}`,
      {
        state: {
          from: `/trips/${TRIP_ID}`,
          fromLabel: "VJ-FALSO-001",
        },
      },
    );
  });

  it("0 creates + evidencia: sin Facturar ni overflow (ver → tab)", () => {
    renderHeader(
      makeTrip({
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: false,
          canGenerateFalseTripInvoice: false,
          canGenerateAccessoryInvoice: false,
          invoiceId: "inv-done-1",
          invoiceFolio: "B-1",
          invoiceStatus: "stamped",
          hasActivePrincipalInvoice: true,
        }),
      }),
    );

    expect(
      screen.queryByTestId("trip-header-facturar"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("trip-invoice-header-overflow"),
    ).not.toBeInTheDocument();
  });
});
