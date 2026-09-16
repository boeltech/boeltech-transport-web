import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettlementCreatePage } from "./SettlementCreatePage";

const {
  mockPreviewSettlement,
  mockCreateSettlement,
  mockFetchEmployees,
  mockListAssignments,
  mockGetSettings,
} = vi.hoisted(() => ({
  mockPreviewSettlement: vi.fn(),
  mockCreateSettlement: vi.fn(),
  mockFetchEmployees: vi.fn(),
  mockListAssignments: vi.fn(),
  mockGetSettings: vi.fn(),
}));

vi.mock("@features/settlements/infrastructure/settlementsApi", () => ({
  settlementsApi: {
    previewSettlement: (...args: unknown[]) => mockPreviewSettlement(...args),
    createSettlement: (...args: unknown[]) => mockCreateSettlement(...args),
    listAgreements: vi.fn(),
    updateAgreement: vi.fn(),
    createAgreement: vi.fn(),
    getSettings: (...args: unknown[]) => mockGetSettings(...args),
    updateSettings: vi.fn(),
  },
}));

vi.mock("@features/compensation/infrastructure/compensationApi", () => ({
  compensationApi: {
    listAssignments: (...args: unknown[]) => mockListAssignments(...args),
  },
}));

vi.mock("@features/employees/infrastructure/employeeRepository", () => ({
  fetchEmployees: (...args: unknown[]) => mockFetchEmployees(...args),
  getEmployeeBasic: vi.fn().mockResolvedValue({
    id: "emp-1",
    employeeNumber: "001",
    firstName: "Pedro",
    lastName: "Infante",
    fullName: "Pedro Infante",
  }),
}));

