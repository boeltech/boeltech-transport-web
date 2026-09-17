import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettlementDetailPage } from "./SettlementDetailPage";
import type { DriverSettlement } from "../../domain/entities";

const mockUseAuth = vi.fn();
const mockGetSettlementById = vi.fn();

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "accountant",
  }),
}));

vi.mock("@features/settings", () => ({
  useCompanySettings: () => ({ data: { legalName: "Transportes Test", rfc: "AAA010101AAA" } }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    getSettlementById: (...args: unknown[]) => mockGetSettlementById(...args),
    approveSettlement: vi.fn(),
    rejectSettlement: vi.fn(),
    disburseSettlement: vi.fn(),
    getSettings: vi.fn().mockResolvedValue({
      pagosOperadoresGreenfieldV1: false,
      voboThresholdMxn: 5000,
    }),
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

const pendingSettlement: DriverSettlement = {
  id: "set-detail-1",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-202609-0001",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  agreementSnapshot: { currency: "MXN" },
  periodStart: "2026-09-01",
  periodEnd: "2026-09-15",
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
  createdAt: "2026-09-15T10:00:00Z",
  updatedAt: "2026-09-15T10:00:00Z",
  items: [],
};

describe("SettlementDetailPage self-approval (H9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettlementById.mockResolvedValue(pendingSettlement);
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-approver-999",
        fullName: "Auditor",
        tenant: { name: "Tenant" },
      },
      isAuthenticated: true,
    });
  });

  it("muestra Autorizar cuando el revisor no es el solicitante", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/set-detail-1"]}>
          <Routes>
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Autorizar/i })).toBeInTheDocument();
  });

  it("no muestra Autorizar cuando submittedBy === user.id", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-creator-123",
        fullName: "Creador",
        tenant: { name: "Tenant" },
      },
      isAuthenticated: true,
    });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/set-detail-1"]}>
          <Routes>
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.getByText("Auto-aprobación no permitida")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Autorizar/i })).not.toBeInTheDocument();
  });

  it("H4: el paso Elaboró muestra el nombre que ahora llena el API", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      createdByName: "Ana Capataz",
      submittedByName: "Ana Capataz",
    });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/set-detail-1"]}>
          <Routes>
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.getByText("Elaboró")).toBeInTheDocument();
    expect(screen.getByText("Ana Capataz")).toBeInTheDocument();
  });

  it("H4: sin nombres del API el paso Elaboró queda vacío (regresión previa)", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/set-detail-1"]}>
          <Routes>
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.queryByText("Ana Capataz")).not.toBeInTheDocument();
  });
});
