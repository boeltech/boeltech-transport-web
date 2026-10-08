/**
 * Smoke ADR-0085 — Flujo de Liquidaciones y Compensación a Operadores
 *
 * Cubre:
 * 1. Listado con pestañas de Liquidaciones, Anticipos y Esquemas.
 * 2. Cálculo en vivo (Preliquidación preview) y guardado/envío a autorización.
 * 3. Detalle de liquidación con desglose de partidas y autorización / dispersión.
 * 4. Fila enriquecida en bandeja de Aprobaciones para `internal_staff_compensation`.
 * 5. ADR-0087: gobernanza de tarifas legacy (redirect a hub compensación ADR-0089).
 * 6. ADR-0098: autoaprobación/autopago según la política del API (admin único,
 *    contador bloqueado, anticipo propio, pago propio, autorrechazo sin badge).
 */
import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ApprovalBlock } from "@features/approvals/domain";
import { settlementsCopy } from "@features/settlements/presentation/copy/settlementsCopy";
import { TooltipProvider } from "@shared/ui/tooltip";
import { SettlementsListPage } from "@features/settlements/presentation/pages/SettlementsListPage";
import { SettlementsRegistryPage } from "@features/settlements/presentation/pages/SettlementsRegistryPage";
import { SettlementsAdvancesPage } from "@features/settlements/presentation/pages/SettlementsAdvancesPage";
import { OperatorPaymentsHubLayout } from "@features/settlements/presentation/components/OperatorPaymentsHubLayout";
import { AgreementsLegacyRedirect } from "@features/compensation/presentation/routes/AgreementsLegacyRedirect";
import { SettlementDetailPage } from "@features/settlements/presentation/pages/SettlementDetailPage";
import { SettlementCreatePage } from "@features/settlements/presentation/pages/SettlementCreatePage";
import {
  mapSettlementPreview,
  mapWorkbenchResponse,
  type ApiTemplateChangeInPeriodRaw,
  type ApiTemplateVersionSupersededRaw,
} from "@features/settlements/infrastructure/mappers";
import { compensationApi } from "@features/compensation/infrastructure/compensationApi";
import { ApprovalRowCompensation } from "@features/approvals/presentation/components/ApprovalRowCompensation";
import { ApprovalRowAdvance } from "@features/approvals/presentation/components/ApprovalRowAdvance";
import type { ApprovableItem, SelfApprovalPolicy } from "@features/approvals/domain";
import { approvalsCopy } from "@features/approvals/presentation/copy/approvalsCopy";
import { COMPENSATION_TEMPLATES_PATH } from "@features/compensation/application/compensationRoutes";

const {
  mockListSettlements,
  mockGetSettlementById,
  mockCreateSettlement,
  mockPreviewSettlement,
  mockApproveSettlement,
  mockDisburseSettlement,
  mockListAdvances,
  mockCreateAdvance,
  mockListAgreements,
  mockCreateAgreement,
  mockUpdateAgreement,
  mockDeleteAgreement,
  mockGetWorkbench,
  mockFetchEmployees,
  mockFetchEmployee,
  mockDownloadCsv,
  mockGetSelfApprovalPolicy,
  mockAuthUser,
  mockUpdateSettlement,
  mockSubmitSettlement,
  mockUpdateAdvance,
  mockCancelAdvance,
} = vi.hoisted(() => ({
  mockUpdateSettlement: vi.fn(),
  mockSubmitSettlement: vi.fn(),
  mockUpdateAdvance: vi.fn(),
  mockCancelAdvance: vi.fn(),
  mockGetSelfApprovalPolicy: vi.fn(),
  mockAuthUser: {
    current: { id: "user-accountant-1", fullName: "Contador General", role: "accountant" },
  },
  mockListSettlements: vi.fn(),
  mockGetSettlementById: vi.fn(),
  mockCreateSettlement: vi.fn(),
  mockPreviewSettlement: vi.fn(),
  mockApproveSettlement: vi.fn(),
  mockDisburseSettlement: vi.fn(),
  mockListAdvances: vi.fn(),
  mockCreateAdvance: vi.fn(),
  mockListAgreements: vi.fn(),
  mockCreateAgreement: vi.fn(),
  mockUpdateAgreement: vi.fn(),
  mockDeleteAgreement: vi.fn(),
  mockGetWorkbench: vi.fn(),
  mockFetchEmployees: vi.fn(),
  mockFetchEmployee: vi.fn(),
  mockDownloadCsv: vi.fn(),
}));

vi.mock("@shared/utils/exportCsv", () => ({
  downloadCsv: (...args: unknown[]) => mockDownloadCsv(...args),
}));

vi.mock("@features/settlements/infrastructure/settlementsApi", () => ({
  settlementsApi: {
    listSettlements: (...args: unknown[]) => mockListSettlements(...args),
    getSettlementById: (...args: unknown[]) => mockGetSettlementById(...args),
    createSettlement: (...args: unknown[]) => mockCreateSettlement(...args),
    previewSettlement: (...args: unknown[]) => mockPreviewSettlement(...args),
    approveSettlement: (...args: unknown[]) => mockApproveSettlement(...args),
    rejectSettlement: vi.fn(),
    disburseSettlement: (...args: unknown[]) => mockDisburseSettlement(...args),
    listAdvances: (...args: unknown[]) => mockListAdvances(...args),
    getAdvanceById: vi.fn(),
    createAdvance: (...args: unknown[]) => mockCreateAdvance(...args),
    listAgreements: (...args: unknown[]) => mockListAgreements(...args),
    createAgreement: (...args: unknown[]) => mockCreateAgreement(...args),
    updateAgreement: (...args: unknown[]) => mockUpdateAgreement(...args),
    deleteAgreement: (...args: unknown[]) => mockDeleteAgreement(...args),
    getWorkbench: (...args: unknown[]) => mockGetWorkbench(...args),
    getSettings: vi.fn().mockResolvedValue({ voboThresholdMxn: 0 }),
    updateSettlement: (...args: unknown[]) => mockUpdateSettlement(...args),
    submitSettlement: (...args: unknown[]) => mockSubmitSettlement(...args),
    updateAdvance: (...args: unknown[]) => mockUpdateAdvance(...args),
    cancelAdvance: (...args: unknown[]) => mockCancelAdvance(...args),
  },
}));

