import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdvanceActions } from "./AdvanceActions";
import type { DriverAdvance } from "../../domain/entities";

const mockUsePermissions = vi.fn();
const mockUseAuth = vi.fn();
const mockToast = vi.fn();
const mockSubmitAdvance = vi.fn();
const mockApproveAdvance = vi.fn();
const mockRejectAdvance = vi.fn();
const mockDisburseAdvance = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    submitAdvance: (...args: unknown[]) => mockSubmitAdvance(...args),
    approveAdvance: (...args: unknown[]) => mockApproveAdvance(...args),
    rejectAdvance: (...args: unknown[]) => mockRejectAdvance(...args),
    disburseAdvance: (...args: unknown[]) => mockDisburseAdvance(...args),
  },
}));

vi.mock("@features/approvals", () => ({
  invalidateApprovalsRelatedQueries: vi.fn(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

const sampleAdvance: DriverAdvance = {
  id: "adv-1",
  tenantId: "tenant-1",
  folio: "ANT-202608-0001",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  tripId: "trip-1",
  tripCode: "TRP-101",
  amount: 1500,
  balanceRemaining: 1500,
  currency: "MXN",
  category: "travel_advance",
  status: "pending_approval",
  disbursedAt: null,
  paymentMethod: "bank_transfer",
  bankReference: null,
  submittedAt: "2026-08-15T10:00:00Z",
  submittedBy: "user-creator-123",
  notes: "Anticipo casetas",
  createdAt: "2026-08-15T10:00:00Z",
  updatedAt: "2026-08-15T10:00:00Z",
};

describe("AdvanceActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((resource: string, action: string) => {
        if (resource === "settlements" && (action === "update" || action === "execute")) return true;
        return false;
      }),
    });
    mockUseAuth.mockReturnValue({
      user: { id: "user-approver-999", name: "Auditor Finanzas", email: "auditor@boeltech.com" },
    });
  });

  it("1. Renderiza opciones de autorizar y rechazar cuando el usuario revisor es distinto del solicitante", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    expect(screen.getByText("Autorizar anticipo")).toBeInTheDocument();
    expect(screen.getByText("Rechazar anticipo")).toBeInTheDocument();
    expect(screen.queryByText("Auto-aprobación no permitida")).not.toBeInTheDocument();
  });

  it("2. Bloquea y muestra aviso Maker-Checker si el usuario logueado es el solicitante del anticipo", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador Anticipo" },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    expect(screen.getByText("Auto-aprobación no permitida")).toBeInTheDocument();
    expect(screen.queryByText("Autorizar anticipo")).not.toBeInTheDocument();
    expect(screen.queryByText("Rechazar anticipo")).not.toBeInTheDocument();
  });

  it("3. Ejecuta la aprobación al hacer click en Autorizar anticipo", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockApproveAdvance.mockResolvedValueOnce({ ...sampleAdvance, status: "pending_disbursement" });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    const approveItem = screen.getByText("Autorizar anticipo");
    await user.click(approveItem);

    await waitFor(() => {
      expect(mockApproveAdvance).toHaveBeenCalledWith("adv-1");
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Anticipo autorizado correctamente", variant: "success" }),
      );
    });
  });

  it("4. Abre diálogo de rechazo y envía motivo al confirmar", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockRejectAdvance.mockResolvedValueOnce({ ...sampleAdvance, status: "rejected" });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    const rejectItem = screen.getByText("Rechazar anticipo");
    await user.click(rejectItem);

    expect(screen.getByRole("heading", { name: /rechazar anticipo/i })).toBeInTheDocument();

    const textarea = screen.getByLabelText(/motivo de rechazo/i);
    await user.type(textarea, "Monto excede el límite permitido para esta ruta");

    const confirmBtn = screen.getByRole("button", { name: /confirmar rechazo/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockRejectAdvance).toHaveBeenCalledWith(
        "adv-1",
        "Monto excede el límite permitido para esta ruta",
      );
    });
  });

  it("5. Muestra opción de registrar entrega/pago para anticipos en pending_disbursement", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const readyAdvance: DriverAdvance = {
      ...sampleAdvance,
      status: "pending_disbursement",
    };

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={readyAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    expect(screen.getByText("Registrar entrega / pago")).toBeInTheDocument();
  });
});
