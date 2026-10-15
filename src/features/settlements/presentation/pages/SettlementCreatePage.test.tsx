import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettlementCreatePage } from "./SettlementCreatePage";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { settlementsCopy } from "../copy/settlementsCopy";
import type {
  SettlementTemplateChange,
  SettlementTemplateSuperseded,
  TemplatePeriodAssignmentRef,
} from "../../domain/entities";

const {
  mockPreviewSettlement,
  mockCreateSettlement,
  mockFetchEmployees,
  mockListAssignments,
  mockGetSettings,
  mockToast,
  mockPreviewReimbursement,
} = vi.hoisted(() => ({
  mockPreviewReimbursement: vi.fn(),
  mockPreviewSettlement: vi.fn(),
  mockCreateSettlement: vi.fn(),
  mockFetchEmployees: vi.fn(),
  mockListAssignments: vi.fn(),
  mockGetSettings: vi.fn(),
  mockToast: vi.fn(),
}));

vi.mock("@features/settlements/infrastructure/settlementsApi", () => ({
  settlementsApi: {
    previewSettlement: (...args: unknown[]) => mockPreviewSettlement(...args),
    previewReimbursementSettlement: (...args: unknown[]) => mockPreviewReimbursement(...args),
    createSettlement: (...args: unknown[]) => mockCreateSettlement(...args),
    listAgreements: vi.fn(),
    updateAgreement: vi.fn(),
    createAgreement: vi.fn(),
    getSettings: (...args: unknown[]) => mockGetSettings(...args),
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
    useToast: () => ({ toast: mockToast }),
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
    mockPreviewReimbursement.mockResolvedValue({
      ...mockPreview,
      settlementKind: "reimbursement_only",
      reimbursements: [],
      reimbursementsRequiringPayee: [],
    });
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
    expect(screen.getByText("Armar pago")).toBeInTheDocument();
    expect(screen.getByText("Tarifa de pago aplicada:")).toBeInTheDocument();
    expect(screen.getByText(/^Operador estándar — /)).toBeInTheDocument();
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
    const channelsTeaching = screen.getByLabelText(/Tres bolsillos del pago a operadores/i);
    expect(channelsTeaching).toHaveTextContent(/Gasto del viaje/i);
    expect(channelsTeaching).toHaveTextContent(/Costos/i);
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

  it("E11-F3: muestra reembolsos tardíos y por definir; el marcado viaja como confirmado y no hay opt-in", async () => {
    const user = userEvent.setup();
    mockPreviewSettlement.mockResolvedValue({
      ...mockPreview,
      reimbursements: [
        {
          tripExpenseId: "exp-late",
          tripId: "trip-old",
          tripCode: "VIA-090",
          category: "tolls",
          description: "Caseta",
          amount: 180,
          receiptNumber: null,
          approvedAt: "2026-08-10T10:00:00Z",
          isLate: true,
          tripSettledIn: { settlementId: "stl-prev", settlementNumber: "LIQ-202607-0009" },
        },
      ],
      reimbursementsRequiringPayee: [
        {
          tripExpenseId: "exp-payee",
          tripId: "trip-swap",
          tripCode: "VIA-095",
          category: "fuel",
          description: "Diésel",
          amount: 250,
          approvedAt: "2026-08-11T10:00:00Z",
          reason: "driver_reassigned",
          tripSettledIn: null,
        },
      ],
    });

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const lateCard = await screen.findByTestId("late-reimbursements-card");
    expect(within(lateCard).getByText("VIA-090")).toBeInTheDocument();
    expect(within(lateCard).getByText("Viaje VIA-090 · comisión en LIQ-202607-0009")).toBeInTheDocument();
    const payeeCard = screen.getByTestId("reimbursements-payee-card");
    expect(within(payeeCard).getByText("VIA-095")).toBeInTheDocument();
    expect(screen.queryByText(/Registrar solo reembolsos y anticipos/i)).not.toBeInTheDocument();

    await user.click(within(payeeCard).getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Enviar a autorización/i }));
    await user.click(screen.getByRole("button", { name: /Confirmar y enviar/i }));

    await waitFor(() =>
      expect(mockCreateSettlement).toHaveBeenCalledWith(
        expect.objectContaining({ confirmedReimbursementExpenseIds: ["exp-payee"] }),
      ),
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

    expect(screen.queryByText(/Tarifa de pago aplicada:/i)).not.toBeInTheDocument();
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
      expect(screen.getByText("Viajes con datos faltantes")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Enviar a autorización/i });
    expect(submitBtn).toBeDisabled();
    expect(
      screen.getByText(/No se puede enviar: confirma los viajes con datos faltantes/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", {
        name: /Confirmo enviar 1 viaje\(s\) con datos faltantes/i,
      }),
    );
    expect(submitBtn).toBeEnabled();
  });

  describe("E11.2 / ADR-0086 D1 — datos faltantes y mínimo garantizado", () => {
    const tripWithGap = (overrides: Record<string, unknown>) => ({
      ...mockPreview.eligibleTrips[0],
      hasRevenueSplit: false,
      operationalOutcome: "standard",
      requiresZeroKmAck: false,
      requiresZeroFreightAck: false,
      ...overrides,
    });

    const renderPage = () =>
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
            <SettlementCreatePage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

    it("un solo checkbox para 0 km y flete en $0; al enviar manda los dos flags", async () => {
      const user = userEvent.setup();
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          tripWithGap({
            tripId: "trip-km",
            tripCode: "TRP-KM",
            distanceKm: 0,
            distanceBasis: "unavailable",
            calculatedCommission: 400,
            requiresZeroKmAck: true,
            calculationGap: "zero_km",
            commissionBeforeMinimum: 0,
            minimumGuaranteedAmount: 400,
            minimumGuaranteedApplied: true,
          }),
          tripWithGap({
            tripId: "trip-flete",
            tripCode: "TRP-FLETE",
            freightRevenue: 0,
            calculatedCommission: 0,
            requiresZeroFreightAck: true,
            calculationGap: "zero_freight",
            zeroCommissionReason: "zero_freight",
            commissionBeforeMinimum: 0,
            minimumGuaranteedAmount: 0,
            minimumGuaranteedApplied: false,
          }),
        ],
      });
      renderPage();

      const gate = await screen.findByTestId("missing-data-gate");
      expect(gate).toHaveTextContent(
        "Hay 2 viaje(s) sin km usable o con flete en $0. Se pagará el mínimo garantizado de su regla (o $0 si no tiene).",
      );
      expect(screen.getAllByRole("checkbox", { name: /con datos faltantes/i })).toHaveLength(1);
      const freightBadge = screen.getByText("Sin flete");
      expect(freightBadge).toHaveAttribute(
        "title",
        "El viaje no tiene flete capturado y la regla es por porcentaje.",
      );

      const submitBtn = screen.getByRole("button", { name: /Enviar a autorización/i });
      expect(submitBtn).toBeDisabled();
      await user.click(
        screen.getByRole("checkbox", {
          name: /Confirmo enviar 2 viaje\(s\) con datos faltantes/i,
        }),
      );
      await user.click(submitBtn);
      await user.click(screen.getByRole("button", { name: /Confirmar y enviar/i }));

      await waitFor(() =>
        expect(mockCreateSettlement).toHaveBeenCalledWith(
          expect.objectContaining({
            submitForApproval: true,
            acknowledgeZeroKmTrips: true,
            acknowledgeZeroFreightTrips: true,
          }),
        ),
      );
    });

    it("solo flete en $0 también exige confirmación y manda ambos flags", async () => {
      const user = userEvent.setup();
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          tripWithGap({
            tripCode: "TRP-FLETE",
            freightRevenue: 0,
            calculatedCommission: 350,
            requiresZeroFreightAck: true,
            calculationGap: "zero_freight",
            commissionBeforeMinimum: 0,
            minimumGuaranteedAmount: 350,
            minimumGuaranteedApplied: true,
          }),
        ],
      });
      renderPage();

      await screen.findByTestId("missing-data-gate");
      const submitBtn = screen.getByRole("button", { name: /Enviar a autorización/i });
      expect(submitBtn).toBeDisabled();
      await user.click(
        screen.getByRole("checkbox", {
          name: /Confirmo enviar 1 viaje\(s\) con datos faltantes/i,
        }),
      );
      await user.click(submitBtn);
      await user.click(screen.getByRole("button", { name: /Confirmar y enviar/i }));

      await waitFor(() =>
        expect(mockCreateSettlement).toHaveBeenCalledWith(
          expect.objectContaining({
            acknowledgeZeroKmTrips: true,
            acknowledgeZeroFreightTrips: true,
          }),
        ),
      );
    });

    it("borrador con datos faltantes no manda confirmaciones", async () => {
      const user = userEvent.setup();
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          tripWithGap({
            freightRevenue: 0,
            calculatedCommission: 0,
            requiresZeroFreightAck: true,
            zeroCommissionReason: "zero_freight",
          }),
        ],
      });
      renderPage();

      await screen.findByTestId("missing-data-gate");
      await user.click(screen.getByRole("button", { name: /Guardar borrador/i }));

      await waitFor(() =>
        expect(mockCreateSettlement).toHaveBeenCalledWith(
          expect.objectContaining({
            submitForApproval: false,
            acknowledgeZeroKmTrips: false,
            acknowledgeZeroFreightTrips: false,
          }),
        ),
      );
    });

    it("el aviso lista los códigos con el dato que falta (hasta 5 y «y N más»)", async () => {
      const kmTrips = Array.from({ length: 5 }, (_, i) =>
        tripWithGap({
          tripId: `trip-km-${i}`,
          tripCode: `TRP-KM${i}`,
          distanceKm: 0,
          distanceBasis: "unavailable",
          calculatedCommission: 0,
          requiresZeroKmAck: true,
          calculationGap: "zero_km",
          zeroCommissionReason: "zero_km",
        }),
      );
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          tripWithGap({
            tripId: "trip-flete",
            tripCode: "TRP-FLETE",
            freightRevenue: 0,
            calculatedCommission: 0,
            requiresZeroFreightAck: true,
            calculationGap: "zero_freight",
            zeroCommissionReason: "zero_freight",
          }),
          ...kmTrips,
        ],
      });
      renderPage();

      const list = await screen.findByRole("list", { name: "Viajes con datos faltantes" });
      const items = within(list).getAllByRole("listitem");
      expect(items).toHaveLength(6);
      expect(items[0]).toHaveTextContent("TRP-FLETE sin flete");
      expect(items[1]).toHaveTextContent("TRP-KM0 sin km");
      expect(items[4]).toHaveTextContent("TRP-KM3 sin km");
      expect(items[5]).toHaveTextContent("y 1 más");
      expect(within(list).queryByText("TRP-KM4")).not.toBeInTheDocument();
    });

    it("local con flete en $0 no se marca «Cubierto por sueldo» y muestra su motivo", async () => {
      const user = userEvent.setup();
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          tripWithGap({
            tripCode: "TRP-LOC",
            routeType: "local",
            freightRevenue: 0,
            calculatedCommission: 0,
            appliedRule: "15% sobre flete",
            requiresZeroFreightAck: true,
            calculationGap: "zero_freight",
            zeroCommissionReason: "zero_freight",
          }),
        ],
      });
      renderPage();

      expect(await screen.findByText("Sin flete")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Ver detalle de cálculo/i }));
      expect(screen.queryByText("Cubierto por sueldo base")).not.toBeInTheDocument();
      expect(screen.getByText("15% sobre flete")).toBeInTheDocument();
    });

    it("local con mínimo aplicado muestra «Mínimo garantizado», no «Cubierto por sueldo»", async () => {
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          tripWithGap({
            routeType: "local",
            distanceKm: 0,
            distanceBasis: "unavailable",
            calculatedCommission: 300,
            appliedRule: "Tarifa por km ($3/km)",
            requiresZeroKmAck: true,
            calculationGap: "zero_km",
            commissionBeforeMinimum: 0,
            minimumGuaranteedAmount: 300,
            minimumGuaranteedApplied: true,
          }),
        ],
      });
      renderPage();

      expect(await screen.findByText("Mínimo garantizado")).toBeInTheDocument();
      expect(screen.getAllByText("$300.00").length).toBeGreaterThanOrEqual(1);
    });

    it("local con regla «Sin pago extra» (none) sigue «Cubierto por sueldo base»", async () => {
      const user = userEvent.setup();
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          tripWithGap({
            routeType: "local",
            calculatedCommission: 0,
            appliedRule: "Sin comisión (Sueldo base)",
            zeroCommissionReason: "scheme",
            commissionBeforeMinimum: 0,
            minimumGuaranteedAmount: 0,
            minimumGuaranteedApplied: false,
            calculationGap: null,
          }),
        ],
      });
      renderPage();

      await screen.findByText("VIA-100");
      expect(screen.queryByText("$0 por tarifa")).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Ver detalle de cálculo/i }));
      expect(screen.getByText("Cubierto por sueldo base")).toBeInTheDocument();
    });

    it("insignia «Mínimo garantizado» con el cálculo y el mínimo en el title", async () => {
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          tripWithGap({
            calculatedCommission: 500,
            commissionBeforeMinimum: 320.5,
            minimumGuaranteedAmount: 500,
            minimumGuaranteedApplied: true,
          }),
        ],
      });
      renderPage();

      const badge = await screen.findByText("Mínimo garantizado");
      expect(badge).toHaveAttribute(
        "title",
        "El cálculo dio $320.50; se paga el mínimo garantizado de $500.00.",
      );
      expect(screen.queryByTestId("missing-data-gate")).not.toBeInTheDocument();
    });

    it("422 ZERO_FREIGHT_ACK_REQUIRED: cierra el diálogo, quita la confirmación y avisa inline", async () => {
      const user = userEvent.setup();
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          tripWithGap({
            freightRevenue: 0,
            calculatedCommission: 0,
            requiresZeroFreightAck: true,
            zeroCommissionReason: "zero_freight",
          }),
        ],
      });
      mockCreateSettlement.mockRejectedValueOnce(
        new ApiError("x", 422, "ZERO_FREIGHT_ACK_REQUIRED", { trip_codes: ["VIA-100"] }),
      );
      renderPage();

      await screen.findByTestId("missing-data-gate");
      const checkbox = screen.getByRole("checkbox", { name: /con datos faltantes/i });
      await user.click(checkbox);
      await user.click(screen.getByRole("button", { name: /Enviar a autorización/i }));
      await user.click(screen.getByRole("button", { name: /Confirmar y enviar/i }));

      expect(
        await screen.findByText(
          "El pago se recalculó y hay viajes con datos faltantes. Revísalos y confirma para enviar.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Confirmar y enviar/i })).not.toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: /con datos faltantes/i })).not.toBeChecked();
      expect(screen.getByRole("checkbox", { name: /con datos faltantes/i })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(mockToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" }),
      );
    });
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
      expect(screen.getByText(/^Operador foráneo( —|$)/)).toBeInTheDocument();
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
    expect(
      screen.getByText(/El neto es menor a \$5,000\.00 \(monto mínimo para pedir autorización\)/),
    ).toBeInTheDocument();
  });

  it("rev. 0.2: con umbral null (sin autorización por monto) guarda en borrador aunque el neto sea alto; una partida manual manda a autorización", async () => {
    const user = userEvent.setup();
    mockGetSettings.mockResolvedValue({
      voboThresholdMxn: null,
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
      expect(screen.getByRole("button", { name: /Guardar borrador/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /Enviar a autorización/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /^La regla no pide autorización por monto y no hay correcciones manuales: se guarda en borrador\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/El neto es menor a \$0\.00/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Agregar partida/i }));
    expect(await screen.findByRole("button", { name: /Enviar a autorización/i })).toBeInTheDocument();
  });

  it("si falla la lectura del umbral avisa con la regla de autorización de liquidaciones", async () => {
    mockGetSettings.mockRejectedValue(new Error("network"));
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(
        "No pudimos leer la regla de autorización de liquidaciones; recarga la página antes de mover dinero.",
      ),
    ).toBeInTheDocument();
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

  describe("aviso de cambio de esquema en el período (D-1 C1)", () => {
    function ref(
      templateId: string,
      templateName: string,
      effectiveFrom: string,
      effectiveTo: string | null,
      overrides: Partial<TemplatePeriodAssignmentRef> = {},
    ): TemplatePeriodAssignmentRef {
      return {
        assignmentId: `asg-${templateId}`,
        templateId,
        templateName,
        templateVersion: 1,
        effectiveFrom,
        effectiveTo,
        isClosing: false,
        ...overrides,
      };
    }

    function change(
      assignments: TemplatePeriodAssignmentRef[],
      from: TemplatePeriodAssignmentRef,
    ): SettlementTemplateChange {
      const to = { ...assignments[assignments.length - 1]!, isClosing: true };
      return {
        templatesCount: new Set(assignments.map((a) => a.templateId)).size,
        from,
        to,
        assignments: [...assignments.slice(0, -1), to],
      };
    }

    const norte = ref("tpl-norte", "Norte", "2026-07-01", "2026-08-14");
    const sur = ref("tpl-sur", "Sur", "2026-08-15", null);
    const twoSchemes = change([norte, sur], norte);
    const norteOpen = ref("tpl-norte", "Norte", "2026-07-01", null);
    const concurrent = change([norteOpen, sur], norteOpen);
    const norteShort = ref("tpl-norte", "Norte", "2026-07-01", "2026-08-09");
    const centro = ref("tpl-centro", "Centro", "2026-08-10", "2026-08-19");
    const surLate = ref("tpl-sur", "Sur", "2026-08-20", null);
    const severalSchemes = change([norteShort, centro, surLate], centro);

    function previewWith(
      templateChange: SettlementTemplateChange | null,
      withTrips: boolean,
      overrides: Record<string, unknown> = {},
    ) {
      return {
        ...mockPreview,
        periodStart: "2026-08-01",
        periodEnd: "2026-08-31",
        eligibleTrips: withTrips ? mockPreview.eligibleTrips : [],
        templateChange,
        ...overrides,
      };
    }

    function renderAugust() {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter
            initialEntries={[
              "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-31",
            ]}
          >
            <SettlementCreatePage />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    }

    const createCopy = settlementsCopy.createPage;
    const ambiguityTitle = settlementsCopy.agreementGovernance.settlementAmbiguityTitle;

    it.each([
      [
        "dos esquemas · sin viajes",
        twoSchemes,
        false,
        "Este período tiene dos esquemas",
        "Se aplica Sur a todo el período porque es el vigente el 31 ago 2026. Las prestaciones y deducciones de Norte no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).",
      ],
      [
        "dos esquemas · con viajes",
        twoSchemes,
        true,
        "Este período tiene dos esquemas",
        "Se aplica Sur a todo el período porque es el vigente el 31 ago 2026, también a los viajes con salida antes del 15 ago 2026. Las reglas de pago, corredores, prestaciones y deducciones de Norte no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).",
      ],
      [
        "varios esquemas · sin viajes",
        severalSchemes,
        false,
        "Este período tiene varios esquemas",
        "Se aplica Sur a todo el período porque es el vigente el 31 ago 2026. Las prestaciones y deducciones de los demás esquemas no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).",
      ],
      [
        "varios esquemas · con viajes",
        severalSchemes,
        true,
        "Este período tiene varios esquemas",
        "Se aplica Sur a todo el período porque es el vigente el 31 ago 2026, también a los viajes con salida antes del 20 ago 2026. Las reglas de pago, corredores, prestaciones y deducciones de los demás esquemas no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).",
      ],
      [
        "a la vez · sin viajes",
        concurrent,
        false,
        "Este período tiene dos esquemas a la vez",
        "Norte y Sur están vigentes al mismo tiempo. Se aplica Sur a todo el período porque es el más reciente por vigencia. Las prestaciones y deducciones de Norte no se consideran. Corrige las vigencias en Tarifas de pago o, si corresponde, agrega un ajuste manual (pedirá autorización).",
      ],
      [
        "a la vez · con viajes",
        concurrent,
        true,
        "Este período tiene dos esquemas a la vez",
        "Norte y Sur están vigentes al mismo tiempo. Se aplica Sur a todo el período, incluidos sus viajes, porque es el más reciente por vigencia. Las reglas de pago, corredores, prestaciones y deducciones de Norte no se consideran. Corrige las vigencias en Tarifas de pago o, si corresponde, agrega un ajuste manual (pedirá autorización).",
      ],
    ] as const)("%s: título y cuerpo de la variante", async (_label, tc, withTrips, title, body) => {
      mockPreviewSettlement.mockResolvedValue(previewWith(tc, withTrips));
      renderAugust();

      const alert = await screen.findByTestId("settlement-template-change-alert");
      expect(within(alert).getByText(title)).toBeInTheDocument();
      expect(within(alert).getByText(body)).toBeInTheDocument();
      expect(alert).not.toHaveTextContent("template_change_in_period");
    });

    it("agrega la versión cuando los dos esquemas se llaman igual", async () => {
      const v1 = ref("tpl-a1", "Operador estándar", "2026-07-01", "2026-08-14");
      const v2 = ref("tpl-a2", "Operador estándar", "2026-08-15", null, { templateVersion: 2 });
      mockPreviewSettlement.mockResolvedValue(previewWith(change([v1, v2], v1), false));
      renderAugust();

      const alert = await screen.findByTestId("settlement-template-change-alert");
      expect(
        within(alert).getByText(
          "Se aplica Operador estándar (v2) a todo el período porque es el vigente el 31 ago 2026. Las prestaciones y deducciones de Operador estándar (v1) no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).",
        ),
      ).toBeInTheDocument();
    });

    it("va justo arriba del banner de tarifa aplicada", async () => {
      mockPreviewSettlement.mockResolvedValue(previewWith(twoSchemes, true));
      renderAugust();

      const alert = await screen.findByTestId("settlement-template-change-alert");
      const banner = screen.getByText(`${createCopy.sections.agreementActiveLabel}:`).closest("div.rounded-lg");
      expect(alert.nextElementSibling).toBe(banner);
    });

    it("sin templateChange no muestra el aviso nuevo", async () => {
      mockPreviewSettlement.mockResolvedValue(previewWith(null, true));
      renderAugust();

      await screen.findByText("VIA-100");
      expect(screen.queryByTestId("settlement-template-change-alert")).not.toBeInTheDocument();
    });

    it("con readiness distinto de ready no muestra el aviso nuevo", async () => {
      mockPreviewSettlement.mockResolvedValue(
        previewWith(twoSchemes, false, {
          agreement: { ...mockPreview.agreement, rules: [] },
          summary: {
            ...mockPreview.summary,
            totalCommissions: 0,
            totalBaseSalary: 0,
            totalReimbursements: 0,
            grossAmount: 0,
            netAmount: 0,
          },
        }),
      );
      renderAugust();

      expect(await screen.findByText(createCopy.empty.incompleteAgreementTitle)).toBeInTheDocument();
      expect(screen.queryByTestId("settlement-template-change-alert")).not.toBeInTheDocument();
    });

    describe("P4: convivencia con el aviso de varias asignaciones vigentes", () => {
      const assignment = (id: string, effectiveFrom: string) => ({
        id,
        employeeId: "emp-1",
        employeeFullName: "Pedro Infante",
        templateId: `tpl-${id}`,
        templateName: `Tarifa ${id}`,
        effectiveFrom,
        effectiveTo: null,
        isActive: true,
        assignedBy: null,
        reason: null,
        createdAt: `${effectiveFrom}T12:00:00Z`,
        updatedAt: `${effectiveFrom}T12:00:00Z`,
      });

      beforeEach(() => {
        mockListAssignments.mockResolvedValue({
          data: [assignment("a", "2026-07-01"), assignment("b", "2026-08-15")],
          pagination: { total: 2, page: 1, pageSize: 100, totalPages: 1 },
        });
      });

      it("con templateChange solo se muestra el aviso nuevo", async () => {
        mockPreviewSettlement.mockResolvedValue(previewWith(concurrent, true));
        renderAugust();

        await screen.findByTestId("settlement-template-change-alert");
        await waitFor(() => expect(mockListAssignments).toHaveBeenCalled());
        await expect(
          screen.findByText(ambiguityTitle, {}, { timeout: 500 }),
        ).rejects.toThrow();
      });

      it("sin templateChange el aviso de varias asignaciones sigue igual", async () => {
        mockPreviewSettlement.mockResolvedValue(previewWith(null, true));
        renderAugust();

        expect(await screen.findByText(ambiguityTitle)).toBeInTheDocument();
        expect(screen.queryByTestId("settlement-template-change-alert")).not.toBeInTheDocument();
      });

      it("W6: la fecha aplicada sale de la asignación que usó la preliquidación", async () => {
        mockPreviewSettlement.mockResolvedValue(
          previewWith(null, true, {
            template: { ...mockPreview.template, assignmentId: "a" },
          }),
        );
        renderAugust();

        const title = await screen.findByText(ambiguityTitle);
        const alert = title.closest('[role="alert"]') ?? title.parentElement!;
        expect(alert).toHaveTextContent("1 jul 2026");
        expect(alert).not.toHaveTextContent("15 ago 2026");
      });

      it("W6: si la asignación de la preliquidación no está en la lista, usa el desempate local", async () => {
        mockPreviewSettlement.mockResolvedValue(previewWith(null, true));
        renderAugust();

        const title = await screen.findByText(ambiguityTitle);
        const alert = title.closest('[role="alert"]') ?? title.parentElement!;
        expect(alert).toHaveTextContent("15 ago 2026");
      });
    });
  });

  describe("api#59 — versión de tarifa reemplazada en la preliquidación (W3)", () => {
    const superseded: SettlementTemplateSuperseded = {
      templateId: "tpl-default",
      templateName: "Operador estándar",
      templateVersion: 1,
      assignmentId: "assign-default",
      supersededAt: "2026-08-03T16:00:00Z",
      replacedBy: { templateId: "tpl-v2", templateName: "Operador estándar", templateVersion: 2 },
    };

    function renderPage() {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter
            initialEntries={[
              "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15",
            ]}
          >
            <SettlementCreatePage />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    }

    it("con la versión que la reemplazó: título y cuerpo", async () => {
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        template: { ...mockPreview.template, version: 1, payability: "superseded" },
        templateSuperseded: superseded,
      });
      renderPage();

      const alert = await screen.findByTestId("settlement-template-superseded-alert");
      expect(within(alert).getByText("Versión de tarifa reemplazada")).toBeInTheDocument();
      expect(
        within(alert).getByText(
          "Se calcula con Operador estándar versión 1, que ya fue reemplazada por la versión 2. Si el operador debe cobrar con la versión 2, reasígnalo indicando desde qué fecha.",
        ),
      ).toBeInTheDocument();
      expect(alert).not.toHaveTextContent("template_version_superseded");
      const banner = screen
        .getByText(`${settlementsCopy.createPage.sections.agreementActiveLabel}:`)
        .closest("div.rounded-lg");
      expect(alert.nextElementSibling).toBe(banner);
    });

    it("criterio 12 (W5): banner «Tarifa de pago aplicada: {nombre} versión 2 — …» + W3, sin otro aviso", async () => {
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        template: { ...mockPreview.template, version: 2, payability: "superseded" },
        templateSuperseded: {
          ...superseded,
          templateVersion: 2,
          replacedBy: { templateId: "tpl-v3", templateName: "Operador estándar", templateVersion: 3 },
        },
      });
      renderPage();

      const alert = await screen.findByTestId("settlement-template-superseded-alert");
      const banner = screen
        .getByText("Tarifa de pago aplicada:")
        .closest("div.rounded-lg") as HTMLElement;
      expect(alert.nextElementSibling).toBe(banner);
      expect(within(banner).getByText(/^Operador estándar versión 2 — \S/)).toBeInTheDocument();
      expect(banner).not.toHaveTextContent(/Tarifa Operador|reemplazada|activa/i);
      expect(screen.getAllByTestId("settlement-template-superseded-alert")).toHaveLength(1);
    });

    it("criterio 12 (W5): sin version el banner muestra solo el nombre", async () => {
      mockPreviewSettlement.mockResolvedValue({ ...mockPreview });
      renderPage();

      await screen.findByText("VIA-100");
      const banner = screen
        .getByText("Tarifa de pago aplicada:")
        .closest("div.rounded-lg") as HTMLElement;
      expect(within(banner).getByText(/^Operador estándar — \S/)).toBeInTheDocument();
      expect(banner).not.toHaveTextContent(/versión/);
    });

    it("sin versión activa (replacedBy null): variante sin M", async () => {
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        templateSuperseded: { ...superseded, replacedBy: null },
      });
      renderPage();

      const alert = await screen.findByTestId("settlement-template-superseded-alert");
      expect(
        within(alert).getByText(
          "Se calcula con Operador estándar versión 1, que ya fue reemplazada. Si el operador debe cobrar con otra versión, reasígnalo indicando desde qué fecha.",
        ),
      ).toBeInTheDocument();
    });

    it.each([
      ["null", { templateSuperseded: null }],
      ["ausente (API anterior)", {}],
    ])("templateSuperseded %s: sin aviso", async (_label, extra) => {
      mockPreviewSettlement.mockResolvedValue({ ...mockPreview, ...extra });
      renderPage();

      await screen.findByText("VIA-100");
      expect(screen.queryByTestId("settlement-template-superseded-alert")).not.toBeInTheDocument();
    });
  });

  describe("api#59 — tarifa faltante según details.reason (W4)", () => {
    const createCopy = settlementsCopy.createPage;

    function renderPage() {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter
            initialEntries={[
              "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15",
            ]}
          >
            <SettlementCreatePage />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    }

    beforeEach(() => {
      mockPreviewReimbursement.mockResolvedValue({
        ...mockPreview,
        settlementKind: "reimbursement_only",
        reimbursements: [
          {
            tripExpenseId: "exp-1",
            tripId: "trip-9",
            tripCode: "VIA-009",
            category: "tolls",
            description: "Caseta",
            amount: 150,
            receiptNumber: null,
            approvedAt: "2026-08-10T10:00:00Z",
            isLate: false,
            tripSettledIn: null,
          },
        ],
        reimbursementsRequiringPayee: [],
      });
    });

    it.each([
      [
        "template_deactivated",
        {
          reason: "template_deactivated",
          template_id: "tpl-1",
          template_name: "Operador foráneo",
          template_version: 2,
          assignment_id: "asg-1",
        },
        "Tarifa desactivada",
        "Operador foráneo versión 2 fue desactivada y no se usa para calcular pagos. Reasigna al operador o corrige la vigencia en Tarifas de pago.",
      ],
      [
        "template_draft",
        {
          reason: "template_draft",
          template_id: "tpl-1",
          template_name: "Operador foráneo",
          template_version: 3,
          assignment_id: "asg-1",
        },
        "Tarifa en borrador",
        "Operador foráneo versión 3 está en borrador y no se usa para calcular pagos. Actívala o reasigna al operador en Tarifas de pago.",
      ],
      [
        "no_assignment",
        { reason: "no_assignment" },
        createCopy.empty.missingSchemeTitle,
        createCopy.empty.missingSchemeDescription,
      ],
      [
        "sin details",
        undefined,
        createCopy.empty.missingSchemeTitle,
        createCopy.empty.missingSchemeDescription,
      ],
    ] as const)(
      "%s: copy de la variante, botón de tarifas y pago de reembolsos",
      async (_label, details, title, description) => {
        mockPreviewSettlement.mockRejectedValue(
          new ApiError("Sin esquema", 422, "MISSING_COMPENSATION_SCHEME", details),
        );
        renderPage();

        expect((await screen.findAllByText(title)).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText(description).length).toBeGreaterThanOrEqual(1);
        expect(
          screen.getByRole("link", { name: createCopy.empty.configureCompensationAction }),
        ).toBeInTheDocument();
        expect(
          await screen.findByRole("link", { name: settlementsCopy.reimbursements.createAction }),
        ).toBeInTheDocument();
        expect(screen.queryByText(createCopy.empty.previewErrorTitle)).not.toBeInTheDocument();
      },
    );
  });

  describe("período por defecto en día de México (ADR-0101)", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      ["19:00 CDMX del último día del mes", "2026-10-01T01:00:00Z", "2026-09-01", "2026-09-30"],
      ["00:00 CDMX del día 1", "2026-10-01T06:00:00Z", "2026-10-01", "2026-10-01"],
    ])(
      "sin período en la URL propone el mes de México a las %s",
      async (_label, now, expectedStart, expectedEnd) => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(now));

        render(
          <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1"]}>
              <SettlementCreatePage />
            </MemoryRouter>
          </QueryClientProvider>,
        );

        await waitFor(() => expect(mockPreviewSettlement).toHaveBeenCalled());
        expect(mockPreviewSettlement.mock.calls[0]![0]).toEqual(
          expect.objectContaining({
            employeeId: "emp-1",
            periodStart: expectedStart,
            periodEnd: expectedEnd,
          }),
        );
      },
    );
  });

  describe("ADR-0085 E11 — bloque de período y viajes en $0", () => {
    const blockingSettlement = {
      settlementId: "stl-prev",
      settlementNumber: "LIQ-202608-0003",
      status: "draft" as const,
      periodStart: "2026-07-30",
      periodEnd: "2026-08-07",
    };

    function renderPage() {
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
            <SettlementCreatePage />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    }

    it("solape parcial bloquea; «Mover inicio al …» mueve el inicio, recalcula y deja guardar", async () => {
      const user = userEvent.setup();
      mockPreviewSettlement.mockImplementation(async (params: { periodStart: string }) =>
        params.periodStart === "2026-08-01"
          ? {
              ...mockPreview,
              periodicBlock: {
                status: "partial_overlap",
                settlement: blockingSettlement,
                suggestedPeriodStart: "2026-08-08",
              },
            }
          : {
              ...mockPreview,
              periodStart: params.periodStart,
              periodicBlock: { status: "included", settlement: null, suggestedPeriodStart: null },
            },
      );
      renderPage();

      expect(await screen.findByText("El período se cruza con otro pago")).toBeInTheDocument();
      expect(screen.getByText(/LIQ-202608-0003 \(Borrador\)/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Guardar borrador/i })).toBeDisabled();
      expect(screen.getByText("Para guardar, mueve la fecha de inicio.")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Mover inicio al/i }));

      await waitFor(() =>
        expect(mockPreviewSettlement).toHaveBeenCalledWith(
          expect.objectContaining({ periodStart: "2026-08-08", periodEnd: "2026-08-15" }),
        ),
      );
      await waitFor(() =>
        expect(screen.queryByText("El período se cruza con otro pago")).not.toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: /Guardar borrador/i }));
      await waitFor(() => expect(mockCreateSettlement).toHaveBeenCalledTimes(1));
      expect(mockCreateSettlement).toHaveBeenCalledWith(
        expect.objectContaining({ periodStart: "2026-08-08", submitForApproval: false }),
      );
    });

    it("409 PERIOD_PARTIAL_OVERLAP del alta muestra la misma alerta bloqueante", async () => {
      const user = userEvent.setup();
      mockCreateSettlement.mockRejectedValueOnce(
        new ApiError("El período se cruza", 409, "PERIOD_PARTIAL_OVERLAP", {
          settlement_id: "stl-prev",
          settlement_number: "LIQ-202608-0003",
          status: "approved",
          period_start: "2026-07-30",
          period_end: "2026-08-07",
          suggested_period_start: "2026-08-08",
        }),
      );
      renderPage();

      await user.click(await screen.findByRole("button", { name: /Guardar borrador/i }));

      expect(await screen.findByText("El período se cruza con otro pago")).toBeInTheDocument();
      expect(screen.getByText(/LIQ-202608-0003 \(Autorizado\)/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Guardar borrador/i })).toBeDisabled();
    });

    it("solape parcial sin fecha sugerida dentro del período: sin botón de mover y pide ajustar fechas", async () => {
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        periodicBlock: {
          status: "partial_overlap",
          settlement: blockingSettlement,
          suggestedPeriodStart: "2026-08-20",
        },
      });
      renderPage();

      expect(await screen.findByText("El período se cruza con otro pago")).toBeInTheDocument();
      expect(screen.getByText(/Ajusta las fechas para que este pago no incluya esos días/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Mover inicio al/i })).not.toBeInTheDocument();
      expect(screen.getByText("Para guardar, ajusta las fechas.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Guardar borrador/i })).toBeDisabled();
    });

    it("409 TRIP_IN_ACTIVE_SETTLEMENT deja un aviso fijo con enlace al folio, sin toast", async () => {
      const user = userEvent.setup();
      mockCreateSettlement.mockRejectedValueOnce(
        new ApiError("Viaje en otro pago", 409, "TRIP_IN_ACTIVE_SETTLEMENT", {
          conflicts: [
            {
              trip_id: "trip-1",
              trip_code: "TRP-001",
              settlement_id: "stl-prev",
              settlement_number: "LIQ-202608-0003",
              status: "approved",
            },
          ],
        }),
      );
      renderPage();

      await user.click(await screen.findByRole("button", { name: /Guardar borrador/i }));

      const alert = await screen.findByTestId("trip-in-active-settlement-alert");
      expect(alert).toHaveTextContent("Algunos viajes ya están en otro pago");
      expect(alert).toHaveTextContent("TRP-001 está en LIQ-202608-0003 (Autorizado)");
      expect(within(alert).getByRole("link", { name: "LIQ-202608-0003" })).toHaveAttribute(
        "href",
        expect.stringContaining("stl-prev"),
      );
      expect(mockToast).not.toHaveBeenCalledWith(
        expect.objectContaining({ title: "Algunos viajes ya están en otro pago" }),
      );
    });
    it("período contenido avisa con el folio que ya trae el sueldo", async () => {
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        periodicBlock: {
          status: "excluded_contained",
          settlement: blockingSettlement,
          suggestedPeriodStart: null,
        },
      });
      renderPage();

      expect(
        await screen.findByText("El sueldo de este período ya está en otro pago"),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Ver LIQ-202608-0003" })).toHaveAttribute(
        "href",
        expect.stringContaining("stl-prev"),
      );
      expect(screen.getByRole("button", { name: /Guardar borrador/i })).toBeEnabled();
    });

    it("viajes sin regla de pago piden confirmación y mandan acknowledgeNoRuleTrips", async () => {
      const user = userEvent.setup();
      mockPreviewSettlement.mockResolvedValue({
        ...mockPreview,
        eligibleTrips: [
          {
            ...mockPreview.eligibleTrips[0],
            calculatedCommission: 0,
            zeroCommissionReason: "no_rule",
          },
        ],
      });
      renderPage();

      expect(await screen.findByText("Sin regla de pago")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Guardar borrador/i }));

      expect(
        await screen.findByRole("heading", { name: /¿Incluir viajes sin regla de pago\?/i }),
      ).toBeInTheDocument();
      expect(mockCreateSettlement).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: "Incluir en $0" }));

      await waitFor(() => expect(mockCreateSettlement).toHaveBeenCalledTimes(1));
      expect(mockCreateSettlement).toHaveBeenCalledWith(
        expect.objectContaining({ acknowledgeNoRuleTrips: true, submitForApproval: false }),
      );
    });
  });
});

