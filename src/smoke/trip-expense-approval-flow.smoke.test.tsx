/**
 * Smoke ADR-0099 F7 AX-10 — la pestaña Costos usa la misma función de decisión
 * que la bandeja (`resolveApprovalActionUi`): no elegible = «Espera a …» sin
 * Aprobar; devuelto = alerta + «Corregir y reenviar» → «Guardar y reenviar»;
 * viaje cerrado: lo devuelto se corrige y lo demás muestra la ventana cerrada.
 * Mock de API; no requiere backend.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { formatDate } from "@shared/utils/dateUtils";
import { TripStatus, type TripExpense } from "@features/trips/domain";
import type { ApprovalBlock, SelfApprovalPolicy } from "@features/approvals/domain";
import { approvalsCopy } from "@features/approvals/presentation/copy/approvalsCopy";
import { tripDetailCopy } from "@features/trips/presentation/copy";
import {
  TripDetailCostsTab,
  type TripDetailCostsTabProps,
} from "@features/trips/presentation/components/trip-costs/TripDetailCostsTab";

const costsCopy = tripDetailCopy.costs;
const flowCopy = approvalsCopy.flow;

const { mockAuthUser, mockGetSelfApprovalPolicy, mockUpdateExpense, mockToast } =
  vi.hoisted(() => ({
    mockAuthUser: {
      current: { id: "user-accountant-1", fullName: "Contador Demo", role: "accountant" },
    },
    mockGetSelfApprovalPolicy: vi.fn(),
    mockUpdateExpense: vi.fn(),
    mockToast: vi.fn(),
  }));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: mockAuthUser.current.role,
  }),
  useRole: () => mockAuthUser.current.role,
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({ user: mockAuthUser.current, isAuthenticated: true }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock("@features/approvals/infrastructure/approvalsApi", () => ({
  approvalsApi: {
    getSelfApprovalPolicy: () => mockGetSelfApprovalPolicy(),
    history: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@features/approvals", async () => {
  const testing = await import("@features/approvals/testing/selfApprovalTestModule");
  const hooks = await import(
    "@features/approvals/application/hooks/useSelfApprovalPolicy"
  );
  return {
    ...testing,
    useSelfActionResolver: hooks.useSelfActionResolver,
    invalidateApprovalsRelatedQueries: vi.fn(),
    buildApprovalsInboxPath: () => "/finance/approvals",
  };
});

vi.mock("@features/trips/application/hooks/expense/useExpenseOperations", () => {
  const idle = () => ({ mutateAsync: vi.fn(), isPending: false });
  return {
    useAddExpense: idle,
    useDeleteExpense: idle,
    useApproveExpense: idle,
    useRejectExpense: idle,
    useReturnExpense: idle,
    useUpdateExpense: () => ({
      mutateAsync: (...args: unknown[]) => mockUpdateExpense(...args),
      isPending: false,
    }),
  };
});

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: { patchBaseRate: vi.fn(), patchOperationalCash: vi.fn() },
}));

vi.mock("@features/vehicles/application", () => ({
  useVehicle: () => ({ data: undefined, isLoading: false }),
}));

const TRIP_ID = "trip-approval-flow-1";
const DAY_MS = 24 * 60 * 60 * 1000;

const POLICY: SelfApprovalPolicy = {
  advanceApprove: { allowed: false, activeCounterpartCount: 2 },
  advanceDisburse: { allowed: false, activeCounterpartCount: 2 },
  settlementApprove: { allowed: false, activeCounterpartCount: 2 },
  settlementDisburse: { allowed: false, activeCounterpartCount: 2 },
  tripExpenseApprove: { allowed: false, activeCounterpartCount: 2 },
};

function makeApproval(overrides: Partial<ApprovalBlock> = {}): ApprovalBlock {
  return {
    flowStatus: "in_progress",
    stepCurrent: 1,
    stepsTotal: 2,
    pendingFor: { roles: ["manager"], users: [] },
    signedSteps: [],
    routedBy: {
      tierIndex: 1,
      minAmount: 5000,
      matchedConditions: [],
      policyVersion: 3,
      lazy: false,
    },
    canAct: true,
    cannotActReason: null,
    escalated: false,
    reapproval: null,
    returned: null,
    ...overrides,
  };
}

const RETURNED_APPROVAL = makeApproval({
  flowStatus: "returned",
  stepCurrent: null,
  pendingFor: { roles: [], users: [] },
  canAct: false,
  cannotActReason: "returned",
  returned: {
    reason: "Sube el ticket de la gasolinera",
    reasonCode: "missing_receipt",
    returnedBy: "user-ana",
    returnedByName: "Ana López",
    returnedAt: "2026-10-01T15:00:00.000Z",
  },
});

function makeExpense(overrides: Partial<TripExpense> = {}): TripExpense {
  const at = new Date("2026-09-20T15:00:00.000Z");
  return {
    id: "expense-1",
    tenantId: "tenant-1",
    tripId: TRIP_ID,
    category: "fuel",
    subcategory: null,
    satProductCode: null,
    satProductDescription: null,
    description: "Diesel Querétaro",
    quantity: null,
    unitPrice: null,
    amount: 6400,
    currency: "MXN",
    exchangeRate: null,
    paymentMethod: null,
    expenseDate: at,
    location: null,
    latitude: null,
    longitude: null,
    hasReceipt: false,
    receiptUrl: null,
    receiptNumber: null,
    cfdiUuid: null,
    cfdiFolio: null,
    vendorName: null,
    vendorRfc: null,
    paymentSource: "driver",
    status: "pending",
    isEstimated: false,
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    selfSegregatedApproval: false,
    approverCountAtApprove: null,
    notes: null,
    createdAt: at,
    updatedAt: at,
    createdBy: "user-driver-9",
    updatedBy: null,
    ...overrides,
  };
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
  expenses: TripExpense[],
  overrides: Partial<TripDetailCostsTabProps> = {},
) {
  return render(
    <TestProviders>
      <TripDetailCostsTab
        tripId={TRIP_ID}
        tripCode="V-FLOW-001"
        tripStatus={TripStatus.IN_PROGRESS}
        baseRate={12000}
        cfdiDocumentIntent="ingreso"
        stops={[]}
        expenses={expenses}
        isLoading={false}
        isError={false}
        onRetry={() => undefined}
        canEditBaseRate={false}
        canCreateExpenses={false}
        canUpdatePendingExpenses={false}
        canDeletePendingExpenses={false}
        canApproveExpenses={false}
        pendingExpenseCount={expenses.filter((e) => e.status === "pending").length}
        {...overrides}
      />
    </TestProviders>,
  );
}

function rowFor(description: string): HTMLElement {
  const row = screen.getByText(description).closest("div.py-3");
  if (!(row instanceof HTMLElement)) throw new Error(`Fila no encontrada: ${description}`);
  return row;
}

describe("smoke ADR-0099 AX-10 Costos con la misma función que la bandeja", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSelfApprovalPolicy.mockResolvedValue(POLICY);
    mockUpdateExpense.mockResolvedValue(undefined);
  });

  it("contador no elegible: «Espera a Gerente» sin Aprobar; el gasto elegible sí ofrece Aprobar", async () => {
    mockAuthUser.current = {
      id: "user-accountant-1",
      fullName: "Contador Demo",
      role: "accountant",
    };
    renderCostsTab(
      [
        makeExpense({
          id: "e-waiting",
          description: "Gasto de gerente",
          approval: makeApproval({ canAct: false, cannotActReason: "not_eligible" }),
        }),
        makeExpense({
          id: "e-mine",
          description: "Gasto que me toca",
          approval: makeApproval({ pendingFor: { roles: ["accountant"], users: [] } }),
        }),
      ],
      { canApproveExpenses: true },
    );

    await waitFor(() => expect(mockGetSelfApprovalPolicy).toHaveBeenCalled());
    const waiting = within(rowFor("Gasto de gerente"));
    expect(await waiting.findByText(flowCopy.waitingChip("Gerente"))).toBeInTheDocument();
    expect(waiting.queryByRole("button", { name: costsCopy.action.approve })).not.toBeInTheDocument();

    const mine = within(rowFor("Gasto que me toca"));
    expect(mine.getByRole("button", { name: costsCopy.action.approve })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: costsCopy.action.approve })).toHaveLength(1);
  });

  it("operador con gasto devuelto: alerta + «Corregir y reenviar» abre el sheet con «Guardar y reenviar»", async () => {
    const user = userEvent.setup();
    mockAuthUser.current = {
      id: "user-driver-9",
      fullName: "Operador Demo",
      role: "operator",
    };
    renderCostsTab(
      [
        makeExpense({
          id: "e-returned",
          description: "Gasto devuelto",
          approval: RETURNED_APPROVAL,
        }),
      ],
      {
        canCreateExpenses: true,
        canUpdatePendingExpenses: true,
        canDeletePendingExpenses: true,
      },
    );

    const row = within(rowFor("Gasto devuelto"));
    expect(row.getByText(flowCopy.returnedAlertTitle)).toBeInTheDocument();
    expect(
      row.getByText(/Falta comprobante: "Sube el ticket de la gasolinera" · Ana López/),
    ).toBeInTheDocument();
    expect(row.queryByRole("button", { name: costsCopy.action.edit })).not.toBeInTheDocument();

    await user.click(row.getByRole("button", { name: flowCopy.correctAndResubmit }));

    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText(flowCopy.returnedAlertTitle)).toBeInTheDocument();
    expect(
      within(sheet).getByRole("button", { name: costsCopy.action.saveAndResubmit }),
    ).toBeInTheDocument();
  });

  it("viaje cerrado: el devuelto se corrige y el no devuelto muestra la ventana cerrada", async () => {
    mockAuthUser.current = {
      id: "user-driver-9",
      fullName: "Operador Demo",
      role: "operator",
    };
    const now = Date.now();
    const closesAt = new Date(now - 10 * DAY_MS);
    renderCostsTab(
      [
        makeExpense({
          id: "e-returned",
          description: "Gasto devuelto",
          approval: RETURNED_APPROVAL,
        }),
        makeExpense({ id: "e-pending", description: "Gasto pendiente" }),
      ],
      {
        tripStatus: TripStatus.COMPLETED,
        tripClosedAt: new Date(now - 40 * DAY_MS),
        expenseWindowClosed: true,
        expenseWindowClosesAt: closesAt,
        canUpdateReturnedExpenses: true,
        canDeleteReturnedExpenses: true,
      },
    );

    const returned = within(rowFor("Gasto devuelto"));
    expect(
      returned.getByRole("button", { name: flowCopy.correctAndResubmit }),
    ).toBeInTheDocument();
    expect(
      returned.queryByText(costsCopy.state.windowClosedRow(formatDate(closesAt.toISOString()))),
    ).not.toBeInTheDocument();

    const pending = within(rowFor("Gasto pendiente"));
    expect(
      pending.getByText(costsCopy.state.windowClosedRow(formatDate(closesAt.toISOString()))),
    ).toBeInTheDocument();
    expect(pending.queryByRole("button", { name: costsCopy.action.edit })).not.toBeInTheDocument();
    expect(
      pending.queryByRole("button", { name: flowCopy.correctAndResubmit }),
    ).not.toBeInTheDocument();
  });
});
