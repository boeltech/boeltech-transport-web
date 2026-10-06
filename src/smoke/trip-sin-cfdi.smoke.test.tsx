/**
 * Smoke ADR-0096 — viaje liquidado sin CFDI (efectivo) + ledger de abonos.
 * Mock de API; no requiere backend.
 *
 * Flujo UI: intent sin_cfdi → oculta CTAs Facturar/false_trip/split →
 * Costos muestra Pendiente / parcial / cobrado → Registrar abono / void →
 * scorecard «Efectivo acumulado» + «Por cobrar» (no «Cobrado del viaje»).
 *
 * Gap F5: collected+CTA off · void Anulado · emitir_cfdi sin card · RO sin trips.update.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
import { TripDetailCostsTab } from "@features/trips/presentation/components/trip-costs/TripDetailCostsTab";
import type { TripDetailCostsTabProps } from "@features/trips/presentation/components/trip-costs/TripDetailCostsTab";

const cashCopy = cfdiEmissionIntentCopy.cash;

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

function renderCostsTab(
  overrides: Partial<TripDetailCostsTabProps> & {
    operationalCash: OperationalCashSummary;
  },
) {
  const { operationalCash, ...rest } = overrides;
  return render(
    <TestProviders>
      <TripDetailCostsTab
        tripId={TRIP_ID}
        tripStatus={TripStatus.COMPLETED}
        baseRate={operationalCash.baseRate}
        cfdiDocumentIntent="ingreso"
        cfdiEmissionIntent="sin_cfdi_efectivo"
        operationalCashCollectedAt={
          operationalCash.collectedTotal > 0
            ? new Date("2026-10-04T12:00:00.000Z")
            : null
        }
        operationalCashAmount={
          operationalCash.collectedTotal > 0
            ? operationalCash.collectedTotal
            : null
        }
        operationalCash={operationalCash}
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
        {...rest}
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

  it("en Costos muestra Pendiente y registra abono (POST ledger)", async () => {
    const user = userEvent.setup();
    renderCostsTab({
      baseRate: 8500,
      operationalCash: {
        status: "pending",
        collectedTotal: 0,
        pendingAmount: 8500,
        baseRate: 8500,
        receiptCount: 0,
      },
    });

    expect(screen.getByText(cashCopy.statusPending)).toBeInTheDocument();
    expect(
      screen.queryByText(tripDetailCopy.costs.financialSummary.label.cobradoViaje!),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(cashCopy.scorecardAccumulatedLabel).length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByText(cashCopy.scorecardPendingLabel).length,
    ).toBeGreaterThanOrEqual(2);

    await user.click(
      screen.getByRole("button", { name: cashCopy.ctaRegister }),
    );

    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).getByRole("heading", { name: cashCopy.sheet.title }),
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

  it("parcial: badge Cobro parcial y CTA Registrar abono visible", async () => {
    mockListOperationalCashReceipts.mockResolvedValue([makeReceipt()]);

    renderCostsTab({
      operationalCash: {
        status: "partial",
        collectedTotal: 10000,
        pendingAmount: 14500,
        baseRate: BASE_RATE,
        receiptCount: 1,
      },
    });

    expect(
      await screen.findByText(cashCopy.statusPartial),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: cashCopy.ctaRegister }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(cashCopy.scorecardPendingLabel).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("collected: badge Cobrado y CTA registrar off con razón observable", async () => {
    mockListOperationalCashReceipts.mockResolvedValue([
      makeReceipt({ id: "r1", amount: 10000 }),
      makeReceipt({
        id: "r2",
        amount: 14500,
        collectedAt: new Date("2026-10-04T14:00:00.000Z"),
        createdAt: new Date("2026-10-04T14:00:00.000Z"),
      }),
    ]);

    renderCostsTab({
      operationalCash: {
        status: "collected",
        collectedTotal: BASE_RATE,
        pendingAmount: 0,
        baseRate: BASE_RATE,
        receiptCount: 2,
      },
    });

    expect(
      await screen.findByText(cashCopy.statusCollected),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: cashCopy.ctaRegister }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(cashCopy.ctaDisabledCollected)).toBeInTheDocument();
  });

  it("void: sheet anula abono con motivo (POST void)", async () => {
    const user = userEvent.setup();
    const active = makeReceipt();
    mockListOperationalCashReceipts.mockResolvedValue([active]);

    renderCostsTab({
      operationalCash: {
        status: "partial",
        collectedTotal: 10000,
        pendingAmount: 14500,
        baseRate: BASE_RATE,
        receiptCount: 1,
      },
    });

    expect(await screen.findByText(cashCopy.statusPartial)).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", { name: cashCopy.voidCta }),
    );

    const voidSheet = screen.getByRole("dialog");
    expect(
      within(voidSheet).getByRole("heading", {
        name: cashCopy.voidSheet.title,
      }),
    ).toBeInTheDocument();

    await user.type(
      within(voidSheet).getByPlaceholderText(
        cashCopy.voidSheet.reasonPlaceholder,
      ),
      "Error de captura",
    );

    const voidSubmit = voidSheet.querySelector<HTMLButtonElement>(
      'button[type="submit"][form="void-operational-cash-form"]',
    );
    expect(voidSubmit).not.toBeNull();
    await user.click(voidSubmit!);

    expect(mockVoidOperationalCashReceipt).toHaveBeenCalledWith(
      TRIP_ID,
      active.id,
      { reason: "Error de captura" },
    );
  });

  it("post-void: historial Anulado, por cobrar vuelve y CTA Registrar visible", async () => {
    mockListOperationalCashReceipts.mockResolvedValue([
      makeReceipt({
        voidedAt: new Date("2026-10-04T13:00:00.000Z"),
        voidedBy: "u1",
        voidReason: "Error de captura",
      }),
    ]);

    renderCostsTab({
      operationalCashCollectedAt: null,
      operationalCashAmount: null,
      operationalCash: {
        status: "pending",
        collectedTotal: 0,
        pendingAmount: BASE_RATE,
        baseRate: BASE_RATE,
        receiptCount: 0,
      },
    });

    expect(await screen.findByText(cashCopy.receiptVoided)).toBeInTheDocument();
    expect(screen.getByText(cashCopy.statusPending)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: cashCopy.ctaRegister }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(cashCopy.ctaDisabledCollected),
    ).not.toBeInTheDocument();
    // Sin abonos activos no hay CTA Anular en filas voided.
    expect(
      screen.queryByRole("button", { name: cashCopy.voidCta }),
    ).not.toBeInTheDocument();
  });

  it("emitir_cfdi: no muestra card Cobro en efectivo", () => {
    renderCostsTab({
      cfdiEmissionIntent: "emitir_cfdi",
      operationalCash: {
        status: "pending",
        collectedTotal: 0,
        pendingAmount: BASE_RATE,
        baseRate: BASE_RATE,
        receiptCount: 0,
      },
    });

    expect(screen.queryByText(cashCopy.sectionTitle)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: cashCopy.ctaRegister }),
    ).not.toBeInTheDocument();
    expect(mockListOperationalCashReceipts).not.toHaveBeenCalled();
  });

  it("sin trips.update: sin CTAs Registrar ni Anular (solo lectura)", async () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        !(module === "trips" && action === "update"),
    );
    mockListOperationalCashReceipts.mockResolvedValue([makeReceipt()]);

    renderCostsTab({
      operationalCash: {
        status: "partial",
        collectedTotal: 10000,
        pendingAmount: 14500,
        baseRate: BASE_RATE,
        receiptCount: 1,
      },
    });

    expect(
      await screen.findByText(cashCopy.statusPartial),
    ).toBeInTheDocument();
    expect(screen.getByText(cashCopy.sectionTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: cashCopy.ctaRegister }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: cashCopy.voidCta }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(cashCopy.ctaDisabledCollected),
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
