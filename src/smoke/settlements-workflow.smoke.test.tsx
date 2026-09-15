/**
 * Smoke ADR-0085 — Flujo de Liquidaciones y Compensación a Operadores
 *
 * Cubre:
 * 1. Listado con pestañas de Liquidaciones, Anticipos y Esquemas.
 * 2. Cálculo en vivo (Preliquidación preview) y guardado/envío a autorización.
 * 3. Detalle de liquidación con desglose de partidas y autorización / dispersión.
 * 4. Fila enriquecida en bandeja de Aprobaciones para `internal_staff_compensation`.
 * 5. ADR-0087: gobernanza de tarifas legacy (redirect a hub compensación ADR-0089).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettlementsListPage } from "@features/settlements/presentation/pages/SettlementsListPage";
import { SettlementsRegistryPage } from "@features/settlements/presentation/pages/SettlementsRegistryPage";
import { SettlementsAdvancesPage } from "@features/settlements/presentation/pages/SettlementsAdvancesPage";
import { AgreementsLegacyRedirect } from "@features/compensation/presentation/routes/AgreementsLegacyRedirect";
import { SettlementCreatePage } from "@features/settlements/presentation/pages/SettlementCreatePage";
import { SettlementDetailPage } from "@features/settlements/presentation/pages/SettlementDetailPage";
import { ApprovalRowCompensation } from "@features/approvals/presentation/components/ApprovalRowCompensation";
import { ApprovalRowAdvance } from "@features/approvals/presentation/components/ApprovalRowAdvance";
import type { ApprovableItem } from "@features/approvals/domain";

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
} = vi.hoisted(() => ({
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
    getSettings: vi.fn().mockResolvedValue({
      pagosOperadoresGreenfieldV1: false,
      voboThresholdMxn: 5000,
    }),
    updateSettings: vi.fn(),
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
    role: "accountant",
  }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-accountant-1", fullName: "Contador General" },
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

const mockPreviewData = {
  employeeId: "emp-smoke-1",
  employeeName: "Roberto González",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-15",
  agreement: {
    calculationType: "rate_per_km",
    ratePerKm: 3.5,
  },
  eligibleTrips: [
    {
      tripId: "trip-1",
      tripCode: "TRP-101",
      scheduledDeparture: "2026-08-02T08:00:00Z",
      completedAt: "2026-08-03T18:00:00Z",
      originCity: "CDMX",
      destinationCity: "Guadalajara",
      distanceKm: 1000,
      freightRevenue: 28000,
      calculatedCommission: 3500,
      approvedReimbursableExpenses: 500,
    },
  ],
  openAdvances: [
    {
      advanceId: "adv-1",
      folio: "ANT-001",
      amount: 1500,
      balanceRemaining: 1000,
      category: "travel_advance",
      disbursedAt: "2026-08-01T10:00:00Z",
    },
  ],
  summary: {
    totalCommissions: 3500,
    totalBaseSalary: 0,
    totalReimbursements: 500,
    suggestedAdvanceDeduction: 1000,
    grossAmount: 4000,
    netAmount: 3000,
  },
};

describe("Smoke ADR-0085: Settlements Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(screen.getByText("+ Total Percepciones")).toBeInTheDocument();
    expect(screen.getAllByText("$3,500.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("-$1,000.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Comisión por viaje")).toBeInTheDocument();
    expect(screen.getByText("Deducción de anticipo")).toBeInTheDocument();

    // Botones de acción para autorizar
    const authorizeBtn = screen.getByRole("button", { name: /Autorizar/i });
    expect(authorizeBtn).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rechazar/i })).toBeInTheDocument();

    // Confirmar que al hacer click en Autorizar se abre el AlertDialog de confirmación
    await user.click(authorizeBtn);
    expect(screen.getByRole("heading", { name: /¿Autorizar liquidación\?/i })).toBeInTheDocument();
    const confirmActionBtn = screen.getByRole("button", { name: /Sí, autorizar liquidación/i });
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

    // Abrir modal de vista previa imprimible
    const printReceiptBtn = screen.getByRole("button", { name: /Imprimir recibo/i });
    expect(printReceiptBtn).toBeInTheDocument();
    await user.click(printReceiptBtn);

    // Verificar que el diálogo de vista previa está abierto y la clase activa está en body
    expect(
      screen.getByRole("heading", { name: /Recibo de Liquidación Imprimible/i }),
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
    expect(iframe?.srcdoc).toContain("Liquidación de Viajes y Pago a Operador");
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
    expect(screen.getByText(/Anticipos -/)).toBeInTheDocument();
    expect(screen.getByText("$3,000.00")).toBeInTheDocument();
  });

  it("5. Enlace de workbench abre esquemas de compensación (ADR-0089)", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements"]}>
          <Routes>
            <Route path="/finance/settlements" element={<SettlementsListPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /Configurar tarifas/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Configurar tarifas/i })).toHaveAttribute(
      "href",
      "/finance/agreements",
    );
  });

  it("6. Renderiza el dialog de registrar anticipo con componente MoneyInput", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/advances"]}>
          <Routes>
            <Route
              path="/finance/settlements/advances"
              element={<SettlementsAdvancesPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Anticipos pendientes/i }),
      ).toBeInTheDocument();
    });

    // Click en Registrar anticipo
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
    expect(filename).toMatch(/^liquidaciones-\d{4}-\d{2}-\d{2}\.csv$/);
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

    const printBtn = screen.getByRole("button", { name: /Imprimir recibo/i });
    expect(printBtn).toBeInTheDocument();

    await user.click(printBtn);

    expect(screen.getByText("Recibo de Liquidación Imprimible")).toBeInTheDocument();
    expect(screen.getByText("Liquidación de Viajes y Pago a Operador")).toBeInTheDocument();
    expect(screen.getByText("Firma de Conformidad del Operador")).toBeInTheDocument();
    expect(screen.getByText("Revisado y Autorizado / Empresa")).toBeInTheDocument();
  });

  it("9. ADR-0089: redirige tab legacy agreements al hub de plantillas", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements?tab=agreements"]}>
          <Routes>
            <Route path="/finance/settlements" element={<SettlementsListPage />} />
            <Route
              path="/finance/compensation/templates"
              element={<div>compensation-templates-hub</div>}
            />
          </Routes>
        </MemoryRouter>
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
});
