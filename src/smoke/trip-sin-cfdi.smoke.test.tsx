/**
 * Smoke ADR-0096 — viaje liquidado sin CFDI (efectivo).
 * Mock de API; no requiere backend.
 *
 * Flujo UI: intent sin_cfdi → oculta CTAs Facturar/false_trip/split →
 * Dinero del viaje muestra Pendiente de cobro + Registrar cobro en efectivo →
 * scorecard «Cobrado en efectivo» (no «Cobrado del viaje»).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { TripInvoiceActions } from "@features/trips/presentation/components/TripInvoiceActions";
import { TripWizardFinancialSummary } from "@features/trips/presentation/components/trip-financial";
import { buildTripWizardFinancialSnapshot } from "@features/trips/presentation/components/trip-financial";
import { tripDetailCopy } from "@features/trips/presentation/copy";
import { tripFiscalCopy } from "@features/trips/presentation/copy/tripFiscalCopy";
import { cfdiEmissionIntentCopy } from "@features/trips/presentation/copy/cfdiEmissionIntentCopy";
import { TripDetailCostsTab } from "@features/trips/presentation/components/trip-costs/TripDetailCostsTab";

const mockNavigate = vi.fn();
const mockPatchOperationalCash = vi.fn();

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

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: {
    patchOperationalCash: (...args: unknown[]) =>
      mockPatchOperationalCash(...args),
    patchBaseRate: vi.fn(),
  },
}));

vi.mock("@features/vehicles/application", () => ({
  useVehicle: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@features/approvals", () => ({
  RejectExpenseSheet: () => null,
}));

const TRIP_ID = "550e8400-e29b-41d4-a716-446655440099";

function makeSinCfdiTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: TRIP_ID,
    status: TripStatus.COMPLETED,
    tripCode: "VJ-ABASTO-001",
    cfdiEmissionIntent: "sin_cfdi_efectivo",
    operationalCashCollectedAt: null,
    operationalCashAmount: null,
    operationalCashNote: null,
    costs: { baseRate: 8500, currency: "MXN" },
    invoicing: tripInvoicingFixture({
      canGenerateInvoice: true,
      canGenerateAccessoryInvoice: true,
      canGenerateFalseTripInvoice: true,
      canGenerateSplitShareInvoice: true,
    }),
    ...overrides,
  } as Trip;
}

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("smoke ADR-0096 trip sin-cfdi efectivo", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockPatchOperationalCash.mockReset();
    mockPatchOperationalCash.mockResolvedValue(
      makeSinCfdiTrip({
        operationalCashCollectedAt: new Date("2026-09-21T18:00:00.000Z"),
        operationalCashAmount: 8500,
      }),
    );
  });

  it("oculta CTAs Facturar / false_trip / split create en detalle", () => {
    render(
      <TestProviders>
        <TripInvoiceActions
          trip={makeSinCfdiTrip()}
          presentation="headerMenu"
        />
      </TestProviders>,
    );

    expect(
      screen.queryByRole("button", {
        name: /facturación/i,
      }),
    ).not.toBeInTheDocument();
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
  });

  it("en Dinero del viaje muestra Pendiente y registra cobro en efectivo", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <TripDetailCostsTab
          tripId={TRIP_ID}
          tripStatus={TripStatus.COMPLETED}
          baseRate={8500}
          cfdiDocumentIntent="ingreso"
          cfdiEmissionIntent="sin_cfdi_efectivo"
          operationalCashCollectedAt={null}
          operationalCashAmount={null}
          stops={[]}
          expenses={[]}
          isLoading={false}
          isError={false}
          onRetry={() => undefined}
          canEditBaseRate={false}
          canCreateExpenses={false}
          canUpdatePendingExpenses={false}
          canDeletePendingExpenses={false}
          canApproveExpenses={false}
        />
      </TestProviders>,
    );

    expect(
      screen.getByText(cfdiEmissionIntentCopy.cash.statusPending),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(tripDetailCopy.costs.financialSummary.label.cobradoViaje!),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(cfdiEmissionIntentCopy.cash.scorecardLabel),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: cfdiEmissionIntentCopy.cash.ctaRegister,
      }),
    );

    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).getByText(cfdiEmissionIntentCopy.cash.sheet.title),
    ).toBeInTheDocument();

    await user.click(
      within(sheet).getByRole("button", {
        name: cfdiEmissionIntentCopy.cash.sheet.submit,
      }),
    );

    expect(mockPatchOperationalCash).toHaveBeenCalled();
    const [tripId, body] = mockPatchOperationalCash.mock.calls[0] as [
      string,
      { amount: number; collectedAt?: string; note?: string },
    ];
    expect(tripId).toBe(TRIP_ID);
    expect(body.amount).toBe(8500);
    expect(body.collectedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("scorecard muestra Cobrado en efectivo y oculta filas fiscales", () => {
    const snapshot = buildTripWizardFinancialSnapshot(8500, [], {
      costBasis: "approved",
    });
    render(
      <TripWizardFinancialSummary
        snapshot={snapshot}
        variant="totals"
        summaryCopy={tripDetailCopy.costs.financialSummary}
        facturadoVigente={null}
        cobradoViaje={null}
        operationalCashAmount={8500}
        showOperationalCash
      />,
    );

    expect(
      screen.getByText(cfdiEmissionIntentCopy.cash.scorecardLabel),
    ).toBeInTheDocument();
    const cashRow = screen
      .getByText(cfdiEmissionIntentCopy.cash.scorecardLabel)
      .closest("div");
    expect(cashRow).toHaveTextContent(/\$8[,.]500/);
    expect(
      screen.queryByText(
        tripDetailCopy.costs.financialSummary.label.cobradoViaje!,
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        tripDetailCopy.costs.financialSummary.label.facturadoVigente!,
      ),
    ).not.toBeInTheDocument();
  });

  it("T4-051: sin_cfdi sin cargas activas bloquea start/complete (gate UX)", async () => {
    const { sinCfdiCargoBlockReason } = await import(
      "@features/trips/presentation/utils/tripSinCfdiCargoGating"
    );
    expect(
      sinCfdiCargoBlockReason("sin_cfdi_efectivo", [], "start"),
    ).toBe(cfdiEmissionIntentCopy.cargoGate.ctaStartBlocked);
    expect(
      sinCfdiCargoBlockReason("sin_cfdi_efectivo", [], "complete"),
    ).toBe(cfdiEmissionIntentCopy.cargoGate.ctaCompleteBlocked);
    expect(
      sinCfdiCargoBlockReason("sin_cfdi_efectivo", [{ status: "cancelled" }], "start"),
    ).toBe(cfdiEmissionIntentCopy.cargoGate.ctaStartBlocked);
    expect(
      sinCfdiCargoBlockReason(
        "sin_cfdi_efectivo",
        [{ status: "pending" }],
        "start",
      ),
    ).toBeNull();
    expect(sinCfdiCargoBlockReason("emitir_cfdi", [], "start")).toBeNull();
  });
});
