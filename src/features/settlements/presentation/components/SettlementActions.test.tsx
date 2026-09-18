import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettlementActions } from "./SettlementActions";
import type { DriverSettlement } from "../../domain/entities";

const mockUsePermissions = vi.fn();
const mockUseAuth = vi.fn();
const mockToast = vi.fn();
const mockApproveSettlement = vi.fn();
const mockRejectSettlement = vi.fn();
const mockSubmitSettlement = vi.fn();
const mockCancelSettlement = vi.fn();
const mockSettingsQuery = vi.fn(() => ({
  data: { voboThresholdMxn: 0, activeApproverCount: 2, activeExecutorCount: 2 },
  isSuccess: true,
  isLoading: false,
  isError: false,
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../application/hooks/useSettlementSettings", () => ({
  useSettlementSettings: () => mockSettingsQuery(),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    approveSettlement: (...args: unknown[]) => mockApproveSettlement(...args),
    rejectSettlement: (...args: unknown[]) => mockRejectSettlement(...args),
    submitSettlement: (...args: unknown[]) => mockSubmitSettlement(...args),
    cancelSettlement: (...args: unknown[]) => mockCancelSettlement(...args),
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

const sampleSettlement: DriverSettlement = {
  id: "set-1",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-202608-0001",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  agreementSnapshot: { currency: "MXN" },
  periodStart: "2026-08-01",
  periodEnd: "2026-08-15",
  status: "pending_approval",
  totalTripsCommission: 2500,
  totalBaseSalary: 0,
  totalReimbursableExpenses: 0,
  totalBonuses: 0,
  totalAdvancesDeducted: 0,
  totalOtherDeductions: 0,
  grossAmount: 2500,
  netAmount: 2500,
  currency: "MXN",
  submittedBy: "user-creator-123",
  disbursedAt: null,
  disbursedBy: null,
  disbursementMethod: null,
  disbursementReference: null,
  approvedAt: null,
  approvedBy: null,
  rejectionReason: null,
  notes: null,
  createdAt: "2026-08-15T10:00:00Z",
  updatedAt: "2026-08-15T10:00:00Z",
};

const draftSettlement: DriverSettlement = {
  ...sampleSettlement,
  status: "draft",
  submittedBy: null,
};

describe("SettlementActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettingsQuery.mockReturnValue({
      data: { voboThresholdMxn: 0, activeApproverCount: 2, activeExecutorCount: 2 },
      isSuccess: true,
      isLoading: false,
      isError: false,
    });
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((resource: string, action: string) => {
        if (resource === "settlements" && (action === "update" || action === "execute")) {
          return true;
        }
        return false;
      }),
    });
    mockUseAuth.mockReturnValue({
      user: { id: "user-approver-999", name: "Auditor", email: "a@boeltech.com" },
    });
  });

  it("muestra autorizar/rechazar cuando el revisor no es el solicitante", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions settlement={sampleSettlement} onView={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Autorizar")).toBeInTheDocument();
    expect(screen.getByText("Rechazar")).toBeInTheDocument();
    expect(screen.queryByText("Pedir VoBo")).not.toBeInTheDocument();
  });

  it("muestra badge de auto-aprobación cuando el usuario es el solicitante (H2)", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions settlement={sampleSettlement} onView={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Auto-aprobación no permitida")).toBeInTheDocument();
    expect(screen.queryByText("Autorizar")).not.toBeInTheDocument();
  });

  it("D3′: muestra Autorizar al maker cuando activeApproverCount === 1", async () => {
    mockSettingsQuery.mockReturnValue({
      data: { voboThresholdMxn: 0, activeApproverCount: 1, activeExecutorCount: 1 },
      isSuccess: true,
      isLoading: false,
      isError: false,
    });
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions settlement={sampleSettlement} onView={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Autorizar")).toBeInTheDocument();
    expect(screen.getByText("Rechazar")).toBeInTheDocument();
    expect(screen.queryByText("Auto-aprobación no permitida")).not.toBeInTheDocument();
  });

  it("D3′: muestra Registrar pago al maker cuando activeExecutorCount === 1", () => {
    mockSettingsQuery.mockReturnValue({
      data: { voboThresholdMxn: 0, activeApproverCount: 1, activeExecutorCount: 1 },
      isSuccess: true,
      isLoading: false,
      isError: false,
    });
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...sampleSettlement,
              status: "approved",
              createdBy: "user-creator-123",
              submittedBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /Registrar pago/i })).toBeInTheDocument();
    expect(
      screen.queryByText("Quien armó el corte no puede registrar el pago"),
    ).not.toBeInTheDocument();
  });

  it("muestra Pedir VoBo en borrador que lo requiere", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...draftSettlement,
              voboRequired: true,
              createdBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /Pedir VoBo/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Enviar para autorización/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("draft en menú muestra Pedir VoBo y Cancelar liquidación", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions settlement={draftSettlement} onView={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Pedir VoBo")).toBeInTheDocument();
    expect(screen.getByText("Cancelar liquidación")).toBeInTheDocument();
    expect(screen.queryByText("Rechazar")).not.toBeInTheDocument();
  });

  it("oculta Registrar pago al maker en bypass (borrador sin VoBo)", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...draftSettlement,
              voboRequired: false,
              createdBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Quien armó el corte no puede registrar el pago")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pedir VoBo/i })).not.toBeInTheDocument();
  });

  it("permite Registrar pago desde borrador bypass si no es el maker", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...draftSettlement,
              voboRequired: false,
              createdBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /Registrar pago/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Pedir VoBo/i })).not.toBeInTheDocument();
  });

  it("oculta Registrar pago al maker en Autorizado", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...sampleSettlement,
              status: "approved",
              createdBy: "user-creator-123",
              submittedBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Quien armó el corte no puede registrar el pago")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("aviso de umbral no bloquea CTAs cuando falla la lectura de settings", () => {
    mockSettingsQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isLoading: false,
      isError: true,
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...sampleSettlement,
              status: "approved",
              createdBy: "user-creator-123",
              submittedBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /Registrar pago/i })).toBeInTheDocument();
    expect(
      screen.getByText(/No se pudo leer la configuración de pagos a operadores/i),
    ).toBeInTheDocument();
  });
});
