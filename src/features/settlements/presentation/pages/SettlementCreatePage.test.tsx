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
    employee_number: "001",
    first_name: "Pedro",
    last_name: "Infante",
    full_name: "Pedro Infante",
    salary_type: "weekly",
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
      operationalOutcome: "standard",
      hasRevenueSplit: true,
      distanceBasis: "odometer",
      requiresZeroKmAck: false,
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
      operationalOutcome: "false_trip",
      hasRevenueSplit: false,
      distanceBasis: "unavailable",
      requiresZeroKmAck: false,
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
      voboThresholdMxn: 0,
      activeApproverCount: 2,
      activeExecutorCount: 2,
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
    expect(screen.getByText("Nuevo pago a operador")).toBeInTheDocument();
    expect(screen.getByText(/Tarifa de pago activa:/i)).toBeInTheDocument();
    expect(screen.getByText(/Sueldo base semanal de \$3,500\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/15% de comisión sobre flete/i)).toBeInTheDocument();

    // Validar tabla de viajes (columnas compactas por defecto)
    expect(screen.getByText("Monterrey → CDMX")).toBeInTheDocument();
    expect(screen.getByText("Monterrey → Apodaca")).toBeInTheDocument();
    expect(screen.getByText("Foráneo")).toBeInTheDocument();
    expect(screen.getByText("Local")).toBeInTheDocument();
    expect(screen.getByText("Prorrateo")).toBeInTheDocument();
    expect(screen.getByText("Viaje en falso")).toBeInTheDocument();
    expect(screen.queryByText("Movimiento local")).not.toBeInTheDocument();
    expect(screen.getAllByText("$4,500.00").length).toBeGreaterThanOrEqual(1);

    const tripLink = screen.getByRole("link", { name: "VIA-100" });
    expect(tripLink).toHaveAttribute("href", "/trips/trip-1");

    await user.click(screen.getByRole("button", { name: /Ver detalle de cálculo/i }));
    // Viaje Local matchea regla Local (cubierto por sueldo, comisión 0)
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

    // F1 tres bolsillos: franja de teaching bajo el resumen
    const channelsTeaching = screen.getByLabelText(/Tres canales del pago a operadores/i);
    expect(channelsTeaching).toHaveTextContent(/Gasto del viaje/i);
    expect(channelsTeaching).toHaveTextContent(/Anticipo/i);
    expect(channelsTeaching).toHaveTextContent(/Pago fijo de tarifa/i);

    // Abrir diálogo mínimo de confirmación
    const submitBtn = screen.getByRole("button", { name: /Enviar a autorización/i });
    await user.click(submitBtn);

    expect(screen.getByRole("heading", { name: /¿Enviar a autorización?/i })).toBeInTheDocument();
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

  it("limpia las deducciones de anticipos seleccionadas al cambiar el periodo (stepper)", async () => {
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

    // Navegar al período siguiente vía PeriodStepper
    const nextBtn = screen.getByRole("button", { name: /Período siguiente/i });
    expect(nextBtn).toBeInTheDocument();
    await user.click(nextBtn);

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
      expect(screen.getByText(/Sin tarifa asignada/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Tarifa de pago activa:/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir a Tarifas/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Configurar sueldo en empleado/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Abrir ficha del empleado/i }),
    ).not.toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Enviar a autorización/i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByRole("button", { name: /Guardar borrador/i })).toBeDisabled();
  });

  it("en tarifa incompleta muestra Completar tarifa y sueldo en empleado", async () => {
    mockPreviewSettlement.mockResolvedValue({
      ...mockPreview,
      agreement: {
        ...mockPreview.agreement,
        hasFixedSalary: false,
        fixedSalaryAmount: 0,
        fixedSalaryPeriod: "none",
        calculationType: "salary_only",
        rules: [],
      },
      summary: {
        ...mockPreview.summary,
        totalCommissions: 0,
        totalBaseSalary: 0,
        totalFixedAllowances: 0,
        grossAmount: 0,
        netAmount: 0,
      },
      fixedAllowances: [],
      eligibleTrips: [],
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
      expect(screen.getByText(/Tarifa incompleta/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: /Completar tarifa/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Configurar sueldo en empleado/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Abrir ficha del empleado/i }),
    ).not.toBeInTheDocument();
  });

  it("bloquea Enviar a autorización si hay viajes por km sin distancia hasta ack", async () => {
    const user = userEvent.setup();
    mockPreviewSettlement.mockResolvedValue({
      ...mockPreview,
      eligibleTrips: [
        {
          ...mockPreview.eligibleTrips[0],
          tripCode: "TRP-ZERO",
          distanceKm: 0,
          calculatedCommission: 0,
          distanceBasis: "unavailable",
          requiresZeroKmAck: true,
          operationalOutcome: "false_trip",
          hasRevenueSplit: false,
          appliedRule: "Tarifa por km ($3/km)",
        },
      ],
      summary: {
        ...mockPreview.summary,
        totalCommissions: 0,
        grossAmount: 3800,
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
      expect(screen.getByText(/Viajes sin distancia usable/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Enviar a autorización/i });
    expect(submitBtn).toBeDisabled();
    expect(
      screen.getByText(/No se puede enviar: hay viajes por km sin distancia/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", { name: /Confirmo pago en \$0 en 1 viaje/i }),
    );
    expect(submitBtn).toBeEnabled();
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

    expect(screen.getByRole("link", { name: /Revisar tarifas/i })).toBeInTheDocument();
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
      expect(screen.getByText(/Tarifa Operador foráneo/i)).toBeInTheDocument();
    });

    const corridorBadge = screen.getByText("Corredor");
    expect(corridorBadge).toBeInTheDocument();
    expect(corridorBadge).toHaveAttribute("title", expect.stringContaining("MTY-CDMX"));
    expect(corridorBadge).toHaveAttribute("title", expect.stringContaining("$4,500.00"));
    expect(screen.getByText(/Prestaciones fijas \(semanal\)/i)).toBeInTheDocument();
    expect(screen.getAllByText("$1,200.00").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra badge Varios operadores cuando participantCount > 1 y no el % del total", async () => {
    mockPreviewSettlement.mockResolvedValue({
      ...mockPreview,
      eligibleTrips: [
        {
          ...mockPreview.eligibleTrips[0],
          participantCount: 2,
          midTripShareRatio: 0.4,
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
      expect(screen.getByText("VIA-100")).toBeInTheDocument();
    });

    const multiOpsBadge = screen.getByText("Varios operadores");
    expect(multiOpsBadge).toBeInTheDocument();
    expect(multiOpsBadge).toHaveAttribute(
      "title",
      "Participaron varios operadores. Cada uno recibe el 100 % de la comisión según su regla.",
    );
    expect(screen.queryByText(/% del total/i)).not.toBeInTheDocument();
  });

  it("con neto sobre umbral muestra Enviar a autorización (no Registrar pago)", async () => {
    mockGetSettings.mockResolvedValue({
      voboThresholdMxn: 5000,
      activeApproverCount: 2,
      activeExecutorCount: 2,
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

    expect(screen.getByRole("button", { name: /Enviar a autorización/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Enviar para autorización/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("con neto bajo umbral solo ofrece Guardar borrador", async () => {
    mockGetSettings.mockResolvedValue({
      voboThresholdMxn: 5000,
      activeApproverCount: 2,
      activeExecutorCount: 2,
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

    expect(screen.queryByRole("button", { name: /Enviar a autorización/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/se guarda en borrador/i)).toBeInTheDocument();
  });

  it("criterio 4 (D24): un bono manual en el alta suma al neto y manda a autorización", async () => {
    const user = userEvent.setup();
    mockGetSettings.mockResolvedValue({
      voboThresholdMxn: 5000,
      activeApproverCount: 2,
      activeExecutorCount: 2,
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
    expect(screen.queryByRole("button", { name: /Enviar a autorización/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Agregar partida/i }));

    // Con una partida manual siempre pide autorización (aunque el neto quede bajo el umbral).
    const submitBtn = await screen.findByRole("button", { name: /Enviar a autorización/i });
    expect(screen.getByTestId("create-manual-items-hint")).toHaveTextContent(
      "Las correcciones manuales siempre piden autorización.",
    );

    // Validación al enviar: sin descripción ni monto no abre la confirmación.
    await user.click(submitBtn);
    expect(screen.getByText("Revisa los campos marcados")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /¿Enviar a autorización?/i })).not.toBeInTheDocument();

    await user.type(
      document.getElementById("settlement-create-item-0-description") as HTMLElement,
      "Bono de puntualidad",
    );
    await user.type(
      document.getElementById("settlement-create-item-0-amount") as HTMLElement,
      "500",
    );

    expect(screen.getByTestId("create-manual-additions")).toHaveTextContent("$500.00");
    expect(screen.getAllByText("$1,300.00").length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByRole("button", { name: /Enviar a autorización/i }));
    expect(screen.getByRole("heading", { name: /¿Enviar a autorización?/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Confirmar y enviar/i }));

    await waitFor(() => expect(mockCreateSettlement).toHaveBeenCalledTimes(1));
    expect(mockCreateSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        submitForApproval: true,
        customItems: [
          { itemType: "bonus", description: "Bono de puntualidad", amount: 500 },
        ],
      }),
    );
  });
});
