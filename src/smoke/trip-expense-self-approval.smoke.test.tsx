/**
 * Smoke ADR-0098 UX6 — paridad pestaña Costos / bandeja en gastos propios.
 * Mock de API; no requiere backend.
 *
 * Misma política (`trip_expense_approve`) que la bandeja: `allowed:false` →
 * chip «Enviada por ti» sin Aprobar; `allowed:true` → diálogo de autoaprobación.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type TripExpense } from "@features/trips/domain";
import type { SelfApprovalPolicy } from "@features/approvals/domain";
import { approvalsCopy } from "@features/approvals/presentation/copy/approvalsCopy";
import { TripDetailCostsTab } from "@features/trips/presentation/components/trip-costs/TripDetailCostsTab";

const {
  mockAuthUser,
  mockGetSelfApprovalPolicy,
  mockApproveExpense,
  mockToast,
} = vi.hoisted(() => ({
  mockAuthUser: {
    current: { id: "user-admin-1", fullName: "Admin Único", role: "admin" },
  },
  mockGetSelfApprovalPolicy: vi.fn(),
  mockApproveExpense: vi.fn(),
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
  },
}));

// Piezas reales de decisión (resolver + diálogo + chip); sin el barrel completo.
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
    useUpdateExpense: idle,
    useDeleteExpense: idle,
    useRejectExpense: idle,
    useReturnExpense: idle,
    useApproveExpense: () => ({
      mutateAsync: (...args: unknown[]) => mockApproveExpense(...args),
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

const TRIP_ID = "trip-self-approval-1";

function makePolicy(tripExpenseAllowed: boolean): SelfApprovalPolicy {
  const blocked = { allowed: false, activeCounterpartCount: 2 };
  return {
    advanceApprove: blocked,
    advanceDisburse: blocked,
    settlementApprove: blocked,
    settlementDisburse: blocked,
    tripExpenseApprove: tripExpenseAllowed
      ? { allowed: true, activeCounterpartCount: 1 }
      : blocked,
  };
}

function makeExpense(overrides: Partial<TripExpense> = {}): TripExpense {
  const at = new Date("2026-09-20T15:00:00.000Z");
  return {
    id: "expense-own-1",
    tenantId: "tenant-1",
    tripId: TRIP_ID,
    category: "fuel",
    subcategory: null,
    satProductCode: null,
    satProductDescription: null,
    description: "Diesel Querétaro",
    quantity: null,
    unitPrice: null,
    amount: 2400,
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
    createdBy: "user-admin-1",
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

function renderCostsTab(expenses: TripExpense[]) {
  return render(
    <TestProviders>
      <TripDetailCostsTab
        tripId={TRIP_ID}
        tripCode="V-SELF-001"
        tripStatus={TripStatus.COMPLETED}
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
        canApproveExpenses
        pendingExpenseCount={expenses.filter((e) => e.status === "pending").length}
      />
    </TestProviders>,
  );
}

describe("smoke ADR-0098 Costos: gasto propio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser.current = {
      id: "user-admin-1",
      fullName: "Admin Único",
      role: "admin",
    };
    mockApproveExpense.mockResolvedValue(
      makeExpense({ status: "approved", selfSegregatedApproval: true }),
    );
  });

  it.each([
    ["admin con otro autorizador activo", "admin"],
    ["gerente único autorizador", "manager"],
  ])(
    "allowed:false (%s): chip «Enviada por ti» y sin Aprobar",
    async (_label, role) => {
      mockAuthUser.current = {
        id: "user-admin-1",
        fullName: "Usuario",
        role,
      };
      mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy(false));
      renderCostsTab([makeExpense()]);

      await waitFor(() => expect(mockGetSelfApprovalPolicy).toHaveBeenCalled());
      expect(
        await screen.findByText(approvalsCopy.selfApproval.ownChip),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
    },
  );

  it("allowed:true (admin único): Aprobar abre el diálogo y confirma la aprobación", async () => {
    const user = userEvent.setup();
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy(true));
    renderCostsTab([makeExpense()]);

    const approveButton = await screen.findByRole("button", { name: "Aprobar" });
    expect(screen.queryByText(approvalsCopy.selfApproval.ownChip)).not.toBeInTheDocument();

    await user.click(approveButton);
    expect(
      await screen.findByText(approvalsCopy.selfApproval.confirmTitle),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tú enviaste este gasto/i)).toBeInTheDocument();
    expect(mockApproveExpense).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: approvalsCopy.selfApproval.confirmAction }),
    );
    await waitFor(() => {
      expect(mockApproveExpense).toHaveBeenCalledWith({
        expenseId: "expense-own-1",
        guards: {},
      });
    });
  });

  it("gasto ajeno: acciones normales sin diálogo de autoaprobación", async () => {
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy(false));
    renderCostsTab([makeExpense({ createdBy: "user-driver-9" })]);

    expect(await screen.findByRole("button", { name: "Aprobar" })).toBeInTheDocument();
    expect(screen.queryByText(approvalsCopy.selfApproval.ownChip)).not.toBeInTheDocument();
  });

  it("badge «Autoaprobado» solo en el gasto aprobado, no en el autorrechazado", async () => {
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy(true));
    renderCostsTab([
      makeExpense({
        id: "expense-approved",
        description: "Casetas aprobadas",
        status: "approved",
        selfSegregatedApproval: true,
      }),
      makeExpense({
        id: "expense-rejected",
        description: "Diesel rechazado",
        status: "rejected",
        selfSegregatedApproval: true,
      }),
    ]);

    expect(
      await screen.findAllByText(approvalsCopy.selfApproval.badge),
    ).toHaveLength(1);
  });
});