// ADR-0098: la autoacción la decide la política del API, no el conteo de settings.
vi.mock("@features/approvals/infrastructure/approvalsApi", () => ({
  approvalsApi: {
    getSelfApprovalPolicy: () => mockGetSelfApprovalPolicy(),
    list: vi.fn(),
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

vi.mock("@features/employees/infrastructure/employeeRepository", () => ({
  fetchEmployees: (...args: unknown[]) => mockFetchEmployees(...args),
  fetchEmployee: (...args: unknown[]) => mockFetchEmployee(...args),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  terminateEmployee: vi.fn(),
  getAvailableForDriver: vi.fn(),
  getEmployeeBasic: vi.fn(),
}));

vi.mock("@features/branches", () => ({
  useBranches: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock("@features/notifications/infrastructure", () => ({
  notificationsApi: {
    getUnreadCount: vi.fn().mockResolvedValue(0),
    list: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: mockAuthUser.current.role,
  }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: mockAuthUser.current,
    isAuthenticated: true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

const mockEmployee = {
  id: "emp-smoke-1",
  tenantId: "tenant-1",
  employeeNumber: "EMP-001",
  firstName: "Roberto",
  lastName: "González",
  fullName: "Roberto González",
  role: "primary_driver",
  driverRole: "primary_driver",
  department: "operations",
  isActive: true,
};

const mockSettlementData = {
  id: "settlement-smoke-1",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-202608-0001",
  employeeId: "emp-smoke-1",
  employeeFullName: "Roberto González",
  agreementSnapshot: {
    calculationType: "rate_per_km",
    ratePerKm: 3.5,
    baseRate: 0,
    percentageRate: 0,
    helperDailyRate: 0,
    currency: "MXN",
  },
  periodStart: "2026-08-01",
  periodEnd: "2026-08-15",
  status: "pending_approval",
  totalTripsCommission: 3500,
  totalBaseSalary: 0,
  totalReimbursableExpenses: 500,
  totalBonuses: 0,
  totalAdvancesDeducted: 1000,
  totalOtherDeductions: 0,
  grossAmount: 4000,
  netAmount: 3000,
  currency: "MXN",
  disbursedAt: null,
  disbursedBy: null,
  disbursementMethod: null,
  disbursementReference: null,
  approvedAt: null,
  approvedBy: null,
  rejectionReason: null,
  notes: "Liquidación quincenal",
  createdAt: "2026-08-15T10:00:00Z",
  updatedAt: "2026-08-15T10:00:00Z",
  items: [
    {
      id: "item-1",
      settlementId: "settlement-smoke-1",
      itemType: "trip_commission",
      tripId: "trip-1",
      tripCode: "TRP-101",
      tripExpenseId: null,
      advanceId: null,
      description: "Comisión viaje TRP-101 (1000 km)",
      quantity: 1000,
      unitRate: 3.5,
      amount: 3500,
      isDeduction: false,
      createdAt: "2026-08-15T10:00:00Z",
    },
    {
      id: "item-2",
      settlementId: "settlement-smoke-1",
      itemType: "advance_deduction",
      tripId: null,
      tripExpenseId: null,
      advanceId: "adv-1",
      description: "Deducción de anticipo ANT-001",
      quantity: 1,
      unitRate: 1000,
      amount: 1000,
      isDeduction: true,
      createdAt: "2026-08-15T10:00:00Z",
    },
  ],
};

const ADMIN_ID = "user-admin-1";
const ACCOUNTANT_ID = "user-accountant-1";
const selfCopy = approvalsCopy.selfApproval;

type PolicyOverrides = Partial<Record<keyof SelfApprovalPolicy, boolean>>;

/** Respuesta del endpoint de capacidades; por defecto todo bloqueado. */
function makePolicy(overrides: PolicyOverrides = {}): SelfApprovalPolicy {
  const entry = (allowed = false) => ({
    allowed,
    activeCounterpartCount: allowed ? 1 : 2,
  });
  return {
    advanceApprove: entry(overrides.advanceApprove),
    advanceDisburse: entry(overrides.advanceDisburse),
    settlementApprove: entry(overrides.settlementApprove),
    settlementDisburse: entry(overrides.settlementDisburse),
    tripExpenseApprove: entry(overrides.tripExpenseApprove),
  };
}

const ADMIN_SOLO_POLICY = makePolicy({
  advanceApprove: true,
  advanceDisburse: true,
  settlementApprove: true,
  settlementDisburse: true,
  tripExpenseApprove: true,
});

function setUser(id: string, role: string, fullName = "Usuario Demo") {
  mockAuthUser.current = { id, fullName, role };
}

function renderSettlementDetail(id = "settlement-smoke-1") {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/finance/settlements/${id}`]}>
        <Routes>
          <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Smoke ADR-0085: Settlements Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUser(ACCOUNTANT_ID, "accountant", "Contador General");
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy());
    mockFetchEmployees.mockResolvedValue({
      data: [mockEmployee],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    mockFetchEmployee.mockResolvedValue(mockEmployee);
    mockListSettlements.mockResolvedValue({
      data: [mockSettlementData],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    mockListAdvances.mockResolvedValue({
      data: [
        {
          id: "adv-1",
          tenantId: "tenant-1",
          folio: "ANT-001",
          employeeId: "emp-smoke-1",
          employeeFullName: "Roberto González",
          tripId: "trip-1",
          tripCode: "TRP-101",
          amount: 1500,
          balanceRemaining: 1000,
          currency: "MXN",
          category: "travel_advance",
          status: "partially_applied",
          disbursedAt: "2026-08-01T10:00:00Z",
          paymentMethod: "bank_transfer",
          bankReference: "SPEI-9988",
          notes: "Viáticos ruta",
          createdAt: "2026-08-01T10:00:00Z",
          updatedAt: "2026-08-01T10:00:00Z",
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    mockListAgreements.mockResolvedValue([
      {
        id: "agr-1",
        tenantId: "tenant-1",
        employeeId: "emp-smoke-1",
        employeeFullName: "Roberto González",
        calculationType: "rate_per_km",
        baseRate: 0,
        ratePerKm: 3.5,
        percentageRate: 0,
        helperDailyRate: 0,
        currency: "MXN",
        effectiveFrom: "2026-01-01",
        effectiveTo: null,
        isActive: true,
        notes: null,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    mockGetWorkbench.mockResolvedValue({
      summary: {
        pending: 0,
        draft: 0,
        approval: 1,
        payable: 0,
        closed: 0,
        open_advances: 1,
      },
      backlog: [],
    });
  });

  it("1. Renderiza el listado principal con las liquidaciones del operador", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/registry"]}>
          <Routes>
            <Route
              path="/finance/settlements/registry"
              element={<SettlementsRegistryPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202608-0001")).toBeInTheDocument();
    });

    expect(screen.getByText("Roberto González")).toBeInTheDocument();
    expect(screen.getByText("$3,000.00")).toBeInTheDocument();
    expect(screen.getByText("Por autorizar")).toBeInTheDocument();
  });

  it("2. Renderiza la vista de detalle con KPI cards y partidas desglosadas", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue(mockSettlementData);
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/settlement-smoke-1"]}>
          <Routes>
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202608-0001")).toBeInTheDocument();
    });

    expect(screen.getByText("Lo ganado")).toBeInTheDocument();
    expect(screen.getByText("Descuentos")).toBeInTheDocument();
    expect(screen.getByText("A pagar")).toBeInTheDocument();
    expect(screen.getAllByText(formatMxCurrency(4000)).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(`-${formatMxCurrency(1000)}`).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(formatMxCurrency(3000)).length).toBeGreaterThanOrEqual(1);

    // Desglose colapsado por defecto fuera de draft/rejected
    await user.click(screen.getByText(/Ver desglose/i));
    expect(screen.getAllByText("Pago por viaje").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Descuento de anticipo").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(formatMxCurrency(3500)).length).toBeGreaterThanOrEqual(1);

    // F6 D25: Devolver para corregir · Autorizar · ⋯ (Rechazar)
    const authorizeBtn = screen.getByRole("button", { name: /Autorizar/i });
    expect(authorizeBtn).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Devolver para corregir/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Más acciones/i }));
    expect(await screen.findByRole("menuitem", { name: /Rechazar/i })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    // Confirmar que al hacer click en Autorizar se abre el AlertDialog de confirmación
    await user.click(authorizeBtn);
    expect(screen.getByRole("heading", { name: /¿Autorizar pago\?/i })).toBeInTheDocument();
    const confirmActionBtn = screen.getByRole("button", { name: /Sí, autorizar pago/i });
    expect(confirmActionBtn).toBeInTheDocument();
    await user.click(confirmActionBtn);

    expect(mockApproveSettlement).toHaveBeenCalledWith("settlement-smoke-1");
  });

  it("2b. Abre vista previa de impresión de recibo y utiliza iframe seguro sin popups", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue(mockSettlementData);
    const windowOpenSpy = vi.spyOn(window, "open");
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/settlement-smoke-1"]}>
          <Routes>
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202608-0001")).toBeInTheDocument();
    });

    // Abrir modal de vista previa imprimible (F6 D28: pendiente = vista previa)
    const printReceiptBtn = screen.getByRole("button", { name: /Vista previa del recibo/i });
    expect(printReceiptBtn).toBeInTheDocument();
    await user.click(printReceiptBtn);

    // Verificar que el diálogo de vista previa está abierto y la clase activa está en body
    expect(
      screen.getByRole("heading", { name: /Recibo de pago/i }),
    ).toBeInTheDocument();
    expect(document.body.classList.contains("print-receipt-active")).toBe(true);

    // Click en Imprimir dentro del modal
    const dialogPrintBtn = screen.getByRole("button", { name: /^Imprimir$/i });
    expect(dialogPrintBtn).toBeInTheDocument();
    await user.click(dialogPrintBtn);

    // Validar que NUNCA se usó window.open (seguridad XSS y popup blockers)
    expect(windowOpenSpy).not.toHaveBeenCalled();

    // Validar que se inyectó el iframe oculto en el DOM con el recibo
    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe?.style.visibility).toBe("hidden");
    expect(iframe?.srcdoc).toContain("Pago a operador — Período");
    expect(iframe?.srcdoc).toContain("LIQ-202608-0001");

    windowOpenSpy.mockRestore();
  });

  it("3. Renderiza ApprovalRowCompensation en bandeja de aprobaciones", () => {
    const item: ApprovableItem = {
      approvableType: "internal_staff_compensation",
      id: "settlement-smoke-1",
      amount: 3000,
      currency: "MXN",
      category: "internal_staff_compensation",
      status: "pending",
      submittedAt: "2026-08-15T10:00:00.000Z",
      submittedBy: "user-1",
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      context: {
        approvableType: "internal_staff_compensation",
        settlementId: "settlement-smoke-1",
        settlementNumber: "LIQ-202608-0001",
        employeeId: "emp-smoke-1",
        employeeFullName: "Roberto González",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
        tripsCount: 1,
        grossAmount: 4000,
        totalDeductions: 1000,
        netAmount: 3000,
      },
    };

    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRowCompensation
              item={item}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "LIQ-202608-0001" })).toHaveAttribute(
      "href",
      "/finance/settlements/settlement-smoke-1",
    );
    expect(screen.getByText(/Roberto González/)).toBeInTheDocument();
    expect(screen.getByText(/1 viajes/)).toBeInTheDocument();
    expect(screen.getByText(/Viajes/)).toBeInTheDocument();
    expect(screen.getByText(/Descuentos -/)).toBeInTheDocument();
    expect(screen.getByText("$3,000.00")).toBeInTheDocument();
  });

  it("5. Enlace de workbench abre Tarifas (ADR-0089)", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>
          <MemoryRouter initialEntries={["/finance/settlements"]}>
            <Routes>
              <Route path="/finance/settlements" element={<SettlementsListPage />} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      const links = screen.getAllByRole("link", {
        name: /Tarifas/i,
      });
      expect(
        links.some((link) => link.getAttribute("href") === COMPENSATION_TEMPLATES_PATH),
      ).toBe(true);
    });
  });

  it("6. Renderiza el dialog de registrar anticipo con componente MoneyInput", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/advances"]}>
          <Routes>
            <Route element={<OperatorPaymentsHubLayout />}>
              <Route
                path="/finance/settlements/advances"
                element={<SettlementsAdvancesPage />}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Pagos a operadores/i }),
      ).toBeInTheDocument();
    });

    // Click en Registrar anticipo (CTA del hub)
    const createBtn = screen.getByRole("button", { name: /Registrar anticipo/i });
    await user.click(createBtn);

    // Validar que se abre el Dialog con título de settlementsCopy
    expect(
      screen.getByRole("heading", { name: /Registrar anticipo a operador/i }),
    ).toBeInTheDocument();

    // Validar inputs y presencia de MoneyInput + combobox async
    expect(screen.getByLabelText(/Operador \/ Empleado/i)).toBeInTheDocument();
    expect(screen.getByText(/Monto \(\$\) \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Categoría \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Método de entrega \*/i)).toBeInTheDocument();
    expect(screen.getByText("MXN")).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", { name: /Registrar anticipo/i, hidden: false });
    expect(saveBtn).toBeInTheDocument();

    // Intentar enviar sin datos para gatillar validaciones
    await user.click(saveBtn);
    expect(screen.getByText(/El empleado es obligatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/El monto debe ser mayor a 0/i)).toBeInTheDocument();

    // Cerrar el dialog y volver a abrirlo
    const cancelBtn = screen.getByRole("button", { name: /Cancelar/i });
    await user.click(cancelBtn);

    await user.click(createBtn);

    // Los errores no deben estar presentes al reabrir
    expect(screen.queryByText(/El empleado es obligatorio/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/El monto debe ser mayor a 0/i)).not.toBeInTheDocument();
  });

  it("4. Permite exportar liquidaciones a CSV", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/registry"]}>
          <Routes>
            <Route
              path="/finance/settlements/registry"
              element={<SettlementsRegistryPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202608-0001")).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Exportar CSV/i });
    expect(exportBtn).toBeInTheDocument();

    await user.click(exportBtn);

    expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
    const [filename, headers, rows] = mockDownloadCsv.mock.calls[0]!;
    expect(filename).toMatch(/^pagos-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(headers).toContain("Folio");
    expect(headers).toContain("Operador");
    expect(headers).toContain("Monto Neto");
    expect(rows[0]).toContain("LIQ-202608-0001");
    expect(rows[0]).toContain("Roberto González");
  });

  it("7. Renderiza ApprovalRowAdvance en bandeja de aprobaciones para anticipos (ADR-0086)", () => {
    const item: ApprovableItem = {
      approvableType: "driver_advance_request",
      id: "adv-smoke-1",
      amount: 1500,
      currency: "MXN",
      category: "travel_advance",
      status: "pending",
      submittedAt: "2026-08-15T10:00:00.000Z",
      submittedBy: "user-1",
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      context: {
        approvableType: "driver_advance_request",
        advanceId: "adv-smoke-1",
        folio: "ANT-202608-0001",
        employeeId: "emp-smoke-1",
        employeeFullName: "Roberto González",
        category: "travel_advance",
        tripId: "trip-101",
        tripCode: "TRP-101",
        paymentMethod: "bank_transfer",
        notes: "Viáticos CDMX-GDL",
      },
    };

    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRowAdvance
              item={item}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.getByText("ANT-202608-0001")).toBeInTheDocument();
    expect(screen.getByText("Roberto González")).toBeInTheDocument();
    expect(screen.getByText(/Viaje: TRP-101/)).toBeInTheDocument();
    expect(screen.getByText("Viáticos CDMX-GDL")).toBeInTheDocument();
    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
  });

  it("8. Renderiza vista previa imprimible del recibo de liquidación (SettlementReceiptPrintView)", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue(mockSettlementData);
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/settlement-smoke-1"]}>
          <Routes>
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202608-0001")).toBeInTheDocument();
    });

    // F6 D28: pendiente de autorización = documento de revisión, sin firmas.
    const printBtn = screen.getByRole("button", { name: /Vista previa del recibo/i });
    expect(printBtn).toBeInTheDocument();

    await user.click(printBtn);

    expect(screen.getByRole("heading", { name: /Recibo de pago/i })).toBeInTheDocument();
    expect(screen.getByText("Pago a operador — Período")).toBeInTheDocument();
    expect(screen.getByText("NO VÁLIDO PARA FIRMA")).toBeInTheDocument();
    expect(screen.getByText(/Última modificación:/)).toBeInTheDocument();
    expect(screen.queryByText("Firma de Conformidad del Operador")).not.toBeInTheDocument();
    expect(screen.queryByText("Revisado y Autorizado / Empresa")).not.toBeInTheDocument();
  });

  it("8b. F6 D28: autorizada imprime recibo firmable con firmas", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...mockSettlementData,
      status: "approved",
      approvedBy: "user-approver",
      approvedByName: "Ana Autorizadora",
      approvedAt: "2026-08-30T18:00:00.000Z",
    });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/settlement-smoke-1"]}>
          <Routes>
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202608-0001")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Imprimir recibo/i }));

    expect(screen.getByText("Firma de Conformidad del Operador")).toBeInTheDocument();
    expect(screen.getByText("Revisado y Autorizado / Empresa")).toBeInTheDocument();
    expect(screen.queryByText("NO VÁLIDO PARA FIRMA")).not.toBeInTheDocument();
  });

  it("9. ADR-0089: redirige tab legacy agreements al hub de plantillas", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>
          <MemoryRouter initialEntries={["/finance/settlements?tab=agreements"]}>
            <Routes>
              <Route path="/finance/settlements" element={<SettlementsListPage />} />
              <Route
                path="/finance/compensation/templates"
                element={<div>compensation-templates-hub</div>}
              />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("compensation-templates-hub")).toBeInTheDocument();
    });
  });

  it("10. ADR-0089: /finance/agreements redirige al hub de plantillas", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/agreements?employeeId=emp-smoke-1"]}>
          <Routes>
            <Route path="/finance/agreements" element={<AgreementsLegacyRedirect />} />
            <Route
              path="/finance/compensation/templates"
              element={<div data-testid="compensation-templates-hub">hub</div>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("compensation-templates-hub")).toBeInTheDocument();
    });
  });

  it("11. D-1 C1: cambio de esquema en el período — insignia en Por pagar → alta con el aviso", async () => {
    const user = userEvent.setup();
    const listAssignmentsSpy = vi
      .spyOn(compensationApi, "listAssignments")
      .mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } });

    const rawChange = {
      templates_count: 2,
      from: {
        assignment_id: "asg-norte",
        template_id: "tpl-norte",
        template_name: "Norte",
        template_version: 1,
        effective_from: "2026-07-01",
        effective_to: "2026-08-14",
        is_closing: false,
      },
      to: {
        assignment_id: "asg-sur",
        template_id: "tpl-sur",
        template_name: "Sur",
        template_version: 1,
        effective_from: "2026-08-15",
        effective_to: null,
        is_closing: true,
      },
      assignments: [] as unknown[],
    };
    rawChange.assignments = [rawChange.from, rawChange.to];

    mockGetWorkbench.mockResolvedValue(
      mapWorkbenchResponse({
        summary: { pending: 1, draft: 0, approval: 0, payable: 0, closed: 0, open_advances: 0 },
        backlog: [
          {
            employee_id: "emp-smoke-1",
            employee_full_name: "Roberto González",
            employment_type: "permanent",
            branch_id: null,
            branch_name: null,
            period_start: "2026-08-01",
            period_end: "2026-08-31",
            pending_trips_count: 0,
            oldest_trip_age_days: 0,
            estimated_net_amount: 3500,
            row_type: "salary_close",
            warnings: ["template_change_in_period"],
            period_overlap: null,
            template_change: rawChange,
            suggested_period_start: null,
            pending_reimbursements_count: 0,
          },
        ],
      }),
    );
    mockPreviewSettlement.mockResolvedValue(
      mapSettlementPreview({
        employee_id: "emp-smoke-1",
        employee_name: "Roberto González",
        period_start: "2026-08-01",
        period_end: "2026-08-31",
        agreement: { rules: [] },
        template: { id: "tpl-sur", name: "Sur", assignment_id: "asg-sur" },
        template_change: rawChange as unknown as ApiTemplateChangeInPeriodRaw,
        employee_compensation: { base_salary: 3500, salary_type: "monthly" },
        eligible_trips: [],
        open_advances: [],
        summary: {
          total_commissions: 0,
          total_base_salary: 3500,
          total_reimbursements: 0,
          suggested_advance_deduction: 0,
          gross_amount: 3500,
          net_amount: 3500,
        },
      }),
    );

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <TooltipProvider delayDuration={0}>
          <MemoryRouter initialEntries={["/finance/settlements"]}>
            <Routes>
              <Route path="/finance/settlements" element={<SettlementsListPage />} />
              <Route path="/finance/settlements/new" element={<SettlementCreatePage />} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    const badge = await screen.findByTestId("backlog-template-change-badge");
    expect(badge).toHaveTextContent(settlementsCopy.workbench.warnings.template_change_in_period);
    expect(screen.queryByText("template_change_in_period")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: settlementsCopy.workbench.actions.settlePeriod }),
    );

    const alert = await screen.findByTestId("settlement-template-change-alert");
    expect(alert).toHaveTextContent("Este período tiene dos esquemas");
    expect(alert).toHaveTextContent(
      "Se aplica Sur a todo el período porque es el vigente el 31 ago 2026.",
    );
    expect(screen.queryByText(/template_change_in_period/)).not.toBeInTheDocument();
    expect(mockPreviewSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: "emp-smoke-1",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
      }),
    );

    listAssignmentsSpy.mockRestore();
  });

  it("12. api#59: versión de tarifa reemplazada — insignia en Por pagar → alta con el aviso", async () => {
    const user = userEvent.setup();
    const listAssignmentsSpy = vi
      .spyOn(compensationApi, "listAssignments")
      .mockResolvedValue({ data: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } });

    const rawSuperseded: ApiTemplateVersionSupersededRaw = {
      template_id: "tpl-norte-v1",
      template_name: "Norte",
      template_version: 1,
      assignment_id: "asg-norte",
      superseded_at: "2026-08-03T16:00:00Z",
      replaced_by: { template_id: "tpl-norte-v2", template_name: "Norte", template_version: 2 },
    };
    const expectedBody =
      "Se calcula con Norte versión 1, que ya fue reemplazada por la versión 2. Si el operador debe cobrar con la versión 2, reasígnalo indicando desde qué fecha.";

    mockGetWorkbench.mockResolvedValue(
      mapWorkbenchResponse({
        summary: { pending: 1, draft: 0, approval: 0, payable: 0, closed: 0, open_advances: 0 },
        backlog: [
          {
            employee_id: "emp-smoke-1",
            employee_full_name: "Roberto González",
            employment_type: "permanent",
            branch_id: null,
            branch_name: null,
            period_start: "2026-08-01",
            period_end: "2026-08-31",
            pending_trips_count: 0,
            oldest_trip_age_days: 0,
            estimated_net_amount: 3500,
            row_type: "salary_close",
            warnings: ["template_version_superseded"],
            period_overlap: null,
            template_change: null,
            template_superseded: rawSuperseded,
            suggested_period_start: null,
            pending_reimbursements_count: 0,
          },
        ],
      }),
    );
    mockPreviewSettlement.mockResolvedValue(
      mapSettlementPreview({
        employee_id: "emp-smoke-1",
        employee_name: "Roberto González",
        period_start: "2026-08-01",
        period_end: "2026-08-31",
        agreement: { rules: [] },
        template: {
          id: "tpl-norte-v1",
          name: "Norte",
          assignment_id: "asg-norte",
          version: 1,
          payability: "superseded",
        },
        template_superseded: rawSuperseded,
        employee_compensation: { base_salary: 3500, salary_type: "monthly" },
        eligible_trips: [],
        open_advances: [],
        summary: {
          total_commissions: 0,
          total_base_salary: 3500,
          total_reimbursements: 0,
          suggested_advance_deduction: 0,
          gross_amount: 3500,
          net_amount: 3500,
        },
      }),
    );

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <TooltipProvider delayDuration={0}>
          <MemoryRouter initialEntries={["/finance/settlements"]}>
            <Routes>
              <Route path="/finance/settlements" element={<SettlementsListPage />} />
              <Route path="/finance/settlements/new" element={<SettlementCreatePage />} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    );

    const badge = await screen.findByTestId("backlog-template-superseded-badge");
    expect(badge).toHaveTextContent(
      settlementsCopy.workbench.warnings.template_version_superseded,
    );
    expect(screen.queryByText("template_version_superseded")).not.toBeInTheDocument();

    await user.hover(badge);
    expect((await screen.findAllByText(expectedBody)).length).toBeGreaterThanOrEqual(1);
    await user.unhover(badge);

    await user.click(
      screen.getByRole("button", { name: settlementsCopy.workbench.actions.settlePeriod }),
    );

    const alert = await screen.findByTestId("settlement-template-superseded-alert");
    expect(alert).toHaveTextContent(settlementsCopy.workbench.templateSuperseded.title);
    expect(alert).toHaveTextContent(expectedBody);
    expect(screen.queryByText(/template_version_superseded/)).not.toBeInTheDocument();
    expect(mockPreviewSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: "emp-smoke-1",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
      }),
    );

    listAssignmentsSpy.mockRestore();
  });

  describe("ADR-0098 autoaprobación", () => {
    const ownPendingSettlement = {
      ...mockSettlementData,
      createdBy: ADMIN_ID,
      submittedBy: ADMIN_ID,
      createdByName: "Admin Único",
      submittedByName: "Admin Único",
      submittedAt: "2026-08-15T10:00:00Z",
    };

    it("11a. Admin único autoriza su liquidación con el diálogo propio y el detalle muestra «Autoaprobado»", async () => {
      const user = userEvent.setup();
      setUser(ADMIN_ID, "admin", "Admin Único");
      mockGetSelfApprovalPolicy.mockResolvedValue(ADMIN_SOLO_POLICY);
      let approved = false;
      mockGetSettlementById.mockImplementation(async () =>
        approved
          ? {
              ...ownPendingSettlement,
              status: "approved",
              approvedAt: "2026-08-16T09:00:00Z",
              approvedBy: ADMIN_ID,
              approvedByName: "Admin Único",
              selfSegregatedApproval: true,
              approverCountAtApprove: 1,
            }
          : ownPendingSettlement,
      );
      mockApproveSettlement.mockImplementation(async () => {
        approved = true;
        return { ...ownPendingSettlement, status: "approved" };
      });

      renderSettlementDetail();
      await screen.findByText("LIQ-202608-0001");
      await waitFor(() => expect(mockGetSelfApprovalPolicy).toHaveBeenCalled());

      await user.click(await screen.findByRole("button", { name: "Autorizar" }));
      const dialog = await screen.findByRole("alertdialog");
      expect(within(dialog).getByText(selfCopy.confirmTitle)).toBeInTheDocument();
      expect(within(dialog).getByText(/Tú enviaste este pago/i)).toBeInTheDocument();
      expect(mockApproveSettlement).not.toHaveBeenCalled();

      await user.click(
        within(dialog).getByRole("button", { name: selfCopy.confirmAction }),
      );
      await waitFor(() => {
        expect(mockApproveSettlement).toHaveBeenCalledWith("settlement-smoke-1");
      });

      const authorizedStep = (await screen.findByText("Autorizó")).closest("li");
      expect(authorizedStep).not.toBeNull();
      await waitFor(() => {
        expect(
          within(authorizedStep as HTMLElement).getByText(selfCopy.badge),
        ).toBeInTheDocument();
      });
    });

    it("11b. Contador con política allowed:false ve «Enviada por ti» y no puede autorizar", async () => {
      setUser(ACCOUNTANT_ID, "accountant", "Contador General");
      mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy());
      mockGetSettlementById.mockResolvedValue({
        ...mockSettlementData,
        createdBy: ACCOUNTANT_ID,
        submittedBy: ACCOUNTANT_ID,
      });

      renderSettlementDetail();
      await screen.findByText("LIQ-202608-0001");
      await waitFor(() => expect(mockGetSelfApprovalPolicy).toHaveBeenCalled());

      expect(screen.getByText(selfCopy.ownChip)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Autorizar" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Rechazar/i })).not.toBeInTheDocument();
    });

    describe("11c. Anticipo propio por entregar", () => {
      const ownDisbursableAdvance = {
        id: "adv-own-1",
        tenantId: "tenant-1",
        folio: "ANT-OWN-001",
        employeeId: "emp-smoke-1",
        employeeFullName: "Roberto González",
        tripId: null,
        tripCode: null,
        amount: 2000,
        balanceRemaining: 2000,
        currency: "MXN",
        category: "travel_advance",
        status: "pending_disbursement",
        disbursedAt: null,
        paymentMethod: "bank_transfer",
        bankReference: null,
        notes: null,
        createdBy: ADMIN_ID,
        submittedBy: ADMIN_ID,
        submittedAt: "2026-08-14T10:00:00Z",
        selfSegregatedApproval: true,
        createdAt: "2026-08-14T10:00:00Z",
        updatedAt: "2026-08-14T10:00:00Z",
      };
      const selfRejectedAdvance = {
        ...ownDisbursableAdvance,
        id: "adv-own-2",
        folio: "ANT-OWN-002",
        status: "rejected",
        rejectionReason: "Duplicado",
      };

      function renderAdvances() {
        const queryClient = createTestQueryClient();
        return render(
          <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={["/finance/settlements/advances"]}>
              <Routes>
                <Route element={<OperatorPaymentsHubLayout />}>
                  <Route
                    path="/finance/settlements/advances"
                    element={<SettlementsAdvancesPage />}
                  />
                </Route>
              </Routes>
            </MemoryRouter>
          </QueryClientProvider>,
        );
      }

      async function openRowMenu(
        user: ReturnType<typeof userEvent.setup>,
        folio: string,
      ) {
        const row = (await screen.findByText(folio)).closest("tr");
        expect(row).not.toBeNull();
        await user.click(
          within(row as HTMLElement).getByRole("button", {
            name: /abrir menú de acciones/i,
          }),
        );
      }

      beforeEach(() => {
        setUser(ADMIN_ID, "admin", "Admin Único");
        mockListAdvances.mockResolvedValue({
          data: [ownDisbursableAdvance, selfRejectedAdvance],
          pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
        });
      });

      it("con advance_disburse.allowed:false aparece el renglón de entrega deshabilitado", async () => {
        const user = userEvent.setup();
        mockGetSelfApprovalPolicy.mockResolvedValue(
          makePolicy({ advanceApprove: true }),
        );
        renderAdvances();

        await waitFor(() => expect(mockGetSelfApprovalPolicy).toHaveBeenCalled());
        await openRowMenu(user, "ANT-OWN-001");

        const ownRow = await screen.findByRole("menuitem", {
          name: new RegExp(selfCopy.ownChip),
        });
        expect(ownRow).toHaveAttribute("aria-disabled", "true");
        expect(ownRow).toHaveTextContent(selfCopy.ownDisburseTooltip);
        expect(screen.queryByText("Registrar entrega / pago")).not.toBeInTheDocument();
      });

      it("con advance_disburse.allowed:true pide «¿Registrar el pago de tu propia solicitud?»", async () => {
        const user = userEvent.setup();
        mockGetSelfApprovalPolicy.mockResolvedValue(ADMIN_SOLO_POLICY);
        renderAdvances();

        await waitFor(() => expect(mockGetSelfApprovalPolicy).toHaveBeenCalled());
        await openRowMenu(user, "ANT-OWN-001");
        await user.click(await screen.findByText("Registrar entrega / pago"));

        expect(
          await screen.findByRole("heading", { name: selfCopy.confirmDisburseTitle }),
        ).toBeInTheDocument();
        expect(screen.getByText(/Tú registraste este anticipo/i)).toBeInTheDocument();
      });

      it("«Autoaprobado» solo en el anticipo autorizado, no en el autorrechazado", async () => {
        mockGetSelfApprovalPolicy.mockResolvedValue(ADMIN_SOLO_POLICY);
        renderAdvances();

        const approvedRow = (await screen.findByText("ANT-OWN-001")).closest("tr");
        const rejectedRow = screen.getByText("ANT-OWN-002").closest("tr");
        expect(
          within(approvedRow as HTMLElement).getByText(selfCopy.badge),
        ).toBeInTheDocument();
        expect(
          within(rejectedRow as HTMLElement).queryByText(selfCopy.badge),
        ).not.toBeInTheDocument();
      });
    });

    it("11d. Pago de liquidación propia: DisburseSettlementDialog con el aviso de autoacción", async () => {
      const user = userEvent.setup();
      setUser(ADMIN_ID, "admin", "Admin Único");
      mockGetSelfApprovalPolicy.mockResolvedValue(ADMIN_SOLO_POLICY);
      mockGetSettlementById.mockResolvedValue({
        ...ownPendingSettlement,
        status: "approved",
        approvedAt: "2026-08-16T09:00:00Z",
        approvedBy: ADMIN_ID,
        approvedByName: "Admin Único",
        selfSegregatedApproval: true,
        approverCountAtApprove: 1,
      });

      renderSettlementDetail();
      await screen.findByText("LIQ-202608-0001");
      await waitFor(() => expect(mockGetSelfApprovalPolicy).toHaveBeenCalled());

      await user.click(
        await screen.findByRole("button", { name: "Registrar pago al operador" }),
      );
      const dialog = await screen.findByRole("dialog");
      expect(
        within(dialog).getByRole("heading", { name: selfCopy.confirmDisburseTitle }),
      ).toBeInTheDocument();
      expect(within(dialog).getByText(/Tú registraste este pago/i)).toBeInTheDocument();
    });

    it("11d-bis. Pago de liquidación propia bloqueado: «Enviada por ti» en lugar de Registrar pago", async () => {
      setUser(ADMIN_ID, "admin", "Admin Único");
      mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy());
      mockGetSettlementById.mockResolvedValue({
        ...ownPendingSettlement,
        status: "approved",
        approvedAt: "2026-08-16T09:00:00Z",
        approvedBy: "user-accountant-1",
        approvedByName: "Contador General",
      });

      renderSettlementDetail();
      await screen.findByText("LIQ-202608-0001");
      await waitFor(() => expect(mockGetSelfApprovalPolicy).toHaveBeenCalled());

      expect(screen.getByText(selfCopy.ownChip)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Registrar pago al operador" }),
      ).not.toBeInTheDocument();
    });

    it("11e. Liquidación autorrechazada no muestra «Autoaprobado»", async () => {
      setUser(ADMIN_ID, "admin", "Admin Único");
      mockGetSelfApprovalPolicy.mockResolvedValue(ADMIN_SOLO_POLICY);
      mockGetSettlementById.mockResolvedValue({
        ...ownPendingSettlement,
        status: "rejected",
        rejectionReason: "Kilometraje incorrecto",
        selfSegregatedApproval: true,
        approverCountAtApprove: 1,
      });

      renderSettlementDetail();
      await screen.findByText("LIQ-202608-0001");

      expect(screen.getByText("Autorizó")).toBeInTheDocument();
      expect(screen.queryByText(selfCopy.badge)).not.toBeInTheDocument();
    });
  });
});

describe("Smoke ADR-0099 F7: liquidaciones y anticipos (ST-1…ST-6)", () => {
  const flowCopy = settlementsCopy.settlementFlow;
  const advanceFlow = settlementsCopy.advanceFlow;

  const returnedApproval: ApprovalBlock = {
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
    cannotActReason: "returned",
    escalated: false,
    reapproval: null,
    returned: {
      reason: "Falta el bono de puntualidad",
      reasonCode: "other",
      returnedBy: "user-approver",
      returnedByName: "Ana Autorizadora",
      returnedAt: "2026-08-16T11:00:00Z",
    },
  };

  const approvedSettlement = {
    ...mockSettlementData,
    status: "approved",
    approvedBy: "user-approver",
    approvedByName: "Ana Autorizadora",
    approvedAt: "2026-08-16T09:00:00Z",
    approvalRevision: "rev-1",
  };

  const authorizedAdvance = {
    id: "adv-auth-1",
    tenantId: "tenant-1",
    folio: "ANT-AUTH-001",
    employeeId: "emp-smoke-1",
    employeeFullName: "Roberto González",
    tripId: null,
    tripCode: null,
    amount: 8000,
    balanceRemaining: 8000,
    currency: "MXN",
    category: "travel_advance",
    status: "pending_disbursement",
    disbursedAt: null,
    paymentMethod: "bank_transfer",
    bankReference: null,
    notes: "Casetas",
    submittedBy: "user-driver-9",
    approvedByName: "Ana López",
    approvedAt: "2026-08-10T10:00:00Z",
    createdAt: "2026-08-09T10:00:00Z",
    updatedAt: "2026-08-10T10:00:00Z",
  };
  const deliveredAdvance = {
    ...authorizedAdvance,
    id: "adv-delivered-1",
    folio: "ANT-DELIV-001",
    status: "disbursed",
    disbursedAt: "2026-08-11T10:00:00Z",
  };
  const pendingAdvance = {
    ...authorizedAdvance,
    id: "adv-pending-1",
    folio: "ANT-PEND-001",
    status: "pending_approval",
    approvedByName: null,
    approvedAt: null,
  };

  function CreateProbe() {
    const location = useLocation();
    return <div data-testid="create-probe">{`${location.pathname}${location.search}`}</div>;
  }

  function renderDetailWithCreate() {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/settlement-smoke-1"]}>
          <Routes>
            <Route path="/finance/settlements/new" element={<CreateProbe />} />
            <Route path="/finance/settlements/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  function renderAdvancesPage() {
    const queryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/advances"]}>
          <Routes>
            <Route element={<OperatorPaymentsHubLayout />}>
              <Route path="/finance/settlements/advances" element={<SettlementsAdvancesPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  async function openAdvanceMenu(user: ReturnType<typeof userEvent.setup>, folio: string) {
    const row = (await screen.findByText(folio)).closest("tr");
    expect(row).not.toBeNull();
    await user.click(
      within(row as HTMLElement).getByRole("button", { name: /abrir menú de acciones/i }),
    );
    return screen.findByRole("menu");
  }

  beforeAll(() => {
    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.setPointerCapture ??= () => undefined;
    Element.prototype.releasePointerCapture ??= () => undefined;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setUser(ACCOUNTANT_ID, "accountant", "Contador General");
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy());
    mockFetchEmployees.mockResolvedValue({
      data: [mockEmployee],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    mockFetchEmployee.mockResolvedValue(mockEmployee);
    mockGetWorkbench.mockResolvedValue({
      summary: { pending: 0, draft: 0, approval: 0, payable: 0, closed: 0, open_advances: 3 },
      backlog: [],
    });
    mockListAdvances.mockResolvedValue({
      data: [authorizedAdvance, deliveredAdvance, pendingAdvance],
      pagination: { total: 3, page: 1, limit: 20, totalPages: 1 },
    });
    mockSubmitSettlement.mockResolvedValue({ ...mockSettlementData, status: "pending_approval" });
    mockUpdateSettlement.mockImplementation(
      async (_id: string, payload: { expectedStatus: string }) => ({
        settlement: mockSettlementData,
        approvalEffect: payload.expectedStatus === "approved" ? "reapproval_required" : "none",
        changes: [],
      }),
    );
    mockUpdateAdvance.mockResolvedValue({
      advance: authorizedAdvance,
      approvalEffect: "none",
      changes: [],
    });
    mockCancelAdvance.mockResolvedValue({ ...pendingAdvance, status: "cancelled" });
  });

  it("ST-1: devuelta muestra el motivo; «Corregir y reenviar» corrige y reenvía en un paso", async () => {
    const user = userEvent.setup();
    setUser("user-creator-1", "accountant", "Capturista");
    mockGetSettlementById.mockResolvedValue({
      ...mockSettlementData,
      status: "draft",
      advancesReserved: true,
      submittedBy: "user-creator-1",
      approval: returnedApproval,
    });
    renderDetailWithCreate();

    expect(await screen.findByText(/Falta el bono de puntualidad/)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: flowCopy.returnedAlert.correctAndResubmit }),
    );

    const sheet = await screen.findByRole("dialog", {
      name: flowCopy.sheet.title("LIQ-202608-0001"),
    });
    await user.type(within(sheet).getByLabelText(flowCopy.sheet.notesTitle), " · bono agregado");
    await user.click(within(sheet).getByRole("button", { name: flowCopy.sheet.saveAndResubmit }));

    await waitFor(() => {
      expect(mockUpdateSettlement).toHaveBeenCalledWith(
        "settlement-smoke-1",
        expect.objectContaining({ expectedStatus: "draft" }),
      );
      expect(mockSubmitSettlement).toHaveBeenCalledWith("settlement-smoke-1");
    });
  });

  it("ST-2 + ST-3: autorizada, una penalización de $300 baja el neto; confirma antes/después y «Quedarás como solicitante»", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue(approvedSettlement);
    renderDetailWithCreate();

    await screen.findByText("LIQ-202608-0001");
    await user.click(await screen.findByRole("button", { name: flowCopy.header.correct }));
    const sheet = await screen.findByRole("dialog", {
      name: flowCopy.sheet.title("LIQ-202608-0001"),
    });
    expect(within(sheet).getByTestId("settlement-correction-consequence")).toHaveTextContent(
      flowCopy.sheet.consequence.approved,
    );

    await user.click(within(sheet).getByRole("button", { name: flowCopy.manualItems.add }));
    await user.click(document.getElementById("settlement-correction-item-0-type") as HTMLElement);
    await user.click(
      await screen.findByRole("option", { name: flowCopy.manualItems.types.penalty_deduction }),
    );
    await user.type(
      document.getElementById("settlement-correction-item-0-description") as HTMLElement,
      "Retraso en entrega",
    );
    await user.type(
      document.getElementById("settlement-correction-item-0-amount") as HTMLElement,
      "300",
    );

    const netBefore = formatMxCurrency(3000);
    const netAfter = formatMxCurrency(2700);
    expect(within(sheet).getByTestId("settlement-correction-totals")).toHaveTextContent(
      `Neto ${netBefore} → ${netAfter}`,
    );

    await user.click(within(sheet).getByRole("button", { name: flowCopy.sheet.saveCorrection }));
    const confirm = await screen.findByRole("alertdialog", { name: flowCopy.confirm.title });
    expect(within(confirm).getByText(flowCopy.confirm.netLine(netBefore, netAfter))).toBeInTheDocument();
    expect(within(confirm).getByText(flowCopy.confirm.requesterWarning)).toBeInTheDocument();
    expect(mockUpdateSettlement).not.toHaveBeenCalled();

    await user.click(within(confirm).getByRole("button", { name: flowCopy.confirm.confirm }));
    await waitFor(() => expect(mockUpdateSettlement).toHaveBeenCalledTimes(1));
    const [id, payload] = mockUpdateSettlement.mock.calls[0] as [string, Record<string, unknown>];
    expect(id).toBe("settlement-smoke-1");
    expect(payload.expectedStatus).toBe("approved");
    expect(payload.customItems).toEqual([
      expect.objectContaining({
        itemType: "penalty_deduction",
        description: "Retraso en entrega",
        amount: 300,
      }),
    ]);
  });

  it("ST-3: la penalización guardada aparece en el recibo y el neto ya la descuenta", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...approvedSettlement,
      totalOtherDeductions: 300,
      netAmount: 2700,
      items: [
        ...mockSettlementData.items,
        {
          id: "item-penalty",
          settlementId: "settlement-smoke-1",
          itemType: "penalty_deduction",
          tripId: null,
          tripExpenseId: null,
          advanceId: null,
          description: "Retraso en entrega",
          quantity: 1,
          unitRate: 300,
          amount: 300,
          isDeduction: true,
          createdAt: "2026-08-16T12:00:00Z",
        },
      ],
    });
    renderDetailWithCreate();

    await screen.findByText("LIQ-202608-0001");
    await user.click(screen.getByRole("button", { name: flowCopy.header.printReceipt }));

    const deductionsTable = screen
      .getByText(/2\. Descuentos \(−\)/i)
      .parentElement?.querySelector("table");
    expect(deductionsTable?.textContent).toContain(`-${formatMxCurrency(300)}`);
    expect(screen.getAllByText(formatMxCurrency(2700)).length).toBeGreaterThanOrEqual(1);
  });

  it("ST-4: 409 APPROVAL_REVISION_CHANGED al registrar el pago avisa y no registra", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue(approvedSettlement);
    mockDisburseSettlement.mockRejectedValue(
      new ApiError("revision changed", 409, "APPROVAL_REVISION_CHANGED"),
    );
    renderDetailWithCreate();

    await screen.findByText("LIQ-202608-0001");
    await user.click(
      await screen.findByRole("button", { name: "Registrar pago al operador" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/referencia bancaria/i), "SPEI-1");
    await user.click(within(dialog).getByRole("button", { name: /confirmar pago realizado/i }));

    expect(
      await within(dialog).findByText(flowCopy.disburse.revisionChangedTitle),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(flowCopy.disburse.revisionChanged)).toBeInTheDocument();
    expect(mockDisburseSettlement).toHaveBeenCalledTimes(1);
    expect(mockDisburseSettlement.mock.calls[0][0]).toBe("settlement-smoke-1");
    expect(mockDisburseSettlement.mock.calls[0][2]).toBe("rev-1");
    expect(
      within(dialog).getByRole("button", { name: /confirmar pago realizado/i }),
    ).toBeDisabled();
  });

  it("ST-5a: editar el monto de un anticipo autorizado pide confirmación con antes/después", async () => {
    const user = userEvent.setup();
    renderAdvancesPage();

    const menu = await openAdvanceMenu(user, "ANT-AUTH-001");
    await user.click(within(menu).getByText(advanceFlow.menu.edit));
    const sheet = await screen.findByRole("dialog", {
      name: advanceFlow.editSheet.title("ANT-AUTH-001"),
    });
    const amount = within(sheet).getByLabelText(/monto/i);
    await user.clear(amount);
    await user.type(amount, "12000");
    await user.click(within(sheet).getByRole("button", { name: advanceFlow.editSheet.save }));

    const confirm = await screen.findByRole("alertdialog");
    expect(within(confirm).getByText(/Monto: \$8,000\.00 → \$12,000\.00/)).toBeInTheDocument();
    expect(within(confirm).getByText(advanceFlow.confirmMaterial.requesterWarning)).toBeInTheDocument();
    expect(mockUpdateAdvance).not.toHaveBeenCalled();

    await user.click(
      within(confirm).getByRole("button", { name: advanceFlow.confirmMaterial.confirm }),
    );
    await waitFor(() => {
      expect(mockUpdateAdvance).toHaveBeenCalledWith("adv-auth-1", {
        expectedStatus: "pending_disbursement",
        amount: 12000,
      });
    });
  });

  it("ST-5b: cambiar solo la nota guarda sin diálogo", async () => {
    const user = userEvent.setup();
    renderAdvancesPage();

    const menu = await openAdvanceMenu(user, "ANT-AUTH-001");
    await user.click(within(menu).getByText(advanceFlow.menu.edit));
    const sheet = await screen.findByRole("dialog", {
      name: advanceFlow.editSheet.title("ANT-AUTH-001"),
    });
    await user.type(within(sheet).getByLabelText(/notas/i), " y comida");
    await user.click(within(sheet).getByRole("button", { name: advanceFlow.editSheet.save }));

    await waitFor(() => {
      expect(mockUpdateAdvance).toHaveBeenCalledWith("adv-auth-1", {
        expectedStatus: "pending_disbursement",
        notes: "Casetas y comida",
      });
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("ST-5c: anticipo entregado solo ofrece «Agregar nota…»", async () => {
    const user = userEvent.setup();
    renderAdvancesPage();

    const menu = await openAdvanceMenu(user, "ANT-DELIV-001");
    expect(within(menu).getByText(advanceFlow.menu.addNote)).toBeInTheDocument();
    expect(within(menu).queryByText(advanceFlow.menu.edit)).not.toBeInTheDocument();
    expect(within(menu).queryByText(advanceFlow.menu.cancel)).not.toBeInTheDocument();
    expect(within(menu).queryByText("Registrar entrega / pago")).not.toBeInTheDocument();
  });

  it("ST-5d: cancelar un anticipo pendiente exige motivo", async () => {
    const user = userEvent.setup();
    renderAdvancesPage();

    const menu = await openAdvanceMenu(user, "ANT-PEND-001");
    await user.click(within(menu).getByText(advanceFlow.menu.cancel));
    const dialog = await screen.findByRole("dialog", {
      name: advanceFlow.cancelDialog.title("ANT-PEND-001"),
    });
    await user.click(
      within(dialog).getByRole("button", { name: advanceFlow.cancelDialog.confirm }),
    );
    expect(within(dialog).getByText(advanceFlow.cancelDialog.reasonTooShort)).toBeInTheDocument();
    expect(mockCancelAdvance).not.toHaveBeenCalled();

    await user.type(
      within(dialog).getByLabelText(advanceFlow.cancelDialog.reasonLabel),
      "Viaje cancelado por el cliente",
    );
    await user.click(
      within(dialog).getByRole("button", { name: advanceFlow.cancelDialog.confirm }),
    );
    await waitFor(() => {
      expect(mockCancelAdvance).toHaveBeenCalledWith(
        "adv-pending-1",
        "Viaje cancelado por el cliente",
      );
    });
  });

  it("ST-6: rechazada ofrece crear una nueva con el mismo operador y periodo", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...mockSettlementData,
      status: "rejected",
      rejectionReason: "Montos incorrectos",
    });
    renderDetailWithCreate();

    await user.click(
      await screen.findByRole("button", {
        name: settlementsCopy.detailPage.rejection.reopenDraftBtn,
      }),
    );
    const target = screen.getByTestId("create-probe").textContent ?? "";
    expect(target).toContain("/finance/settlements/new?");
    expect(target).toContain("employeeId=emp-smoke-1");
    expect(target).toContain("periodStart=2026-08-01");
    expect(target).toContain("periodEnd=2026-08-15");
  });
});
