import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettlementDetailPage } from "./SettlementDetailPage";
import type { DriverSettlement } from "../../domain/entities";

const mockUseAuth = vi.fn();
const mockGetSettlementById = vi.fn();
const mockSubmitSettlement = vi.fn();

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
    submitSettlement: (...args: unknown[]) => mockSubmitSettlement(...args),
    approveSettlement: vi.fn(),
    rejectSettlement: vi.fn(),
    disburseSettlement: vi.fn(),
    getSettings: vi.fn().mockResolvedValue({
      voboThresholdMxn: 0,
      activeApproverCount: 2,
      activeExecutorCount: 2,
    }),
  },
}));

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
  invalidateApprovalsRelatedQueries: vi.fn(),
  useSelfApprovalPolicy: () => ({
    data: {
      advanceApprove: { allowed: false, activeCounterpartCount: 1 },
      advanceDisburse: { allowed: false, activeCounterpartCount: 1 },
      settlementApprove: { allowed: false, activeCounterpartCount: 1 },
      settlementDisburse: { allowed: false, activeCounterpartCount: 1 },
      tripExpenseApprove: { allowed: false, activeCounterpartCount: 1 },
    },
  }),
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

  it("vuelve a por autorizar cuando viene con state.from", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    function QueueProbe() {
      const location = useLocation();
      return <div>{location.pathname}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/finance/settlements/set-detail-1",
              state: { from: "/finance/settlements/pending-approval" },
            },
          ]}
        >
          <Routes>
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
            <Route
              path="/finance/settlements/pending-approval"
              element={<QueueProbe />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Volver a por autorizar" }),
    );
    expect(screen.getByText("/finance/settlements/pending-approval")).toBeInTheDocument();
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

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
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

  it("D3′: muestra evidencia self-segregated en el timeline", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "disbursed",
      approvedAt: "2026-09-16T11:00:00Z",
      approvedBy: "user-solo",
      approvedByName: "Admin Único",
      disbursedAt: "2026-09-16T12:00:00Z",
      disbursedBy: "user-solo",
      disbursedByName: "Admin Único",
      disbursementMethod: "bank_transfer",
      disbursementReference: "SPEI-9",
      selfSegregatedApproval: true,
      approverCountAtApprove: 1,
      selfSegregatedDisbursement: true,
      executorCountAtDisburse: 1,
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

    expect(
      screen.getByText(/Autorizado en modo un solo responsable/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Pago registrado en modo un solo responsable/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Autoaprobado")).toBeInTheDocument();
    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
  });

  it("P2-2: una liquidación autorrechazada no muestra «Autoaprobado»", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "rejected",
      rejectionReason: "Montos incorrectos",
      selfSegregatedApproval: true,
      approverCountAtApprove: 1,
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

    expect(screen.queryByText("Autoaprobado")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Autorizado en modo un solo responsable/i),
    ).not.toBeInTheDocument();
  });
});

