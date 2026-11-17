/**
 * Smoke ADR-0096 — viaje liquidado sin CFDI + ledger de cobros (F5 / Q11).
 * Mock de API; no requiere backend.
 *
 * Flujo UI: intent sin_cfdi → oculta CTAs Facturar/false_trip/split →
 * tab Cobro (no Costos) con «Cobros de este viaje» → Registrar cobro (form) / Ver cobro (hoja; Anular solo ahí).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useState, type ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@shared/ui/button";

import {
  TripStatus,
  type OperationalCashReceipt,
  type OperationalCashSummary,
  type Trip,
} from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { TripInvoiceActions } from "@features/trips/presentation/components/TripInvoiceActions";
import { TripWizardFinancialSummary } from "@features/trips/presentation/components/trip-financial";
import { buildTripWizardFinancialSnapshot } from "@features/trips/presentation/components/trip-financial";
import { tripDetailCopy } from "@features/trips/presentation/copy";
import { tripFiscalCopy } from "@features/trips/presentation/copy/tripFiscalCopy";
import { cfdiEmissionIntentCopy } from "@features/trips/presentation/copy/cfdiEmissionIntentCopy";
import { TripDetailBillingTab } from "@features/trips/presentation/components/trip-billing/TripDetailBillingTab";
import { RegisterOperationalCashSheet } from "@features/trips/presentation/components/trip-costs/RegisterOperationalCashSheet";
import { billingCopy } from "@features/trips/presentation/copy/tripDetail/billingCopy";

const cashCopy = cfdiEmissionIntentCopy.cash;
const sinCfdiCopy = billingCopy.sinCfdi;

const {
  mockNavigate,
  mockCreateOperationalCashReceipt,
  mockListOperationalCashReceipts,
  mockVoidOperationalCashReceipt,
  mockHasPermission,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockCreateOperationalCashReceipt: vi.fn(),
  mockListOperationalCashReceipts: vi.fn(),
  mockVoidOperationalCashReceipt: vi.fn(),
  mockHasPermission: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
  useRole: () => "admin",
}));

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: {
    createOperationalCashReceipt: (...args: unknown[]) =>
      mockCreateOperationalCashReceipt(...args),
    listOperationalCashReceipts: (...args: unknown[]) =>
      mockListOperationalCashReceipts(...args),
    voidOperationalCashReceipt: (...args: unknown[]) =>
      mockVoidOperationalCashReceipt(...args),
    patchBaseRate: vi.fn(),
  },
}));

vi.mock("@features/vehicles/application", () => ({
  useVehicle: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@features/trips/presentation/components/trip-fleet-snapshot", () => ({
  TripFleetSnapshotCard: () => null,
}));

vi.mock("@features/finance/presentation/components", () => ({
  OperationalReceiptBatchSheet: () => null,
  CollectionDetailSheet: () => null,
}));

vi.mock("@features/invoicing/application", () => ({
  useInvoice: () => ({ data: undefined }),
  buildInvoiceCreateHref: () => "/invoices/new",
}));

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
  SelfApprovalConfirmDialog: () => null,
  OwnRequestChip: () => null,
  SelfApprovedBadge: () => null,
  showsSelfApprovedBadge: () => false,
  buildApprovalsInboxPath: () => "/finance/approvals",
  invalidateApprovalsRelatedQueries: vi.fn(),
  useSelfActionForbiddenHandler: () => () => null,
  useSelfActionResolver: () => () => "normal",
}));

vi.mock("@features/approvals/application", () => ({
  invalidateApprovalsRelatedQueries: vi.fn(),
}));

const TRIP_ID = "550e8400-e29b-41d4-a716-446655440099";
const BASE_RATE = 24500;

function makeReceipt(
  overrides: Partial<OperationalCashReceipt> = {},
): OperationalCashReceipt {
  return {
    id: "r1",
    tripId: TRIP_ID,
    amount: 10000,
    collectedAt: new Date("2026-10-04T12:00:00.000Z"),
    note: null,
    paymentInstrument: "cash",
    reference: null,
    batchId: null,
    createdBy: "u1",
    createdAt: new Date("2026-10-04T12:00:00.000Z"),
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    ...overrides,
  };
}

function makeSinCfdiTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: TRIP_ID,
    status: TripStatus.COMPLETED,
    tripCode: "VJ-ABASTO-001",
    cfdiEmissionIntent: "sin_cfdi_efectivo",
    operationalCashCollectedAt: null,
    operationalCashAmount: null,
    operationalCashNote: null,
    operationalCash: {
      status: "pending",
      collectedTotal: 0,
      pendingAmount: 8500,
      baseRate: 8500,
      receiptCount: 0,
    },
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

function CobroHarness({
  trip,
  pendingAmount,
  withRegisterCta = false,
}: {
  trip: Trip;
  pendingAmount: number;
  withRegisterCta?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {withRegisterCta ? (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          {cashCopy.ctaRegister}
        </Button>
      ) : null}
      <TripDetailBillingTab trip={trip} canSubstituteInvoice={false} />
      {withRegisterCta ? (
        <RegisterOperationalCashSheet
          tripId={TRIP_ID}
          open={open}
          onOpenChange={setOpen}
          pendingAmount={pendingAmount}
        />
      ) : null}
    </>
  );
}

function renderCobroTab(args: {
  operationalCash: OperationalCashSummary;
  withRegisterCta?: boolean;
  tripOverrides?: Partial<Trip>;
}) {
  const { operationalCash, withRegisterCta = false, tripOverrides } = args;
  const trip = makeSinCfdiTrip({
    costs: {
      baseRate: operationalCash.baseRate,
      fuelCost: 0,
      tollCost: 0,
      otherCosts: 0,
      totalCost: 0,
    },
    operationalCash,
    operationalCashAmount:
      operationalCash.collectedTotal > 0
        ? operationalCash.collectedTotal
        : null,
    ...tripOverrides,
  });
  return render(
    <TestProviders>
      <CobroHarness
        trip={trip}
        pendingAmount={operationalCash.pendingAmount}
        withRegisterCta={withRegisterCta}
      />
    </TestProviders>,
  );
}

describe("smoke ADR-0096 trip sin-cfdi efectivo", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockCreateOperationalCashReceipt.mockReset();
    mockListOperationalCashReceipts.mockReset();
    mockVoidOperationalCashReceipt.mockReset();
    mockHasPermission.mockReset();
    mockHasPermission.mockReturnValue(true);
    mockListOperationalCashReceipts.mockResolvedValue([]);
    mockCreateOperationalCashReceipt.mockResolvedValue(
      makeReceipt({ id: "receipt-1", amount: 8500 }),
    );
    mockVoidOperationalCashReceipt.mockResolvedValue(
      makeReceipt({
        voidedAt: new Date("2026-10-04T13:00:00.000Z"),
        voidedBy: "u1",
        voidReason: "Error de captura",
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

  it("tab Cobro: Tarifa/Por cobrar y registra cobro (POST ledger)", async () => {
    const user = userEvent.setup();
    renderCobroTab({
      withRegisterCta: true,
      operationalCash: {
        status: "pending",
        collectedTotal: 0,
        pendingAmount: 8500,
        baseRate: 8500,
        receiptCount: 0,
      },
    });

    expect(screen.getByTestId("trip-billing-sin-cfdi-cobro")).toBeInTheDocument();
    expect(screen.getByText(sinCfdiCopy.tableTitle)).toBeInTheDocument();
    expect(screen.getByText(sinCfdiCopy.tarifa)).toBeInTheDocument();
    expect(screen.getByText(sinCfdiCopy.porCobrar)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: cashCopy.ctaRegister }),
    );

    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).getByRole("heading", { name: cashCopy.sheet.title }),
    ).toBeInTheDocument();
    expect(
      within(sheet).getByText(cashCopy.sheet.paymentInstrument),
    ).toBeInTheDocument();

    const submit = sheet.querySelector<HTMLButtonElement>(
      'button[type="submit"][form="register-operational-cash-form"]',
    );
    expect(submit).not.toBeNull();
    await user.click(submit!);

    expect(mockCreateOperationalCashReceipt).toHaveBeenCalled();
    const [tripId, body] = mockCreateOperationalCashReceipt.mock.calls[0] as [
      string,
      { amount: number; collectedAt?: string; note?: string },
    ];
    expect(tripId).toBe(TRIP_ID);
    expect(body.amount).toBe(8500);
    expect(body.collectedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("scorecard muestra Efectivo acumulado + Por cobrar y oculta filas fiscales", () => {
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
        operationalCashPendingAmount={0}
        showOperationalCash
      />,
    );

    expect(
      screen.getByText(cashCopy.scorecardAccumulatedLabel),
    ).toBeInTheDocument();
    expect(screen.getByText(cashCopy.scorecardPendingLabel)).toBeInTheDocument();
    const cashRow = screen
      .getByText(cashCopy.scorecardAccumulatedLabel)
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

  it("parcial: Cobrado parcial y tabla Cobros de este viaje", async () => {
    mockListOperationalCashReceipts.mockResolvedValue([makeReceipt()]);

    renderCobroTab({
      operationalCash: {
        status: "partial",
        collectedTotal: 10000,
        pendingAmount: 14500,
        baseRate: BASE_RATE,
        receiptCount: 1,
      },
    });

    expect(await screen.findByText(sinCfdiCopy.tableTitle)).toBeInTheDocument();
    expect(screen.getByText(sinCfdiCopy.cobrado)).toBeInTheDocument();
    expect(screen.getByText(/\$10[,.]000/)).toBeInTheDocument();
    expect(
      await screen.findByText(sinCfdiCopy.statusActive),
    ).toBeInTheDocument();
    // Q11: CTA Registrar cobro vive en header, no en el panel.
    expect(
      screen.queryByRole("button", { name: cashCopy.ctaRegister }),
    ).not.toBeInTheDocument();
  });

  it("collected: por cobrar 0 y sin Anular en filas", async () => {
    mockListOperationalCashReceipts.mockResolvedValue([
      makeReceipt({ id: "r1", amount: 10000 }),
      makeReceipt({
        id: "r2",
        amount: 14500,
        collectedAt: new Date("2026-10-04T14:00:00.000Z"),
        createdAt: new Date("2026-10-04T14:00:00.000Z"),
      }),
    ]);

    renderCobroTab({
      operationalCash: {
        status: "collected",
        collectedTotal: BASE_RATE,
        pendingAmount: 0,
        baseRate: BASE_RATE,
        receiptCount: 2,
      },
    });

    expect(await screen.findByText(sinCfdiCopy.porCobrar)).toBeInTheDocument();
    expect(screen.getByText(/\$0[,.]00/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: cashCopy.ctaRegister }),
    ).not.toBeInTheDocument();
  });

  it("legacy sin batchId: Ver cobro en fila (Anular solo en hoja)", async () => {
    const active = makeReceipt();
    mockListOperationalCashReceipts.mockResolvedValue([active]);

    renderCobroTab({
      operationalCash: {
        status: "partial",
        collectedTotal: 10000,
        pendingAmount: 14500,
        baseRate: BASE_RATE,
        receiptCount: 1,
      },
    });

    expect(
      await screen.findByRole("button", { name: sinCfdiCopy.viewCobro }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: cashCopy.voidCta }),
    ).not.toBeInTheDocument();
  });

  it("post-void: fila Anulado sin acción; batch usa Ver cobro", async () => {
    mockListOperationalCashReceipts.mockResolvedValue([
      makeReceipt({
        voidedAt: new Date("2026-10-04T13:00:00.000Z"),
        voidedBy: "u1",
        voidReason: "Error de captura",
      }),
      makeReceipt({
        id: "r-batch",
        amount: 6000,
        batchId: "batch-1",
        collectedAt: new Date("2026-10-04T14:00:00.000Z"),
      }),
    ]);

    renderCobroTab({
      operationalCash: {
        status: "partial",
        collectedTotal: 6000,
        pendingAmount: BASE_RATE - 6000,
        baseRate: BASE_RATE,
        receiptCount: 1,
      },
    });

    expect(await screen.findByText(sinCfdiCopy.statusVoided)).toBeInTheDocument();
    expect(screen.getByText(sinCfdiCopy.batchPartOfMulti)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: sinCfdiCopy.viewCobro }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: cashCopy.voidCta }),
    ).not.toBeInTheDocument();
  });

  it("emitir_cfdi: hogar Facturación (no panel Cobro sin factura)", () => {
    render(
      <TestProviders>
        <TripDetailBillingTab
          trip={makeSinCfdiTrip({
            cfdiEmissionIntent: "emitir_cfdi",
            invoicing: tripInvoicingFixture({
              invoiceId: "inv-1",
              invoiceFolio: "F-1",
              invoiceStatus: "stamped",
              hasActiveInvoice: true,
              hasActivePrimaryInvoice: true,
              hasActivePrincipalInvoice: true,
            }),
          })}
          canSubstituteInvoice={false}
        />
      </TestProviders>,
    );

    expect(screen.getByTestId("trip-billing-tab")).toBeInTheDocument();
    expect(
      screen.queryByTestId("trip-billing-sin-cfdi-cobro"),
    ).not.toBeInTheDocument();
  });

  it("sin operational_cash void: sin Anular en fila", async () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        !(module === "operational_cash" && action === "void"),
    );
    mockListOperationalCashReceipts.mockResolvedValue([makeReceipt()]);

    renderCobroTab({
      operationalCash: {
        status: "partial",
        collectedTotal: 10000,
        pendingAmount: 14500,
        baseRate: BASE_RATE,
        receiptCount: 1,
      },
    });

    expect(await screen.findByText(sinCfdiCopy.tableTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: cashCopy.voidCta }),
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
  });
});
