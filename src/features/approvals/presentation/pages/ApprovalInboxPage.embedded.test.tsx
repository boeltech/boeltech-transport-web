/**
 * La bandeja vive embebida en `/finance/approvals` (FinanceApprovalsPage):
 * no repite el encabezado del shell y sus acciones no pierden la ruta.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ApprovableItem, SelfApprovalPolicy } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import { ApprovalInboxPage } from "./ApprovalInboxPage";

const mockList = vi.fn();
const mockGetSelfApprovalPolicy = vi.fn();

vi.mock("@features/approvals/infrastructure/approvalsApi", () => ({
  approvalsApi: {
    list: (...args: unknown[]) => mockList(...args),
    getSelfApprovalPolicy: () => mockGetSelfApprovalPolicy(),
    approve: vi.fn(),
    reject: vi.fn(),
    bulk: vi.fn(),
    getPendingCount: vi.fn().mockResolvedValue(0),
    getAllPendingCounts: vi.fn().mockResolvedValue({
      trip_expense: 0,
      driver_advance_request: 0,
      internal_staff_compensation: 0,
      total: 0,
    }),
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "manager",
  }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-approver-1", fullName: "Gerente Demo", role: "manager" },
    isAuthenticated: true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});

vi.mock("@shared/ui/employee-async-combobox", () => ({
  EmployeeAsyncCombobox: ({
    id,
    placeholder,
    onChange,
  }: {
    id: string;
    placeholder?: string;
    onChange: (employeeId: string) => void;
  }) => (
    <button type="button" id={id} onClick={() => onChange("emp-7")}>
      {placeholder}
    </button>
  ),
}));

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{`${pathname}${search}`}</div>;
}

function renderEmbedded(
  initialEntry: string,
  props: Omit<ComponentProps<typeof ApprovalInboxPage>, "embedded"> & { embedded?: boolean } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ApprovalInboxPage embedded {...props} />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function makePolicy(tripExpenseAllowed: boolean): SelfApprovalPolicy {
  const blocked = { allowed: false, activeCounterpartCount: 1 };
  return {
    advanceApprove: blocked,
    advanceDisburse: blocked,
    settlementApprove: blocked,
    settlementDisburse: blocked,
    tripExpenseApprove: tripExpenseAllowed
      ? { allowed: true, activeCounterpartCount: 0 }
      : blocked,
  };
}

function makeExpenseItem(id: string, tripCode: string, submittedBy: string): ApprovableItem {
  return {
    approvableType: "trip_expense",
    id,
    amount: 500,
    currency: "MXN",
    category: "fuel",
    status: "pending",
    submittedAt: "2026-06-01T10:00:00.000Z",
    submittedBy,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    selfApproved: false,
    context: {
      approvableType: "trip_expense",
      tripId: `trip-${id}`,
      tripCode,
      driverId: "driver-1",
      driverFullName: "Juan Pérez",
      vehicleId: "vehicle-1",
      vehicleUnitNumber: "T-101",
      expenseCategory: "fuel",
      description: "Diesel",
      occurredAt: "2026-06-01T09:00:00.000Z",
    },
  };
}

const ownItem = makeExpenseItem("exp-own", "V-OWN", "user-approver-1");
const otherItem = makeExpenseItem("exp-other", "V-OTHER", "user-driver-9");

describe("ApprovalInboxPage embebida en Finanzas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
    });
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy(false));
  });

  it("no repite el encabezado del hub y conserva la descripción", async () => {
    renderEmbedded("/finance/approvals?type=trip_expense&status=pending");

    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("heading", { name: approvalsCopy.inbox.title }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(approvalsCopy.inbox.description),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(approvalsCopy.inbox.searchPlaceholder),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText(/Estado: Pendiente/)).not.toBeInTheDocument();
  });

  it("mantiene la ruta y el tipo al limpiar filtros", async () => {
    const user = userEvent.setup();
    renderEmbedded(
      "/finance/approvals?type=internal_staff_compensation&status=approved",
    );

    await user.click(
      await screen.findByRole("button", { name: /limpiar filtros/i }),
    );

    await waitFor(() => {
      const location = screen.getByTestId("location").textContent ?? "";
      expect(location).toContain("/finance/approvals");
      expect(location).toContain("type=internal_staff_compensation");
      expect(location).toContain("status=pending");
      expect(location).not.toContain("status=approved");
      expect(location).not.toContain("tab=");
    });
  });

  it("hub «Por autorizar»: filtro por operador y vacío con copy del anfitrión", async () => {
    const user = userEvent.setup();
    const hostEmpty = {
      title: "No hay nada por autorizar",
      description: "Eres el único autorizador activo.",
    };
    renderEmbedded("/finance/settlements?type=driver_advance_request&status=pending", {
      operatorFilter: { placeholder: "Todos los operadores" },
      emptyState: hostEmpty,
    });

    expect(await screen.findByText(hostEmpty.title)).toBeInTheDocument();
    expect(screen.getByText(hostEmpty.description)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Todos los operadores" }));

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith(
        expect.objectContaining({ driverId: "emp-7" }),
      );
    });
    expect(screen.getByTestId("location").textContent ?? "").toContain("driverId=emp-7");
  });

  it("sin embedded ignora el filtro de operador y el vacío del anfitrión", async () => {
    renderEmbedded("/approvals?type=driver_advance_request&status=pending", {
      embedded: false,
      operatorFilter: { placeholder: "Todos los operadores" },
      emptyState: { title: "Vacío del hub", description: "—" },
    });

    await waitFor(() => expect(mockList).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "Todos los operadores" })).not.toBeInTheDocument();
    expect(screen.queryByText("Vacío del hub")).not.toBeInTheDocument();
  });
});

describe("ApprovalInboxPage autoaprobación (ADR-0098)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue({
      data: [ownItem, otherItem],
      pagination: { page: 1, limit: 25, total: 2, totalPages: 1 },
    });
  });

  it("blocked_own: la fila propia muestra «Enviada por ti» y no es seleccionable", async () => {
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy(false));
    renderEmbedded("/finance/approvals?type=trip_expense&status=pending");

    expect(await screen.findByText("Enviada por ti")).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Seleccionar V-OWN" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Seleccionar V-OTHER" }),
    ).toBeInTheDocument();
    // Solo la fila ajena conserva Aprobar.
    expect(screen.getAllByRole("button", { name: "Aprobar" })).toHaveLength(1);
  });

  it("self_confirm: aprobar lo propio pide la confirmación de autoaprobación", async () => {
    const user = userEvent.setup();
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy(true));
    renderEmbedded("/finance/approvals?type=trip_expense&status=pending");

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Seleccionar V-OWN" })).toBeInTheDocument();
    });
    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();

    const approveButtons = screen.getAllByRole("button", { name: "Aprobar" });
    expect(approveButtons).toHaveLength(2);
    await user.click(approveButtons[0]);

    expect(
      await screen.findByText(approvalsCopy.selfApproval.confirmTitle),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tú enviaste este gasto/i)).toBeInTheDocument();
  });

  it("filtro «Autoaprobadas» envía self_approved y muestra el chip activo", async () => {
    renderEmbedded("/finance/approvals?type=trip_expense&status=all&selfApproved=true");

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith(
        expect.objectContaining({ selfApproved: true }),
      );
    });
    expect(
      screen.getAllByText(approvalsCopy.selfApproval.filterChip).length,
    ).toBeGreaterThan(0);
  });

  it("P2-2: activar «Autoaprobadas» fija el estado en aprobado y el chip se quita", async () => {
    const user = userEvent.setup();
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy(false));
    renderEmbedded("/finance/approvals?type=trip_expense&status=pending");

    await user.click(await screen.findByRole("button", { name: /Filtros/ }));
    await user.click(
      screen.getByRole("checkbox", { name: approvalsCopy.selfApproval.filterChip }),
    );

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith(
        expect.objectContaining({ selfApproved: true, status: "approved" }),
      );
    });
    const location = screen.getByTestId("location").textContent ?? "";
    expect(location).toContain("status=approved");
    expect(location).toContain("selfApproved=true");

    await user.click(
      screen.getByRole("button", {
        name: `Quitar filtro ${approvalsCopy.selfApproval.filterChip}`,
      }),
    );
    await waitFor(() => {
      expect(screen.getByTestId("location").textContent ?? "").not.toContain(
        "selfApproved=true",
      );
    });
  });
});