describe("SettlementDetailPage F6c (ADR-0085 E10)", () => {
  function CreateProbe() {
    const location = useLocation();
    return <div data-testid="create-probe">{`${location.pathname}${location.search}`}</div>;
  }

  function renderDetail() {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/set-detail-1"]}>
          <Routes>
            <Route path="/finance/settlements/new" element={<CreateProbe />} />
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "user-approver-999", fullName: "Auditor", tenant: { name: "Tenant" } },
      isAuthenticated: true,
    });
    mockSubmitSettlement.mockResolvedValue({ ...pendingSettlement });
  });

  it("D25: pendiente ofrece Corregir · Devolver para corregir · Autorizar · ⋯ y «Vista previa del recibo»", async () => {
    mockGetSettlementById.mockResolvedValue(pendingSettlement);
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Corregir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Devolver para corregir/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Autorizar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Más acciones/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Rechazar$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Vista previa del recibo/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Imprimir recibo/i })).not.toBeInTheDocument();
  });

  it("criterio 6: rechazada ofrece «Armar pago nuevo con este periodo»", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "rejected",
      rejectionReason: "Montos incorrectos",
    });
    renderDetail();

    await user.click(
      await screen.findByRole("button", { name: /Armar pago nuevo con este periodo/i }),
    );

    const target = screen.getByTestId("create-probe").textContent ?? "";
    expect(target).toContain("/finance/settlements/new?");
    expect(target).toContain("employeeId=emp-1");
    expect(target).toContain("periodStart=2026-09-01");
    expect(target).toContain("periodEnd=2026-09-15");
    expect(screen.queryByRole("button", { name: "Corregir" })).not.toBeInTheDocument();
  });

  it("criterio 1: devuelta muestra el motivo, abre el Sheet y permite reenviar sin cambios", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", fullName: "Creador", tenant: { name: "Tenant" } },
      isAuthenticated: true,
    });
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "draft",
      advancesReserved: true,
      approval: {
        flowStatus: "returned",
        stepCurrent: null,
        stepsTotal: 1,
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
          reason: "Falta el bono de puntualidad",
          reasonCode: "other",
          returnedBy: "user-approver-999",
          returnedByName: "Ana",
          returnedAt: "2026-09-16T11:00:00Z",
        },
      },
    });
    renderDetail();

    expect(await screen.findByText(/Falta el bono de puntualidad/)).toBeInTheDocument();
    // D15: el reenvío vive en la alerta, no se duplica en el header.
    expect(screen.queryByRole("button", { name: /Enviar a autorización/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Corregir y reenviar" }));
    expect(
      await screen.findByText("Corregir pago LIQ-202609-0001"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar y reenviar" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await user.click(screen.getByRole("button", { name: "Reenviar sin cambios" }));
    await waitFor(() => expect(mockSubmitSettlement).toHaveBeenCalledWith("set-detail-1"));
  });
});

describe("SettlementDetailPage franja Lo ganado − Descuentos = A pagar", () => {
  function settlementItem(
    overrides: Partial<NonNullable<DriverSettlement["items"]>[number]>,
  ): NonNullable<DriverSettlement["items"]>[number] {
    return {
      id: "item",
      settlementId: "set-detail-1",
      itemType: "bonus",
      tripId: null,
      tripExpenseId: null,
      advanceId: null,
      description: "",
      quantity: 1,
      unitRate: 0,
      amount: 0,
      isDeduction: false,
      createdAt: "2026-09-15T10:00:00Z",
      ...overrides,
    };
  }

  function renderDetail() {
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
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "user-approver-999", fullName: "Auditor", tenant: { name: "Tenant" } },
      isAuthenticated: true,
    });
  });

  it("anticipos y otras deducciones: la franja y el desglose cuadran con el neto", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      totalTripsCommission: 2733,
      totalBaseSalary: 4500,
      totalAdvancesDeducted: 2500,
      totalOtherDeductions: 200,
      grossAmount: 8033,
      netAmount: 5333,
      items: [
        settlementItem({
          id: "trip",
          itemType: "trip_commission",
          tripId: "trip-1",
          tripCode: "TRP-260908-0003",
          description: "Comisión de viaje TRP-260908-0003 (Amazon México → Estadio BBVA · Foráneo)",
          unitRate: 2733,
          amount: 2733,
        }),
        settlementItem({
          id: "viaticos",
          description: "Prestación fija: Viáticos",
          unitRate: 300,
          amount: 300,
          calculationDetails: { source: "fixed_allowance" },
        }),
        settlementItem({
          id: "comidas",
          description: "Prestación fija: Comidas",
          unitRate: 500,
          amount: 500,
          calculationDetails: { source: "fixed_allowance" },
        }),
        settlementItem({
          id: "salary",
          itemType: "base_salary",
          description: "Sueldo base fijo (Semanal)",
          unitRate: 4500,
          amount: 4500,
        }),
        settlementItem({
          id: "fondo",
          itemType: "adjustment",
          description: "Deducción de plantilla: Fondo de ahorro",
          unitRate: 200,
          amount: 200,
          isDeduction: true,
          calculationDetails: { source: "template_deduction" },
        }),
        settlementItem({
          id: "advance",
          itemType: "advance_deduction",
          advanceId: "adv-1",
          description: "Descuento de anticipo",
          unitRate: 2500,
          amount: 2500,
          isDeduction: true,
        }),
      ],
    });
    renderDetail();

    await screen.findByText("LIQ-202609-0001");

    expect(
      screen.getByText("Sueldo, viajes, prestaciones y reembolsos · 1 viaje"),
    ).toBeInTheDocument();
    expect(screen.getByText("Descuentos")).toBeInTheDocument();
    expect(screen.getByText("-$2,700.00")).toBeInTheDocument();
    expect(
      screen.getByText("Anticipos $2,500.00 · Otros descuentos $200.00"),
    ).toBeInTheDocument();
    expect(screen.getByText("$5,333.00")).toBeInTheDocument();
    expect(screen.getByText("Lo que recibe el operador")).toBeInTheDocument();

    await user.click(screen.getByText(/Ver desglose/i));

    expect(screen.getByText("2. Descuentos (−)")).toBeInTheDocument();
    expect(screen.getByText("Viáticos")).toBeInTheDocument();
    expect(screen.getAllByText("Prestación fija")).toHaveLength(2);
    expect(screen.getByText("Fondo de ahorro")).toBeInTheDocument();
    expect(screen.getByText("Deducción de tarifa")).toBeInTheDocument();
    expect(screen.getByText("De la tarifa del operador")).toBeInTheDocument();

    const deductionsTable = screen.getByRole("table", { name: "Desglose de descuentos" });
    const bodyRows = deductionsTable.querySelectorAll("tbody tr");
    expect(bodyRows[0]?.textContent).toContain("Descuento de anticipo");
    expect(bodyRows[1]?.textContent).toContain("Fondo de ahorro");

    const footer = deductionsTable.querySelector("tfoot")?.textContent ?? "";
    expect(footer).toContain("Anticipos:-$2,500.00");
    expect(footer).toContain("Otros descuentos:-$200.00");
    expect(footer).toContain("Subtotal descuentos:-$2,700.00");

    const earningsFooter =
      screen.getByRole("table", { name: "Desglose de ingresos" }).querySelector("tfoot")
        ?.textContent ?? "";
    expect(earningsFooter).toContain("$8,033.00");
  });

  it("solo otras deducciones: muestra el total y el subtexto de deducciones", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      totalOtherDeductions: 200,
      netAmount: 2300,
    });
    renderDetail();

    await screen.findByText("LIQ-202609-0001");

    expect(screen.getByText("-$200.00")).toBeInTheDocument();
    expect(screen.getByText("Deducciones y ajustes en contra")).toBeInTheDocument();
    expect(screen.getByText("$2,300.00")).toBeInTheDocument();
  });

  it("sin descuentos: $0.00 sin signo", async () => {
    mockGetSettlementById.mockResolvedValue(pendingSettlement);
    renderDetail();

    await screen.findByText("LIQ-202609-0001");

    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText("Sin descuentos en este pago")).toBeInTheDocument();
  });

  it("descuentos mayores que lo ganado: a pagar en $0.00 con aviso del excedente", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      totalTripsCommission: 2000,
      grossAmount: 2000,
      totalAdvancesDeducted: 2500,
      netAmount: 0,
    });
    renderDetail();

    await screen.findByText("LIQ-202609-0001");

    expect(screen.getByText("-$2,500.00")).toBeInTheDocument();
    expect(screen.getByText("Anticipos descontados en este pago")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(
      screen.getByText("Los descuentos superan lo ganado por $500.00; a pagar queda en $0.00."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Lo que recibe el operador")).not.toBeInTheDocument();
  });

  it("el aviso usa uncovered_deductions_amount del API cuando viene", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      totalTripsCommission: 2000,
      grossAmount: 2000,
      totalAdvancesDeducted: 2500,
      netAmount: 0,
      uncoveredDeductionsAmount: 300,
    });
    renderDetail();

    await screen.findByText("LIQ-202609-0001");

    expect(
      screen.getByText("Los descuentos superan lo ganado por $300.00; a pagar queda en $0.00."),
    ).toBeInTheDocument();
  });
});