describe("SettlementCreatePage — tope de descuentos contra el bruto", () => {
  const advance = (
    advanceId: string,
    folio: string,
    availableBalance: number,
    disbursedAt: string,
  ) => ({
    advanceId,
    folio,
    amount: availableBalance,
    balanceRemaining: availableBalance,
    availableBalance,
    category: "travel_advance",
    disbursedAt,
  });

  const fund = (amount: number) => ({
    id: "d-fund",
    deductionType: "savings_fund",
    label: "Fondo de ahorro",
    amount,
    isMandatory: true,
  });

  function previewWithGross(
    gross: number,
    overrides: Record<string, unknown> = {},
  ) {
    return {
      ...mockPreview,
      eligibleTrips: [
        {
          ...mockPreview.eligibleTrips[0],
          calculatedCommission: gross,
          approvedReimbursableExpenses: 0,
        },
      ],
      openAdvances: [advance("adv-1", "ANT-10", 2500, "2026-08-01T10:00:00Z")],
      summary: {
        totalCommissions: gross,
        totalBaseSalary: 0,
        totalReimbursements: 0,
        suggestedAdvanceDeduction: gross,
        grossAmount: gross,
        netAmount: 0,
      },
      ...overrides,
    };
  }

  function renderPage() {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={["/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15"]}>
          <SettlementCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  const amountInput = (folio: string) =>
    screen.getByRole("textbox", { name: `Monto a descontar del anticipo ${folio}` });

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
    mockFetchEmployees.mockResolvedValue({
      data: [mockEmployee],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    mockCreateSettlement.mockResolvedValue({ id: "settlement-new-1", status: "draft" });
    mockListAssignments.mockResolvedValue({ data: [], pagination: { total: 0, page: 1, pageSize: 100, totalPages: 0 } });
    mockGetSettings.mockResolvedValue({
      voboThresholdMxn: 0,
      activeApproverCount: 2,
      activeExecutorCount: 2,
    });
  });

  it("bruto 2,000 + anticipo libre 2,500: precarga 2,000, avisa $500 pendientes y neto 0", async () => {
    const user = userEvent.setup();
    mockPreviewSettlement.mockResolvedValue(previewWithGross(2000));
    renderPage();
    await waitFor(() => expect(screen.getByText("ANT-10")).toBeInTheDocument());

    await user.click(screen.getByRole("checkbox"));

    expect(amountInput("ANT-10")).toHaveValue("2,000.00");
    expect(screen.getByTestId("create-advance-pending-adv-1")).toHaveTextContent(
      "Quedan $500.00 pendientes para el siguiente corte.",
    );
    expect(screen.getByTestId("create-advances-max-hint")).toHaveTextContent(
      "Máximo a descontar en este pago: $2,000.00",
    );
    expect(screen.queryByText(/superan lo que cabe/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("-$2,000.00").length).toBeGreaterThanOrEqual(1);
  });

  it("capturar 2,500 marca error inline + resumen; «Descontar el máximo posible» deja 2,000", async () => {
    const user = userEvent.setup();
    mockPreviewSettlement.mockResolvedValue(previewWithGross(2000));
    renderPage();
    await waitFor(() => expect(screen.getByText("ANT-10")).toBeInTheDocument());

    await user.click(screen.getByRole("checkbox"));
    await user.clear(amountInput("ANT-10"));
    await user.type(amountInput("ANT-10"), "2500");

    const message =
      "Los anticipos superan lo que cabe en este pago (máximo $2,000.00). El resto queda pendiente en el anticipo para el siguiente corte.";
    expect(document.getElementById("settlement-create-advances-error")).toHaveTextContent(message);
    expect(amountInput("ANT-10")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Revisa los campos marcados")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Guardar borrador/i }));
    expect(mockCreateSettlement).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Descontar el máximo posible" }));
    expect(amountInput("ANT-10")).toHaveValue("2,000.00");
    expect(document.getElementById("settlement-create-advances-error")).not.toBeInTheDocument();
  });

  it("bruto 2,000 + fondo 300 + anticipo 2,500: precarga 1,700", async () => {
    const user = userEvent.setup();
    mockPreviewSettlement.mockResolvedValue(
      previewWithGross(2000, {
        deductions: [fund(300)],
        summary: {
          totalCommissions: 2000,
          totalBaseSalary: 0,
          totalReimbursements: 0,
          totalDeductions: 300,
          suggestedAdvanceDeduction: 1700,
          grossAmount: 2000,
          netAmount: 1700,
        },
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText("ANT-10")).toBeInTheDocument());

    await user.click(screen.getByRole("checkbox"));
    expect(amountInput("ANT-10")).toHaveValue("1,700.00");
    expect(screen.queryByTestId("create-template-omitted")).not.toBeInTheDocument();
  });

  it("anticipo reservado en otro pago: muestra el folio, no se preselecciona ni se captura", async () => {
    const user = userEvent.setup();
    mockPreviewSettlement.mockResolvedValue(
      previewWithGross(2000, {
        openAdvances: [
          {
            ...advance("adv-busy", "ANT-20", 0, "2026-07-30T10:00:00Z"),
            balanceRemaining: 900,
            reservedAmount: 900,
            reservedBySettlementNumber: "LIQ-202608-0005",
          },
          advance("adv-1", "ANT-10", 2500, "2026-08-01T10:00:00Z"),
        ],
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText("ANT-20")).toBeInTheDocument());

    expect(screen.getByTestId("create-advance-reserved-elsewhere-adv-busy")).toHaveTextContent(
      "Reservado en LIQ-202608-0005. Se libera cuando ese pago se pague o se cancele.",
    );
    const [busyCheckbox] = screen.getAllByRole("checkbox");
    expect(busyCheckbox).toBeDisabled();
    expect(amountInput("ANT-20")).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Descontar todo/i }));
    expect(amountInput("ANT-20")).toHaveValue("");
    expect(amountInput("ANT-10")).toHaveValue("2,000.00");
  });

  it("E11 punto 6: comisión 1,000 + reembolso 500 + fondo 1,200 → fondo 1,000 (200 omitido), anticipo máx. 500, neto 500", async () => {
    const user = userEvent.setup();
    mockPreviewSettlement.mockResolvedValue(
      previewWithGross(1000, {
        deductions: [fund(1200)],
        summary: {
          totalCommissions: 1000,
          totalBaseSalary: 0,
          totalReimbursements: 500,
          totalDeductions: 1000,
          totalDeductionsOmitted: 200,
          suggestedAdvanceDeduction: 500,
          grossAmount: 1500,
          netAmount: 500,
        },
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByTestId("create-template-omitted")).toBeInTheDocument());

    expect(screen.getByTestId("create-template-omitted")).toHaveTextContent(
      "Fondo de ahorro: no aplicado $200.00 por ingreso insuficiente",
    );
    expect(screen.getByTestId("create-advances-max-hint")).toHaveTextContent(
      "Máximo a descontar en este pago: $500.00",
    );

    await user.click(screen.getByRole("checkbox"));
    expect(amountInput("ANT-10")).toHaveValue("500.00");
  });

  it("bruto 0 + fondo 300: deja crear y muestra el fondo no aplicado", async () => {
    const user = userEvent.setup();
    mockPreviewSettlement.mockResolvedValue(
      previewWithGross(0, {
        agreement: { ...mockPreview.agreement, rules: [{ routeType: "local" }] },
        openAdvances: [],
        deductions: [fund(300)],
        summary: {
          totalCommissions: 0,
          totalBaseSalary: 0,
          totalReimbursements: 0,
          totalDeductions: 0,
          totalDeductionsOmitted: 300,
          suggestedAdvanceDeduction: 0,
          grossAmount: 0,
          netAmount: 0,
        },
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByTestId("create-template-omitted")).toBeInTheDocument());

    expect(screen.getByTestId("create-template-omitted")).toHaveTextContent(
      "Fondo de ahorro: no aplicado $300.00 por ingreso insuficiente",
    );

    await user.click(screen.getByRole("button", { name: /Guardar borrador/i }));
    await waitFor(() => expect(mockCreateSettlement).toHaveBeenCalledTimes(1));
  });

  it("«Descontar todo» reparte el máximo FIFO por entrega: 1,500 / 500", async () => {
    const user = userEvent.setup();
    mockPreviewSettlement.mockResolvedValue(
      previewWithGross(2000, {
        openAdvances: [
          advance("adv-late", "ANT-12", 1000, "2026-08-05T10:00:00Z"),
          advance("adv-early", "ANT-11", 1500, "2026-08-01T10:00:00Z"),
        ],
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText("ANT-11")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Descontar todo/i }));
    expect(amountInput("ANT-11")).toHaveValue("1,500.00");
    expect(amountInput("ANT-12")).toHaveValue("500.00");

    await user.click(screen.getByRole("button", { name: /Guardar borrador/i }));
    await waitFor(() => expect(mockCreateSettlement).toHaveBeenCalledTimes(1));
    expect(mockCreateSettlement).toHaveBeenCalledWith(
      expect.objectContaining({
        advancesToApply: expect.arrayContaining([
          { advanceId: "adv-early", amountToDeduct: 1500 },
          { advanceId: "adv-late", amountToDeduct: 500 },
        ]),
      }),
    );
  });

  it("422 con path custom_items marca el bloque de partidas manuales (sin toast genérico)", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@shared/api/interceptors/error-handler");
    mockPreviewSettlement.mockResolvedValue(previewWithGross(2000, { openAdvances: [] }));
    mockCreateSettlement.mockRejectedValue(
      new ApiError("Los descuentos superan el bruto.", 422, "SETTLEMENT_DEDUCTIONS_EXCEED_GROSS", {
        max_advance_deductible: 0,
        excess_source: "manual_deductions",
        path: ["custom_items"],
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText("VIA-100")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Guardar borrador/i }));

    await waitFor(() =>
      expect(document.getElementById("settlement-create-manual-items-error")).toHaveTextContent(
        "Los descuentos manuales superan lo que ganó el operador en este corte.",
      ),
    );
    expect(document.getElementById("settlement-create-advances-error")).not.toBeInTheDocument();
  });

  it("422 con path advances_to_apply marca el bloque de anticipos con el máximo del API", async () => {
    const user = userEvent.setup();
    const { ApiError } = await import("@shared/api/interceptors/error-handler");
    mockPreviewSettlement.mockResolvedValue(previewWithGross(2000));
    mockCreateSettlement.mockRejectedValue(
      new ApiError("Los descuentos superan el bruto.", 422, "SETTLEMENT_DEDUCTIONS_EXCEED_GROSS", {
        max_advance_deductible: 1800,
        excess_source: "advances",
        path: ["advances_to_apply"],
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText("ANT-10")).toBeInTheDocument());

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Guardar borrador/i }));

    await waitFor(() =>
      expect(document.getElementById("settlement-create-advances-error")).toHaveTextContent(
        "máximo $1,800.00",
      ),
    );
  });
});
