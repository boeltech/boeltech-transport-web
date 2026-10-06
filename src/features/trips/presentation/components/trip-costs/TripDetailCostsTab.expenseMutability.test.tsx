/**
 * P0 gasto decidido: «Editar»/«Eliminar» por gasto con la regla del paquete
 * y copy claro ante 409 `EXPENSE_NOT_MUTABLE` (otro usuario decidió el gasto).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { ApprovalBlock } from "@features/approvals";
import { TripStatus, type TripExpense } from "@features/trips/domain";
import { tripDetailCopy } from "../../copy";
import { TripDetailCostsTab, type TripDetailCostsTabProps } from "./TripDetailCostsTab";

const costsCopy = tripDetailCopy.costs;

const { mockToast, mockUpdateExpense, mockDeleteExpense } = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockUpdateExpense: vi.fn(),
  mockDeleteExpense: vi.fn(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
  useRole: () => "admin",
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-admin-1", fullName: "Admin", role: "admin" },
    isAuthenticated: true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
  useSelfActionResolver: () => () => "normal",
  invalidateApprovalsRelatedQueries: vi.fn(),
  buildApprovalsInboxPath: () => "/finance/approvals",
}));

vi.mock("@features/approvals/application", () => ({
  invalidateApprovalsRelatedQueries: vi.fn(),
}));

vi.mock("@features/trips/application/hooks/expense/useExpenseOperations", () => {
  const idle = () => ({ mutateAsync: vi.fn(), isPending: false });
  return {
    useAddExpense: idle,
    useApproveExpense: idle,
    useRejectExpense: idle,
    useReturnExpense: idle,
    useUpdateExpense: () => ({
      mutateAsync: (...args: unknown[]) => mockUpdateExpense(...args),
      isPending: false,
    }),
    useDeleteExpense: () => ({
      mutateAsync: (...args: unknown[]) => mockDeleteExpense(...args),
      isPending: false,
    }),
  };
});

vi.mock("../trip-financial", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../trip-financial")>();
  return {
    ...actual,
    TripExpenseSheet: ({
      open,
      initialValues,
      onSubmit,
      notice,
      submitLabel,
    }: {
      open: boolean;
      initialValues: Parameters<typeof actual.TripExpenseSheet>[0]["initialValues"];
      onSubmit: Parameters<typeof actual.TripExpenseSheet>[0]["onSubmit"];
      notice?: ReactNode;
      submitLabel?: string;
    }) =>
      open && initialValues ? (
        <div data-testid="expense-sheet">
          {notice}
          <button type="button" onClick={() => void onSubmit(initialValues, 0)}>
            {submitLabel ?? "Guardar gasto"}
          </button>
        </div>
      ) : null,
  };
});

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: { patchBaseRate: vi.fn(), patchOperationalCash: vi.fn() },
}));

vi.mock("@features/vehicles/application", () => ({
  useVehicle: () => ({ data: undefined, isLoading: false }),
}));

const TRIP_ID = "trip-mutability-1";

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
    paymentSource: "driver",
    status: "pending",
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
        tripCode="V-MUT-001"
        tripStatus={TripStatus.IN_PROGRESS}
        baseRate={12000}
        cfdiDocumentIntent="ingreso"
        stops={[]}
        expenses={expenses}
        isLoading={false}
        isError={false}
        onRetry={() => undefined}
        canEditBaseRate={false}
        canCreateExpenses
        canUpdatePendingExpenses
        canDeletePendingExpenses
        canApproveExpenses={false}
        {...overrides}
      />
    </TestProviders>,
  );
}

function rowFor(description: string): HTMLElement {
  const row = screen.getByText(description).closest("div.flex.items-start");
  if (!(row instanceof HTMLElement)) throw new Error(`Fila no encontrada: ${description}`);
  return row;
}

function notMutableError(message: string) {
  return Object.assign(new Error(message), { code: "EXPENSE_NOT_MUTABLE" });
}

describe("TripDetailCostsTab — mutabilidad por gasto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("viaje en curso: decididos sin Editar/Eliminar; pending/documented con acciones", () => {
    renderCostsTab([
      makeExpense({ id: "e-pending", description: "Gasto pendiente", status: "pending" }),
      makeExpense({ id: "e-doc", description: "Gasto documentado", status: "documented" }),
      makeExpense({ id: "e-approved", description: "Gasto autorizado", status: "approved" }),
      makeExpense({ id: "e-rejected", description: "Gasto rechazado", status: "rejected" }),
    ]);

    for (const description of ["Gasto pendiente", "Gasto documentado"]) {
      const row = within(rowFor(description));
      expect(row.getByRole("button", { name: costsCopy.action.edit })).toBeInTheDocument();
      expect(row.getByRole("button", { name: costsCopy.action.remove })).toBeInTheDocument();
    }
    for (const description of ["Gasto autorizado", "Gasto rechazado"]) {
      const row = within(rowFor(description));
      expect(row.queryByRole("button", { name: costsCopy.action.edit })).not.toBeInTheDocument();
      expect(row.queryByRole("button", { name: costsCopy.action.remove })).not.toBeInTheDocument();
    }
  });

  it("sin permiso de eliminar (RBAC): pending conserva Editar pero no Eliminar", () => {
    renderCostsTab(
      [makeExpense({ description: "Gasto pendiente", status: "pending" })],
      { canDeletePendingExpenses: false },
    );

    const row = within(rowFor("Gasto pendiente"));
    expect(row.getByRole("button", { name: costsCopy.action.edit })).toBeInTheDocument();
    expect(row.queryByRole("button", { name: costsCopy.action.remove })).not.toBeInTheDocument();
  });

  it("completed en ventana: solo pending con acciones", () => {
    const now = Date.now();
    renderCostsTab(
      [
        makeExpense({ id: "e-pending", description: "Gasto pendiente", status: "pending" }),
        makeExpense({ id: "e-doc", description: "Gasto documentado", status: "documented" }),
        makeExpense({ id: "e-approved", description: "Gasto autorizado", status: "approved" }),
      ],
      {
        tripStatus: TripStatus.COMPLETED,
        tripClosedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
        expenseWindowOpen: true,
      },
    );

    expect(
      within(rowFor("Gasto pendiente")).getByRole("button", { name: costsCopy.action.edit }),
    ).toBeInTheDocument();
    for (const description of ["Gasto documentado", "Gasto autorizado"]) {
      const row = within(rowFor(description));
      expect(row.queryByRole("button", { name: costsCopy.action.edit })).not.toBeInTheDocument();
      expect(row.queryByRole("button", { name: costsCopy.action.remove })).not.toBeInTheDocument();
    }
  });

  it("409 al eliminar: toast con copy de gasto ya decidido", async () => {
    const user = userEvent.setup();
    mockDeleteExpense.mockRejectedValue(
      notMutableError("El gasto ya fue autorizado y no se puede eliminar"),
    );
    renderCostsTab([makeExpense({ description: "Gasto pendiente" })]);

    await user.click(
      within(rowFor("Gasto pendiente")).getByRole("button", { name: costsCopy.action.remove }),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: costsCopy.toast.removeError,
        description: costsCopy.toast.expenseNotMutableRemove,
        variant: "error",
      });
    });
    expect(mockDeleteExpense).toHaveBeenCalledWith("expense-1");
  });

  it("409 al editar: toast con copy de gasto ya decidido y cierra el sheet", async () => {
    const user = userEvent.setup();
    mockUpdateExpense.mockRejectedValue(
      notMutableError("El gasto ya fue rechazado y no se puede editar"),
    );
    renderCostsTab([makeExpense({ description: "Gasto pendiente" })]);

    await user.click(
      within(rowFor("Gasto pendiente")).getByRole("button", { name: costsCopy.action.edit }),
    );
    await user.click(
      within(screen.getByTestId("expense-sheet")).getByRole("button", {
        name: "Guardar gasto",
      }),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: costsCopy.toast.saveError,
        description: costsCopy.toast.expenseNotMutableEdit,
        variant: "error",
      });
    });
    expect(screen.queryByTestId("expense-sheet")).not.toBeInTheDocument();
  });

  it("otro error al editar: conserva el sheet abierto y el mensaje del API", async () => {
    const user = userEvent.setup();
    mockUpdateExpense.mockRejectedValue(
      Object.assign(new Error("Monto inválido"), { code: "VALIDATION_ERROR" }),
    );
    renderCostsTab([makeExpense({ description: "Gasto pendiente" })]);

    await user.click(
      within(rowFor("Gasto pendiente")).getByRole("button", { name: costsCopy.action.edit }),
    );
    await user.click(
      within(screen.getByTestId("expense-sheet")).getByRole("button", {
        name: "Guardar gasto",
      }),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: costsCopy.toast.saveError,
        description: "Monto inválido",
        variant: "error",
      });
    });
    expect(screen.getByTestId("expense-sheet")).toBeInTheDocument();
  });

  it("ADR-0099 D15 + TEC-5: devuelto fuera de ventana se corrige con «Guardar y reenviar»", async () => {
    const user = userEvent.setup();
    mockUpdateExpense.mockResolvedValue(undefined);
    const now = Date.now();
    const returnedApproval: ApprovalBlock = {
      flowStatus: "returned",
      stepCurrent: null,
      stepsTotal: 2,
      pendingFor: { roles: [], users: [] },
      signedSteps: [],
      routedBy: {
        tierIndex: null,
        minAmount: null,
        matchedConditions: [],
        policyVersion: null,
        lazy: false,
      },
      canAct: false,
      cannotActReason: null,
      escalated: false,
      reapproval: null,
      returned: {
        reason: "Sube el ticket de la gasolinera",
        reasonCode: "missing_receipt",
        returnedBy: "user-ana",
        returnedByName: "Ana",
        returnedAt: "2026-10-02T15:00:00.000Z",
      },
    };
    renderCostsTab(
      [
        makeExpense({
          id: "e-returned",
          description: "Gasto devuelto",
          approval: returnedApproval,
        }),
        makeExpense({ id: "e-pending", description: "Gasto pendiente" }),
      ],
      {
        tripStatus: TripStatus.COMPLETED,
        tripClosedAt: new Date(now - 40 * 24 * 60 * 60 * 1000),
        expenseWindowClosed: true,
        expenseWindowClosesAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
        canCreateExpenses: false,
        canUpdatePendingExpenses: false,
        canDeletePendingExpenses: false,
        canUpdateReturnedExpenses: true,
        canDeleteReturnedExpenses: true,
      },
    );

    expect(screen.getAllByText(/Falta comprobante: "Sube el ticket de la gasolinera"/).length)
      .toBeGreaterThan(0);
    expect(
      within(rowFor("Gasto pendiente")).queryByRole("button", { name: costsCopy.action.edit }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/La ventana para corregir gastos de este viaje cerró el/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Corregir y reenviar" }));
    const sheet = within(screen.getByTestId("expense-sheet"));
    expect(sheet.getByText(/Sube el ticket de la gasolinera/)).toBeInTheDocument();
    await user.click(sheet.getByRole("button", { name: costsCopy.action.saveAndResubmit }));

    await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalledTimes(1));
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: costsCopy.toast.resubmitted }),
    );
  });
});
