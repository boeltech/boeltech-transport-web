import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { TripInvoiceActions } from "./TripInvoiceActions";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
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

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-sin-cfdi-1",
    status: TripStatus.COMPLETED,
    tripCode: "VJ-SIN-001",
    cfdiEmissionIntent: "sin_cfdi_efectivo",
    invoicing: tripInvoicingFixture({
      canGenerateInvoice: true,
      canGenerateAccessoryInvoice: true,
      canGenerateFalseTripInvoice: true,
      canGenerateSplitShareInvoice: true,
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

describe("TripInvoiceActions — ADR-0096 sin_cfdi_efectivo", () => {
  it("no muestra Facturar aunque canGenerateInvoice sea true", () => {
    renderActions(makeTrip());

    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generateFalseTrip,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: tripFiscalCopy.invoiceActions.generateAccessory,
      }),
    ).not.toBeInTheDocument();
  });

  it("emitir_cfdi sigue mostrando Facturar cuando API lo permite", () => {
    renderActions(
      makeTrip({
        cfdiEmissionIntent: "emitir_cfdi",
        operationalOutcome: "standard",
        invoicing: tripInvoicingFixture({
          canGenerateInvoice: true,
          canGenerateFalseTripInvoice: false,
        }),
      }),
    );

    expect(
      screen.getByRole("button", {
        name: tripFiscalCopy.invoiceActions.generatePrimary,
      }),
    ).toBeInTheDocument();
  });
});