vi.mock("@features/notifications/infrastructure/notificationsApi", () => ({
  notificationsApi: {
    getUnreadCount: vi.fn().mockResolvedValue(0),
  },
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
  id: "emp-1",
  tenantId: "tenant-1",
  employeeNumber: "001",
  firstName: "Pedro",
  lastName: "Infante",
  role: "primary_driver",
  isActive: true,
};

const mockPreview = {
  employeeId: "emp-1",
  employeeName: "Pedro Infante",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-15",
  agreement: {
    calculationType: "percentage_of_freight",
    percentageRate: 15,
    hasFixedSalary: true,
    fixedSalaryAmount: 3500,
    fixedSalaryPeriod: "weekly",
    rules: [],
  },
  template: {
    id: "tpl-default",
    name: "Operador estándar",
    assignmentId: "assign-default",
  },
  eligibleTrips: [
    {
      tripId: "trip-1",
      tripCode: "VIA-100",
      routeType: "long_haul",
      scheduledDeparture: "2026-08-02T08:00:00Z",
      completedAt: "2026-08-03T18:00:00Z",
      originCity: "Monterrey",
      destinationCity: "CDMX",
      distanceKm: 950,
      freightRevenue: 30000,
      calculatedCommission: 4500,
      approvedReimbursableExpenses: 300,
    },
    {
      tripId: "trip-2",
      tripCode: "VIA-101",
      routeType: "local",
      scheduledDeparture: "2026-08-04T08:00:00Z",
      completedAt: "2026-08-04T12:00:00Z",
      originCity: "Monterrey",
      destinationCity: "Apodaca",
      distanceKm: 40,
      freightRevenue: 5000,
      calculatedCommission: 0,
      approvedReimbursableExpenses: 0,
      appliedRule: "Cubierto por sueldo base",
    },
  ],
  openAdvances: [
    {
      advanceId: "adv-1",
      folio: "ANT-10",
      amount: 2000,
      balanceRemaining: 2000,
      category: "travel_advance",
      disbursedAt: "2026-08-01T10:00:00Z",
    },
    {
      advanceId: "adv-2",
      folio: "ANT-11",
      amount: 1000,
      balanceRemaining: 1000,
      category: "toll_expense",
      disbursedAt: "2026-08-02T10:00:00Z",
    },
  ],
  summary: {
    totalCommissions: 4500,
    totalBaseSalary: 3500,
    totalReimbursements: 300,
    suggestedAdvanceDeduction: 3000,
    grossAmount: 8300,
    netAmount: 5300,
  },
};

describe("SettlementCreatePage Component", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
    mockFetchEmployees.mockResolvedValue({
      data: [mockEmployee],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    mockPreviewSettlement.mockResolvedValue(mockPreview);
    mockCreateSettlement.mockResolvedValue({ id: "settlement-new-1" });
    mockListAssignments.mockResolvedValue({ data: [], pagination: { total: 0, page: 1, pageSize: 100, totalPages: 0 } });
    mockGetSettings.mockResolvedValue({
      pagosOperadoresGreenfieldV1: false,
      voboThresholdMxn: 5000,
    });
  });

  it("renderiza el formulario inicial y carga el cálculo del pago cuando hay empleado seleccionado", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("VIA-100")).toBeInTheDocument();
    });

    // Validar encabezado y resumen de acuerdo activo
    expect(screen.getByText("Nueva liquidación a operador")).toBeInTheDocument();
    expect(screen.getByText(/Acuerdo de pago activo:/i)).toBeInTheDocument();
    expect(screen.getByText(/Sueldo base semanal de \$3,500\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/15% de comisión sobre flete/i)).toBeInTheDocument();

    // Validar tabla de viajes (columnas compactas por defecto)
    expect(screen.getByText("Monterrey → CDMX")).toBeInTheDocument();
    expect(screen.getByText("Monterrey → Apodaca")).toBeInTheDocument();
    expect(screen.getAllByText("$4,500.00").length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole("button", { name: /Ver detalle de cálculo/i }));
    expect(screen.getByText("Cubierto por sueldo base")).toBeInTheDocument();

    // Validar anticipos y acciones rápidas
    expect(screen.getByText("ANT-10")).toBeInTheDocument();
    expect(screen.getByText("ANT-11")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Descontar todo/i })).toBeInTheDocument();

    // Click en Descontar todo
    await user.click(screen.getByRole("button", { name: /Descontar todo/i }));

    // Validar que se actualiza el resumen reactivo (neto como héroe)
    expect(screen.getByText("Resumen a pagar")).toBeInTheDocument();
    expect(screen.getAllByText("$8,300.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("-$3,000.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$5,300.00").length).toBeGreaterThanOrEqual(1);

    // Abrir diálogo mínimo de confirmación
    const submitBtn = screen.getByRole("button", { name: /Enviar para autorización/i });
    await user.click(submitBtn);

    expect(screen.getByRole("heading", { name: /¿Confirmar y enviar\?/i })).toBeInTheDocument();
    expect(screen.getAllByText(/^A pagar$/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Percepciones brutas:/i)).not.toBeInTheDocument();

    // Confirmar envío
    const confirmActionBtn = screen.getByRole("button", { name: /Confirmar y enviar/i });
    await user.click(confirmActionBtn);

    expect(mockCreateSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: "emp-1",
        submitForApproval: true,
        tripIds: ["trip-1", "trip-2"],
        advancesToApply: expect.arrayContaining([
          { advanceId: "adv-1", amountToDeduct: 2000 },
          { advanceId: "adv-2", amountToDeduct: 1000 },
        ]),
      }),
    );
  });

  it("limpia las deducciones de anticipos seleccionadas al cambiar el periodo", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("ANT-10")).toBeInTheDocument();
    });

    // Seleccionar todos los anticipos
    await user.click(screen.getByRole("button", { name: /Descontar todo/i }));
    expect(screen.getAllByText("-$3,000.00").length).toBeGreaterThanOrEqual(1);

    // Cambiar la fecha de fin de periodo seleccionando un día en el calendario de DateField
    const periodEndBtn = document.getElementById("create-end");
    expect(periodEndBtn).toBeInTheDocument();
    await user.click(periodEndBtn!);

    // Seleccionar día 20 en el Popover de DateField
    await user.click(screen.getByRole("button", { name: "20" }));

    // Las deducciones deben haberse limpiado
    expect(screen.getAllByText("$0.00").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra alerta y bloquea envío cuando no hay esquema de compensación (cutover ADR-0089)", async () => {
    mockPreviewSettlement.mockResolvedValue({
      ...mockPreview,
      template: undefined,
      agreement: {
        hasFixedSalary: false,
        fixedSalaryAmount: 0,
        fixedSalaryPeriod: "none",
        calculationType: "salary_only",
        rules: [],
        baseRate: 15000,
        currency: "MXN",
      },
      summary: {
        ...mockPreview.summary,
        totalCommissions: 0,
        totalBaseSalary: 0,
        totalReimbursements: 4523.14,
        grossAmount: 4523.14,
        netAmount: 4523.14,
      },
      eligibleTrips: mockPreview.eligibleTrips.map((t) => ({
        ...t,
        calculatedCommission: 0,
        appliedRule: "Solo sueldo base",
        approvedReimbursableExpenses:
          t.tripId === "trip-1" ? 4523.14 : 0,
      })),
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Sin esquema de compensación/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Acuerdo de pago activo:/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir a esquemas de compensación/i }),
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Enviar para autorización/i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByRole("button", { name: /Guardar borrador/i })).toBeDisabled();
  });

  it("muestra alerta de ambigüedad cuando hay varias asignaciones elegibles en la fecha fin", async () => {
    mockListAssignments.mockResolvedValue({
      data: [
        {
          id: "assign-a",
          employeeId: "emp-1",
          templateId: "tpl-a",
          effectiveFrom: "2026-07-01",
          effectiveTo: null,
          isActive: true,
          createdAt: "2026-07-01T00:00:00Z",
        },
        {
          id: "assign-b",
          employeeId: "emp-1",
          templateId: "tpl-b",
          effectiveFrom: "2026-08-01",
          effectiveTo: null,
          isActive: true,
          createdAt: "2026-08-01T00:00:00Z",
        },
      ],
      pagination: { total: 2, page: 1, pageSize: 100, totalPages: 1 },
    });
    mockPreviewSettlement.mockResolvedValue({
      ...mockPreview,
      template: {
        id: "tpl-b",
        name: "Plantilla B",
        assignmentId: "assign-b",
      },
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Varias asignaciones vigentes en la fecha fin del período/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Revisar esquemas de compensación/i })).toBeInTheDocument();
  });

  it("muestra plantilla activa y badge de corredor en viajes (ADR-0089)", async () => {
    mockPreviewSettlement.mockResolvedValue({
      ...mockPreview,
      template: {
        id: "tpl-1",
        name: "Operador foráneo",
        assignmentId: "assign-1",
      },
      summary: {
        ...mockPreview.summary,
        totalFixedAllowances: 1200,
        grossAmount: 9500,
        netAmount: 6500,
      },
      eligibleTrips: [
        {
          ...mockPreview.eligibleTrips[0],
          corridorMatch: {
            corridorId: "cor-1",
            name: "MTY-CDMX",
            fixedAmount: 4500,
            replacesKmCommission: true,
          },
        },
        mockPreview.eligibleTrips[1],
      ],
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Esquema Operador foráneo/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Corredor: MTY-CDMX/i)).toBeInTheDocument();
    expect(screen.getByText(/Prestaciones fijas/i)).toBeInTheDocument();
    expect(screen.getAllByText("$1,200.00").length).toBeGreaterThanOrEqual(1);
  });

  it("con flag greenfield ON y neto sobre umbral muestra Pedir VoBo (no Registrar pago)", async () => {
    mockGetSettings.mockResolvedValue({
      pagosOperadoresGreenfieldV1: true,
      voboThresholdMxn: 5000,
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("VIA-100")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Pedir VoBo/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Enviar para autorización/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("con flag greenfield ON y neto bajo umbral solo ofrece Guardar borrador", async () => {
    mockGetSettings.mockResolvedValue({
      pagosOperadoresGreenfieldV1: true,
      voboThresholdMxn: 5000,
    });
    mockPreviewSettlement.mockResolvedValue({
      ...mockPreview,
      eligibleTrips: [
        {
          ...mockPreview.eligibleTrips[1],
          calculatedCommission: 0,
          approvedReimbursableExpenses: 0,
        },
      ],
      openAdvances: [],
      summary: {
        totalCommissions: 0,
        totalBaseSalary: 800,
        totalReimbursements: 0,
        suggestedAdvanceDeduction: 0,
        grossAmount: 800,
        netAmount: 800,
      },
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Guardar borrador/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /Pedir VoBo/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/se guarda en borrador/i)).toBeInTheDocument();
  });
});
