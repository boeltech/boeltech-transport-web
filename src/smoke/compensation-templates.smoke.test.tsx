/**
 * Smoke ADR-0089 — Plantillas de compensación, corredores y preview de liquidación.
 *
 * Cubre:
 * 1. Hub de plantillas y corredores foráneos.
 * 1c. Alta de esquema → Builder (ADR-0091).
 * 1d. Editar abre Builder con prosa + puente preview.
 * 2. Catálogo denso (sin master-detail); corredores en tab del hub.
 * 3. Redirect legacy /finance/agreements → hub de plantillas.
 * 4. Redirect legacy detalle → Sheet operadores.
 * 5. Sheet de asignación masiva desde CTA Operadores del catálogo.
 * 6–7. Preview liquidación con plantilla, badge de corredor (E1) y prestaciones (E3).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompensationHubLayout } from "@features/compensation/presentation/components/CompensationHubLayout";
import { CompensationTemplateListPage } from "@features/compensation/presentation/pages/CompensationTemplateListPage";
import { CompensationSchemeBuilderPage } from "@features/compensation/presentation/pages/CompensationSchemeBuilderPage";
import { CompensationTemplateDetailRedirect } from "@features/compensation/presentation/pages/CompensationTemplateDetailRedirect";
import { CorridorTariffsListPage } from "@features/compensation/presentation/pages/CorridorTariffsListPage";
import { AgreementsLegacyRedirect } from "@features/compensation/presentation/routes/AgreementsLegacyRedirect";
import { SettlementCreatePage } from "@features/settlements/presentation/pages/SettlementCreatePage";

const {
  mockListTemplates,
  mockGetTemplate,
  mockCreateTemplate,
  mockUpdateTemplate,
  mockListCorridors,
  mockListAssignments,
  mockBatchAssignments,
  mockPreviewSettlement,
  mockListAgreements,
  mockFetchEmployees,
  mockGetEmployeeBasic,
} = vi.hoisted(() => ({
  mockListTemplates: vi.fn(),
  mockGetTemplate: vi.fn(),
  mockCreateTemplate: vi.fn(),
  mockUpdateTemplate: vi.fn(),
  mockListCorridors: vi.fn(),
  mockListAssignments: vi.fn(),
  mockBatchAssignments: vi.fn(),
  mockPreviewSettlement: vi.fn(),
  mockListAgreements: vi.fn(),
  mockFetchEmployees: vi.fn(),
  mockGetEmployeeBasic: vi.fn(),
}));

vi.mock("@features/compensation/infrastructure/compensationApi", () => ({
  compensationApi: {
    listTemplates: (...args: unknown[]) => mockListTemplates(...args),
    getTemplateById: (...args: unknown[]) => mockGetTemplate(...args),
    createTemplate: (...args: unknown[]) => mockCreateTemplate(...args),
    updateTemplate: (...args: unknown[]) => mockUpdateTemplate(...args),
    replaceTemplateConfiguration: vi.fn(),
    deleteTemplate: vi.fn(),
    listCorridors: (...args: unknown[]) => mockListCorridors(...args),
    getCorridorById: vi.fn(),
    createCorridor: vi.fn(),
    updateCorridor: vi.fn(),
    deleteCorridor: vi.fn(),
    listAssignments: (...args: unknown[]) => mockListAssignments(...args),
    batchCreateAssignments: (...args: unknown[]) => mockBatchAssignments(...args),
    deleteAssignment: vi.fn(),
  },
}));

vi.mock("@features/settlements/infrastructure/settlementsApi", () => ({
  settlementsApi: {
    previewSettlement: (...args: unknown[]) => mockPreviewSettlement(...args),
    listAgreements: (...args: unknown[]) => mockListAgreements(...args),
    createSettlement: vi.fn(),
    createAgreement: vi.fn(),
    updateAgreement: vi.fn(),
  },
}));

vi.mock("@features/employees/infrastructure/employeeRepository", () => ({
  fetchEmployees: (...args: unknown[]) => mockFetchEmployees(...args),
  getEmployeeBasic: (...args: unknown[]) => mockGetEmployeeBasic(...args),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({
    data: { data: [] },
    isLoading: false,
  }),
}));

vi.mock("@features/notifications/infrastructure/notificationsApi", () => ({
  notificationsApi: {
    getUnreadCount: vi.fn().mockResolvedValue(0),
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

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
    useMediaQuery: (query: string) => query !== "(max-width: 1023px)",
  };
});

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithRoutes(initialEntry: string, ui: ReactNode) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const mockCorridor = {
  id: "cor-1",
  name: "México → MTY",
  originRefType: "city_label" as const,
  originRefValue: "Ciudad de México",
  destinationRefType: "city_label" as const,
  destinationRefValue: "Monterrey",
  fixedAmount: 1500,
  notes: null,
  isActive: true,
};

const mockTemplate = {
  id: "tpl-1",
  name: "Operador foráneo",
  description: "Plantilla piloto ADR-0089",
  isActive: true,
  rules: [
    {
      routeType: "long_haul" as const,
      commissionType: "rate_per_km" as const,
      rateValue: 3,
      minimumGuaranteedAmount: 0,
      notes: null,
      sortOrder: 0,
    },
  ],
  fixedAllowances: [
    {
      allowanceType: "meal" as const,
      label: "Comidas",
      amount: 500,
      period: "weekly" as const,
      isMandatory: true,
    },
  ],
  corridorIds: ["cor-1"],
  corridors: [mockCorridor],
  activeAssignmentsCount: 1,
};

const mockCreatedTemplate = {
  id: "tpl-new",
  name: "Esquema nuevo smoke",
  description: "Alta desde hub",
  isActive: true,
  rules: [] as typeof mockTemplate.rules,
  fixedAllowances: [] as typeof mockTemplate.fixedAllowances,
  corridorIds: [] as string[],
  corridors: [] as typeof mockTemplate.corridors,
  activeAssignmentsCount: 0,
};

const compensationRoutes = (
  <>
    <Route path="/finance/compensation" element={<CompensationHubLayout />}>
      <Route path="templates" element={<CompensationTemplateListPage />} />
      <Route path="templates/:id" element={<CompensationTemplateDetailRedirect />} />
      <Route path="corridors" element={<CorridorTariffsListPage />} />
    </Route>
    <Route
      path="/finance/compensation/templates/:id/build"
      element={<CompensationSchemeBuilderPage />}
    />
    <Route path="/finance/agreements" element={<AgreementsLegacyRedirect />} />
    <Route path="/finance/settlements/new" element={<SettlementCreatePage />} />
  </>
);

describe("Smoke ADR-0089: Compensation templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTemplates.mockResolvedValue({
      data: [mockTemplate],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    mockGetTemplate.mockImplementation(async (id: string) =>
      id === "tpl-new" ? mockCreatedTemplate : mockTemplate,
    );
    mockCreateTemplate.mockResolvedValue(mockCreatedTemplate);
    mockUpdateTemplate.mockResolvedValue(mockCreatedTemplate);
    mockListCorridors.mockResolvedValue({
      data: [mockCorridor],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    mockListAssignments.mockResolvedValue({
      data: [
        {
          id: "assign-1",
          employeeId: "emp-1",
          employeeFullName: "Roberto González",
          templateId: "tpl-1",
          templateName: "Operador foráneo",
          effectiveFrom: "2026-08-01",
          effectiveTo: null,
          isActive: true,
        },
      ],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    mockBatchAssignments.mockResolvedValue({
      createdCount: 3,
      skippedCount: 0,
      conflicts: [],
    });
    mockListAgreements.mockResolvedValue([]);
    mockFetchEmployees.mockResolvedValue({
      data: [
        {
          id: "emp-1",
          employeeNumber: "101",
          firstName: "Roberto",
          lastName: "González",
          position: "Conductor",
          isActive: true,
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
    mockGetEmployeeBasic.mockResolvedValue({
      id: "emp-1",
      employeeNumber: "101",
      firstName: "Roberto",
      lastName: "González",
      fullName: "Roberto González",
    });
    mockPreviewSettlement.mockResolvedValue({
      employeeId: "emp-1",
      employeeName: "Roberto González",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-15",
      agreement: {
        calculationType: "rate_per_km",
        ratePerKm: 3,
        rules: mockTemplate.rules,
      },
      template: {
        id: "tpl-1",
        name: "Operador foráneo",
        assignmentId: "assign-1",
      },
      fixedAllowances: [
        { id: "allow-1", label: "Comidas", amount: 500, suspended: false },
      ],
      eligibleTrips: [
        {
          tripId: "trip-1",
          tripCode: "VIA-200",
          routeType: "long_haul",
          scheduledDeparture: "2026-08-02T08:00:00Z",
          completedAt: "2026-08-03T18:00:00Z",
          originCity: "Ciudad de México",
          destinationCity: "Monterrey",
          distanceKm: 950,
          freightRevenue: 28000,
          calculatedCommission: 1500,
          approvedReimbursableExpenses: 0,
          corridorMatch: {
            corridorId: "cor-1",
            name: "México → MTY",
            fixedAmount: 1500,
            replacesKmCommission: true,
          },
        },
      ],
      openAdvances: [],
      summary: {
        totalCommissions: 1500,
        totalBaseSalary: 3500,
        totalFixedAllowances: 500,
        totalReimbursements: 0,
        suggestedAdvanceDeduction: 0,
        grossAmount: 5500,
        netAmount: 5500,
      },
    });
  });

  it("1. Lista plantillas en el hub de compensación", async () => {
    renderWithRoutes(
      "/finance/compensation/templates",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Operador foráneo").length).toBeGreaterThan(0);
    });

    expect(screen.getByRole("heading", { name: /Esquemas de compensación/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^Esquemas$/i })).toBeInTheDocument();
  });

  it("1b. Lista plantillas muestra paginación cuando hay más de una página", async () => {
    const manyTemplates = Array.from({ length: 20 }, (_, index) => ({
      ...mockTemplate,
      id: `tpl-${index + 1}`,
      name: `Esquema ${index + 1}`,
    }));
    mockListTemplates.mockResolvedValue({
      data: manyTemplates,
      pagination: { total: 25, page: 1, limit: 20, totalPages: 2 },
    });

    renderWithRoutes(
      "/finance/compensation/templates",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(screen.getByText("Esquema 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).not.toBeDisabled();
  });

  it("1c. Crea esquema de compensación desde el hub y abre el Builder", async () => {
    const user = userEvent.setup();
    renderWithRoutes(
      "/finance/compensation/templates",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Operador foráneo").length).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("button", { name: /Nuevo esquema/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Nuevo esquema/i }),
    ).toBeInTheDocument();

    const nameInput = await screen.findByLabelText("Nombre");
    await user.type(nameInput, "Esquema nuevo smoke");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Esquema nuevo smoke",
        description: null,
        isActive: true,
        rules: [],
        fixedAllowances: [],
        corridorIds: [],
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Esquema nuevo smoke" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getAllByRole("tab", { name: /Identidad/i }).length,
    ).toBeGreaterThan(0);
  });

  it("1d. Abre Builder desde Editar y muestra resumen en prosa", async () => {
    const user = userEvent.setup();
    renderWithRoutes(
      "/finance/compensation/templates",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Operador foráneo").length).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("link", { name: /^Editar$/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Operador foráneo" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Cuando viaje foráneo, pagar/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Vista previa con Roberto González/i }),
    ).toHaveAttribute("href", "/finance/settlements/new?employeeId=emp-1");
  });

  it("2. Lista corredores foráneos con tarifa fija", async () => {
    const user = userEvent.setup();
    renderWithRoutes(
      "/finance/compensation/templates",
      <Routes>{compensationRoutes}</Routes>,
    );

    await user.click(screen.getByRole("tab", { name: /Rutas con tarifa fija/i }));

    await waitFor(() => {
      expect(screen.getByText("México → MTY")).toBeInTheDocument();
    });

    expect(screen.getByText("Ciudad de México → Monterrey")).toBeInTheDocument();
    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
  });

  it("3. Redirige /finance/agreements al hub de plantillas", async () => {
    renderWithRoutes(
      "/finance/agreements?employeeId=emp-1",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Operador foráneo").length).toBeGreaterThan(0);
    });
  });

  it("4. Redirect legacy detalle abre Sheet de operadores", async () => {
    renderWithRoutes(
      "/finance/compensation/templates/tpl-1",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Operadores — Operador foráneo/i }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("table", { name: /Operadores asignados al esquema de compensación/i }),
    ).toBeInTheDocument();
  });

  it("4b. Editar desde catálogo abre Builder con reglas y prestaciones", async () => {
    const user = userEvent.setup();
    renderWithRoutes(
      "/finance/compensation/templates",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Operador foráneo").length).toBeGreaterThan(0);
    });

    expect(screen.getByRole("columnheader", { name: /^Operadores$/i })).toBeInTheDocument();
    expect(screen.getByTitle(/^1 operadores$/i)).toBeInTheDocument();
    expect(screen.getByText("Listo para liquidar")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /^Editar$/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Operador foráneo" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Cuando viaje foráneo, pagar/i)).toBeInTheDocument();
    expect(screen.getByText(/Prestación Comidas/i)).toBeInTheDocument();
  });

  it("5. Abre sheet de asignación masiva desde CTA Operadores", async () => {
    const user = userEvent.setup();
    renderWithRoutes(
      "/finance/compensation/templates",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Operadores$/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^Operadores$/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Operadores — Operador foráneo/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Asignar operadores/i }));

    expect(screen.getByRole("heading", { name: /Asignación masiva/i })).toBeInTheDocument();
    expect(screen.getByText(/Selecciona operadores/i)).toBeInTheDocument();
  });

  it("6. Preview liquidación: plantilla, corredor E1 y prestaciones", async () => {
    renderWithRoutes(
      "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(screen.getByText("VIA-200")).toBeInTheDocument();
    });

    expect(screen.getByText(/Plantilla Operador foráneo/i)).toBeInTheDocument();
    expect(screen.getByText(/Corredor: México → MTY/i)).toBeInTheDocument();
    expect(screen.getByText(/Prestaciones fijas:/i)).toBeInTheDocument();
    expect(screen.getAllByText("$1,500.00").length).toBeGreaterThanOrEqual(1);
  });

  it("7. E3: prestación suspendida no suma en el balance strip", async () => {
    mockPreviewSettlement.mockResolvedValue({
      employeeId: "emp-1",
      employeeName: "Roberto González",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-15",
      agreement: { calculationType: "rate_per_km", ratePerKm: 3, rules: [] },
      template: {
        id: "tpl-1",
        name: "Operador foráneo",
        assignmentId: "assign-1",
      },
      fixedAllowances: [
        { id: "allow-1", label: "Comidas", amount: 500, suspended: true },
      ],
      eligibleTrips: [],
      openAdvances: [],
      summary: {
        totalCommissions: 0,
        totalBaseSalary: 3500,
        totalFixedAllowances: 0,
        totalReimbursements: 0,
        suggestedAdvanceDeduction: 0,
        grossAmount: 3500,
        netAmount: 3500,
      },
    });

    renderWithRoutes(
      "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15",
      <Routes>{compensationRoutes}</Routes>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Esquema de compensación activo/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Prestaciones fijas:/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("$3,500.00").length).toBeGreaterThanOrEqual(1);
  });
});
