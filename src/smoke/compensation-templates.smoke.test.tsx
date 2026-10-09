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
 * 8–9. Versión reemplazada: catálogo → Builder bloqueado → versión activa; 409 en carrera (api#59 W5).
 * 10. Lote parcial: renglón con causa y salida antes y después de confirmar (api#63, criterios 1–4).
 * 11. Ir a la asignación que bloquea y volver por URL (api#63, criterios 16–18, 20, 22).
 * 12. «Concluida» en el sheet y «2 · +1 programada» en el listado (api#63, criterios 8, 10, 11).
 */
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OperatorPaymentsHubLayout } from "@features/settlements/presentation/components/OperatorPaymentsHubLayout";
import { CompensationHubLayout } from "@features/compensation/presentation/components/CompensationHubLayout";
import { CompensationTemplateListPage } from "@features/compensation/presentation/pages/CompensationTemplateListPage";
import { CompensationSchemeBuilderPage } from "@features/compensation/presentation/pages/CompensationSchemeBuilderPage";
import { CompensationTemplateDetailRedirect } from "@features/compensation/presentation/pages/CompensationTemplateDetailRedirect";
import { CorridorTariffsListPage } from "@features/compensation/presentation/pages/CorridorTariffsListPage";
import { AgreementsLegacyRedirect } from "@features/compensation/presentation/routes/AgreementsLegacyRedirect";
import { SettlementCreatePage } from "@features/settlements/presentation/pages/SettlementCreatePage";
import { compensationCopy } from "@features/compensation/presentation/copy/compensationCopy";
import { settlementsCopy } from "@features/settlements/presentation/copy/settlementsCopy";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { formatDate } from "@shared/utils/dateUtils";
import type {
  BatchAssignmentConflict,
  BatchAssignmentPreview,
  BatchTemplateAssignmentPayload,
  TemplateAssignment,
} from "@features/compensation/domain";

const {
  mockPreviewBatchAssignments,
  mockGetAssignment,
  mockUpdateAssignment,
  mockDeleteAssignment,
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
  mockListTemplateVersions,
} = vi.hoisted(() => ({
  mockPreviewBatchAssignments: vi.fn(),
  mockGetAssignment: vi.fn(),
  mockUpdateAssignment: vi.fn(),
  mockDeleteAssignment: vi.fn(),
  mockListTemplateVersions: vi.fn(),
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
    activateTemplate: vi.fn(),
    deactivateTemplate: vi.fn(),
    createTemplateVersion: vi.fn(),
    listTemplateVersions: (...args: unknown[]) => mockListTemplateVersions(...args),
    listTemplateActivity: vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    }),
    listCorridors: (...args: unknown[]) => mockListCorridors(...args),
    getCorridorById: vi.fn(),
    createCorridor: vi.fn(),
    updateCorridor: vi.fn(),
    deleteCorridor: vi.fn(),
    listAssignments: (...args: unknown[]) => mockListAssignments(...args),
    batchCreateAssignments: (...args: unknown[]) => mockBatchAssignments(...args),
    previewBatchAssignments: (...args: unknown[]) => mockPreviewBatchAssignments(...args),
    getAssignment: (...args: unknown[]) => mockGetAssignment(...args),
    updateAssignment: (...args: unknown[]) => mockUpdateAssignment(...args),
    deleteAssignment: (...args: unknown[]) => mockDeleteAssignment(...args),
  },
}));

vi.mock("@features/settlements/infrastructure/settlementsApi", () => ({
  settlementsApi: {
    previewSettlement: (...args: unknown[]) => mockPreviewSettlement(...args),
    listAgreements: (...args: unknown[]) => mockListAgreements(...args),
    createSettlement: vi.fn(),
    createAgreement: vi.fn(),
    updateAgreement: vi.fn(),
    getSettings: vi.fn().mockResolvedValue({
      voboThresholdMxn: 0,
      activeApproverCount: 1,
      activeExecutorCount: 1,
    }),
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

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-accountant-1", fullName: "Contador General", role: "accountant" },
    isAuthenticated: true,
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
  status: "active" as const,
  version: 1,
  familyId: "tpl-1",
  supersedesTemplateId: null,
  lockedForEdit: false,
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
      allowanceType: "meals" as const,
      label: "Comidas",
      amount: 500,
      period: "weekly" as const,
      isMandatory: true,
    },
  ],
  deductions: [] as Array<{
    deductionType: "savings_fund";
    label: string;
    amount: number;
    period: "weekly";
    isMandatory: boolean;
  }>,
  corridorIds: ["cor-1"],
  corridors: [mockCorridor],
  activeAssignmentsCount: 1,
};

const mockCreatedTemplate = {
  id: "tpl-new",
  name: "Esquema nuevo smoke",
  description: "Alta desde hub",
  isActive: false,
  status: "draft" as const,
  version: 1,
  familyId: "tpl-new",
  supersedesTemplateId: null,
  lockedForEdit: false,
  rules: [] as typeof mockTemplate.rules,
  fixedAllowances: [] as typeof mockTemplate.fixedAllowances,
  deductions: [] as typeof mockTemplate.deductions,
  corridorIds: [] as string[],
  corridors: [] as typeof mockTemplate.corridors,
  activeAssignmentsCount: 0,
};

const compensationRoutes = (
  <>
    <Route element={<OperatorPaymentsHubLayout />}>
      <Route path="/finance/compensation" element={<CompensationHubLayout />}>
        <Route path="templates" element={<CompensationTemplateListPage />} />
        <Route path="templates/:id" element={<CompensationTemplateDetailRedirect />} />
        <Route path="corridors" element={<CorridorTariffsListPage />} />
      </Route>
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
    mockListTemplateVersions.mockResolvedValue([]);
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

    expect(screen.getByRole("heading", { name: /Pagos a operadores/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Tarifas$/i })).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: /Nueva tarifa/i }));

    expect(
      screen.getByRole("heading", { name: /Nueva tarifa de pago/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Desde cero/i }));

    const nameInput = await screen.findByLabelText("Nombre");
    await user.type(nameInput, "Esquema nuevo smoke");
    await user.click(screen.getByRole("button", { name: /Crear y configurar/i }));

    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Esquema nuevo smoke",
      }),
    );
    expect(mockCreateTemplate.mock.calls[0]?.[0]).not.toHaveProperty("isActive");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Esquema nuevo smoke" }),
      ).toBeInTheDocument();
    });

    // ADR-0091 D5.1: identidad vive fuera del nav; secciones operativas en tabs.
    expect(
      screen.queryByRole("tab", { name: /Identidad/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("tab", { name: /Pago por viaje/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getAllByText("Borrador").length).toBeGreaterThan(0);
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
    // Vista previa vive en el footer del Builder (botón), no como link en el inspector.
    expect(
      screen.getByRole("button", { name: compensationCopy.builder.trySchemeTitle }),
    ).toBeInTheDocument();
  });

  it("2. Lista corredores foráneos con tarifa fija", async () => {
    const user = userEvent.setup();
    renderWithRoutes(
      "/finance/compensation/templates",
      <Routes>{compensationRoutes}</Routes>,
    );

    await user.click(screen.getByRole("tab", { name: /Tarifas por corredor/i }));

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
      screen.getByRole("table", { name: /Operadores asignados a la tarifa de pago/i }),
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
    expect(screen.getByTestId("template-operators-count-trigger")).toHaveTextContent(/^1$/);
    expect(screen.getByText(compensationCopy.templates.usage.ready)).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /^Editar$/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: "Operador foráneo" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Cuando viaje foráneo, pagar/i)).toBeInTheDocument();
    expect(screen.getByText(/Pago fijo de tarifa Comidas/i)).toBeInTheDocument();
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

    expect(
      screen.getByText(settlementsCopy.createPage.sections.agreementActiveLabel + ":"),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Operador foráneo — /)).toBeInTheDocument();
    // El nombre y monto del corredor viven en el title del badge; el texto visible es solo la etiqueta.
    const corridorBadge = screen.getByTitle(/^México → MTY — \$1,500\.00/);
    expect(corridorBadge).toHaveTextContent(
      settlementsCopy.createPage.trips.corridorBadgeLabel,
    );
    expect(screen.getByText(/Prestaciones fijas/i)).toBeInTheDocument();
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
      expect(screen.getByText(/Tarifa de pago aplicada/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Prestaciones fijas/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("$3,500.00").length).toBeGreaterThanOrEqual(1);
  });

  describe("W5: versiones reemplazadas", () => {
    const supersededTemplate = {
      ...mockTemplate,
      id: "tpl-v2",
      isActive: false,
      status: "inactive" as const,
      version: 2,
      familyId: "tpl-1",
      lockedForEdit: true,
      lockedReason: "superseded" as const,
      inactiveReason: "superseded" as const,
      supersededByTemplateId: "tpl-v3-borrada",
      inactivatedAt: "2026-10-01T15:00:00Z",
      activeAssignmentsCount: 2,
    };

    it("8. Catálogo → «Ver configuración» → aviso con versión activa → «Abrir versión 1»", async () => {
      const user = userEvent.setup();
      mockListTemplates.mockResolvedValue({
        data: [supersededTemplate],
        pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
      });
      mockGetTemplate.mockImplementation(async (id: string) =>
        id === "tpl-v2" ? supersededTemplate : mockTemplate,
      );
      mockListTemplateVersions.mockResolvedValue([mockTemplate, supersededTemplate]);

      renderWithRoutes(
        "/finance/compensation/templates",
        <Routes>{compensationRoutes}</Routes>,
      );

      expect(await screen.findByText(compensationCopy.templates.status.superseded)).toBeInTheDocument();
      expect(screen.getByText(compensationCopy.templates.usage.supersededPaying)).toBeInTheDocument();

      await user.click(screen.getByRole("link", { name: compensationCopy.templates.viewConfiguration }));

      const banner = await screen.findByTestId("builder-superseded-banner");
      expect(await within(banner).findByText("La versión activa hoy es la 1.")).toBeInTheDocument();
      expect(mockListTemplateVersions).toHaveBeenCalledWith("tpl-v2");
      expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();

      await user.click(within(banner).getByRole("link", { name: "Abrir versión 1" }));

      expect(await screen.findByRole("button", { name: "Guardar" })).toBeInTheDocument();
      expect(screen.queryByTestId("builder-superseded-banner")).not.toBeInTheDocument();
      expect(mockGetTemplate).toHaveBeenLastCalledWith("tpl-1");
    });

    it("9. 409 TEMPLATE_CONFIG_LOCKED superseded: la pantalla se bloquea sin recargar y el mensaje sigue visible", async () => {
      const user = userEvent.setup();
      const editableV1 = { ...mockTemplate, corridorIds: [] as string[], corridors: [] };
      const lockedV1 = {
        ...supersededTemplate,
        ...editableV1,
        isActive: false,
        status: "inactive" as const,
        lockedForEdit: true,
      };
      mockGetTemplate.mockResolvedValue(editableV1);
      mockUpdateTemplate.mockImplementation(async () => {
        mockGetTemplate.mockResolvedValue(lockedV1);
        throw new ApiError("Versión reemplazada", 409, "TEMPLATE_CONFIG_LOCKED", {
          reason: "superseded",
        });
      });

      renderWithRoutes(
        "/finance/compensation/templates/tpl-1/build",
        <Routes>{compensationRoutes}</Routes>,
      );

      const nameInput = await screen.findByLabelText("Nombre");
      await user.clear(nameInput);
      await user.type(nameInput, "Cambio en carrera");
      await user.click(screen.getByRole("button", { name: "Guardar" }));
      await waitFor(() => expect(mockUpdateTemplate).toHaveBeenCalledTimes(1));

      const message =
        "Esta versión ya fue reemplazada y tus cambios no se guardaron. Crea una nueva versión y vuelve a capturarlos.";
      expect(await screen.findByTestId("builder-superseded-banner")).toBeInTheDocument();
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
      expect(
        await screen.findByText("Ninguna versión de esta tarifa está activa hoy."),
      ).toBeInTheDocument();
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe("api#63: conflictos de vigencia en la asignación por lote", () => {
    const FERNANDO = "11111111-1111-4111-8111-111111111111";
    const ANA = "22222222-2222-4222-8222-222222222222";
    const LUIS = "33333333-3333-4333-8333-333333333333";
    const MARTA = "44444444-4444-4444-8444-444444444444";
    const FERNANDO_V1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const TEMPLATE_NAME = "Operador Foráneo Estándar";
    const NAMES: Record<string, string> = {
      [FERNANDO]: "Fernando Castillo",
      [ANA]: "Ana López",
      [LUIS]: "Luis Pérez",
      [MARTA]: "Marta Ríos",
    };
    const PAYABLES = { employeeId: ANA, periodStart: "2026-09-01", periodEnd: "2026-09-15" };
    const PAYABLES_QUERY = new URLSearchParams(PAYABLES).toString();
    const MENU_TRIGGER = compensationCopy.assignmentActions.openMenuSr;

    const v1 = {
      ...mockTemplate,
      id: "tpl-v1",
      name: TEMPLATE_NAME,
      version: 1,
      familyId: "tpl-v1",
      isActive: false,
      status: "inactive" as const,
      lockedForEdit: true,
      lockedReason: "superseded" as const,
      inactiveReason: "superseded" as const,
      supersededByTemplateId: "tpl-v2",
      activeAssignmentsCount: 1,
    };
    const v2 = {
      ...mockTemplate,
      id: "tpl-v2",
      name: TEMPLATE_NAME,
      version: 2,
      familyId: "tpl-v1",
      supersedesTemplateId: "tpl-v1",
      activeAssignmentsCount: 0,
    };

    let assignments: TemplateAssignment[];

    function assignmentOf(
      id: string,
      employeeId: string,
      templateId: string,
      effectiveFrom: string,
      effectiveTo: string | null = null,
    ): TemplateAssignment {
      return {
        id,
        employeeId,
        employeeFullName: NAMES[employeeId],
        templateId,
        templateName: TEMPLATE_NAME,
        effectiveFrom,
        effectiveTo,
        isActive: true,
      };
    }

    function blockedByV1(overrides: Partial<BatchAssignmentConflict>): BatchAssignmentConflict {
      return {
        employeeId: FERNANDO,
        code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
        message: "Mensaje de la API",
        reason: "previous_starts_on_or_after",
        employeeFullName: NAMES[FERNANDO],
        existingAssignmentId: FERNANDO_V1,
        existingTemplateId: "tpl-v1",
        existingTemplateName: TEMPLATE_NAME,
        existingTemplateVersion: 1,
        existingEffectiveFrom: "2026-09-01",
        existingEffectiveTo: null,
        closePreviousOn: null,
        suggestedEffectiveFrom: null,
        ...overrides,
      };
    }

    function previewOf(
      payload: BatchTemplateAssignmentPayload,
      conflicts: BatchAssignmentConflict[],
    ): BatchAssignmentPreview {
      return {
        wouldCreateCount: payload.employeeIds.length - conflicts.length,
        wouldSkipCount: conflicts.length,
        employees: [],
        conflicts,
        closures: [],
      };
    }

    function LocationProbe() {
      const { search } = useLocation();
      return <div data-testid="location-search" data-search={search} />;
    }

    function currentParams(): Record<string, string> {
      const search = screen.getByTestId("location-search").getAttribute("data-search") ?? "";
      return Object.fromEntries(new URLSearchParams(search));
    }

    function renderHub(path: string) {
      return renderWithRoutes(
        path,
        <>
          <Routes>{compensationRoutes}</Routes>
          <LocationProbe />
        </>,
      );
    }

    function catalogRow(versionLabel: string): HTMLElement {
      const row = screen
        .getAllByRole("row")
        .find((candidate) => within(candidate).queryByText(versionLabel));
      expect(row).toBeDefined();
      return row!;
    }

    function operatorsTable() {
      return screen.getByRole("table", { name: /Operadores asignados a la tarifa de pago/i });
    }

    beforeEach(() => {
      assignments = [];
      mockListTemplates.mockResolvedValue({
        data: [v2, v1],
        pagination: { total: 2, page: 1, limit: 100, totalPages: 1 },
      });
      mockGetTemplate.mockImplementation(async (id: string) => (id === "tpl-v1" ? v1 : v2));
      mockListAssignments.mockImplementation(async (params?: { templateId?: string }) => {
        const data = assignments.filter(
          (row) => !params?.templateId || row.templateId === params.templateId,
        );
        return { data, pagination: { total: data.length, page: 1, limit: 100, totalPages: 1 } };
      });
      mockGetAssignment.mockImplementation(async (id: string) => {
        const found = assignments.find((row) => row.id === id);
        if (!found) throw new ApiError("No encontrada", 404, "NOT_FOUND");
        return found;
      });
    });

    it("10. lote parcial: renglón con causa y salida antes y después de confirmar (criterios 1–4)", async () => {
      const user = userEvent.setup();
      assignments = [assignmentOf(FERNANDO_V1, FERNANDO, "tpl-v1", "2026-09-01", "2026-10-06")];
      const fernandoBlocked = blockedByV1({
        existingEffectiveTo: "2026-10-06",
        suggestedEffectiveFrom: "2026-10-07",
      });
      const blocksFernando = (payload: BatchTemplateAssignmentPayload) =>
        payload.effectiveFrom === "2026-09-01" && payload.employeeIds.includes(FERNANDO);
      mockPreviewBatchAssignments.mockImplementation(async (payload: BatchTemplateAssignmentPayload) =>
        previewOf(payload, blocksFernando(payload) ? [fernandoBlocked] : []),
      );
      mockBatchAssignments.mockImplementation(async (payload: BatchTemplateAssignmentPayload) => {
        const blocked = blocksFernando(payload);
        const created = payload.employeeIds
          .filter((id) => !(blocked && id === FERNANDO))
          .map((id) => assignmentOf(`asg-v2-${id}`, id, "tpl-v2", payload.effectiveFrom));
        assignments.push(...created);
        const conflicts = blocked ? [fernandoBlocked] : [];
        return { createdCount: created.length, skippedCount: conflicts.length, conflicts, created };
      });

      renderHub(
        `/finance/compensation/templates?operators=tpl-v2&assign=${FERNANDO},${ANA},${LUIS}&assignFrom=2026-09-01`,
      );
      const exitAction = `Asignar a Fernando Castillo desde el ${formatDate("2026-10-07")}`;

      // Criterio 1: antes de confirmar, nombre, versión, fechas, causa y salida.
      const preview = await screen.findByTestId("batch-preview-conflicts");
      expect(within(preview).getByText("Fernando Castillo")).toBeInTheDocument();
      expect(
        within(preview).getByText(
          `Ya está asignado a ${TEMPLATE_NAME} versión 1 del ${formatDate("2026-09-01")} al ${formatDate("2026-10-06")}. Esa asignación empieza el mismo día o después que la nueva, así que no se puede cerrar antes de que empiece.`,
        ),
      ).toBeInTheDocument();
      expect(within(preview).getByRole("button", { name: exitAction })).toBeInTheDocument();

      // Criterio 4: se asignan dos, la selección queda con el bloqueado y la tabla de fondo ya los muestra.
      await user.click(screen.getByRole("button", { name: "Confirmar asignación" }));
      const partial = await screen.findByTestId("batch-assignment-result");
      expect(within(partial).getByText("Se asignaron 2 de 3 operadores")).toBeInTheDocument();
      expect(within(partial).getByText("Fernando Castillo")).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Seleccionar operadores" })).toHaveTextContent(
        "1 operador seleccionado",
      );
      expect(screen.getByRole("heading", { name: /Asignación masiva/i })).toBeInTheDocument();
      expect(await within(operatorsTable()).findByText("Ana López")).toBeInTheDocument();
      expect(within(operatorsTable()).getByText("Luis Pérez")).toBeInTheDocument();

      // Criterio 2: después de confirmar el bloqueado, el sheet sigue abierto con el mismo renglón.
      await user.click(screen.getByRole("button", { name: "Confirmar asignación" }));
      await waitFor(() => expect(mockBatchAssignments).toHaveBeenCalledTimes(2));
      const rejected = await within(screen.getByTestId("batch-assignment-result")).findByText(
        "No se asignó ningún operador",
      );
      const notice = screen.getByTestId("batch-assignment-result");
      expect(rejected).toBeInTheDocument();
      expect(within(notice).getByText("Fernando Castillo")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Asignación masiva/i })).toBeInTheDocument();

      // Criterio 3: la salida cambia «Vigente desde», la vista previa queda limpia y nada se guarda.
      await user.click(screen.getAllByRole("button", { name: exitAction })[0]);
      expect(screen.getByRole("button", { name: /Vigente desde/i })).toHaveTextContent(
        formatDate("2026-10-07"),
      );
      await waitFor(() =>
        expect(mockPreviewBatchAssignments).toHaveBeenLastCalledWith(
          expect.objectContaining({ employeeIds: [FERNANDO], effectiveFrom: "2026-10-07" }),
        ),
      );
      await waitFor(() =>
        expect(screen.queryByTestId("batch-preview-conflicts")).not.toBeInTheDocument(),
      );
      expect(mockBatchAssignments).toHaveBeenCalledTimes(2);

      await user.click(screen.getByRole("button", { name: "Confirmar asignación" }));
      await waitFor(() => expect(mockBatchAssignments).toHaveBeenCalledTimes(3));
      expect(mockBatchAssignments).toHaveBeenLastCalledWith(
        expect.objectContaining({
          templateId: "tpl-v2",
          employeeIds: [FERNANDO],
          effectiveFrom: "2026-10-07",
        }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("heading", { name: /Asignación masiva/i })).not.toBeInTheDocument(),
      );
      expect(assignments.find((row) => row.id === FERNANDO_V1)).toMatchObject({
        effectiveTo: "2026-10-06",
        isActive: true,
      });
      expect(mockUpdateAssignment).not.toHaveBeenCalled();
      expect(mockDeleteAssignment).not.toHaveBeenCalled();
    });

    it("11. ir a la asignación que bloquea y volver por URL (criterios 16–18, 20, 22)", async () => {
      const user = userEvent.setup();
      assignments = [assignmentOf(FERNANDO_V1, FERNANDO, "tpl-v1", "2026-09-01")];
      mockPreviewBatchAssignments.mockImplementation(async (payload: BatchTemplateAssignmentPayload) =>
        previewOf(payload, payload.employeeIds.includes(FERNANDO) ? [blockedByV1({})] : []),
      );

      renderHub(
        `/finance/compensation/templates?operators=tpl-v2&assign=${FERNANDO},${ANA}&assignFrom=2026-09-01&${PAYABLES_QUERY}`,
      );
      const pendingBanner = /Este operador aún no tiene tarifa de pago/i;
      const coverageHint = /Para cubrir el pago del/i;
      const goToBlocking = `Ir a su asignación en ${TEMPLATE_NAME} versión 1`;
      const v1Title = `Operadores — ${TEMPLATE_NAME} versión 1`;
      const v2Title = `Operadores — ${TEMPLATE_NAME} versión 2`;

      expect(await screen.findByText(coverageHint)).toBeInTheDocument();
      expect(screen.getByText(pendingBanner)).toBeInTheDocument();

      // Criterio 16: un solo sheet (v1), fila resaltada y visible, foco en su «···».
      await user.click(await screen.findByRole("button", { name: goToBlocking }));
      expect(await screen.findByRole("heading", { name: v1Title })).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { name: /^Operadores —/ })).toHaveLength(1);
      expect(screen.queryByRole("heading", { name: /Asignación masiva/i })).not.toBeInTheDocument();
      const focusedRow = await waitFor(() => {
        const row = document.querySelector<HTMLElement>('[data-focused="true"]');
        expect(row).not.toBeNull();
        return row!;
      });
      expect(focusedRow).toHaveTextContent("Fernando Castillo");
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
      await waitFor(() =>
        expect(within(focusedRow).getByRole("button", { name: MENU_TRIGGER })).toHaveFocus(),
      );
      expect(currentParams()).toEqual({
        operators: "tpl-v1",
        focus: FERNANDO_V1,
        returnTo: "tpl-v2",
        returnAssign: `${FERNANDO},${ANA}`,
        returnFrom: "2026-09-01",
        ...PAYABLES,
      });

      // Criterio 17: ningún diálogo y ninguna asignación cambia.
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(mockBatchAssignments).not.toHaveBeenCalled();
      expect(mockUpdateAssignment).not.toHaveBeenCalled();
      expect(mockDeleteAssignment).not.toHaveBeenCalled();

      // Criterios 18 y 22: aviso con «Volver», que reabre el lote con operadores, fecha y contexto de Por pagar.
      const focusNotice = screen.getByTestId("operators-sheet-focus-notice");
      expect(within(focusNotice).getByText("Asignación de Fernando Castillo")).toBeInTheDocument();
      expect(screen.getByText(pendingBanner)).toBeInTheDocument();
      await user.click(
        within(focusNotice).getByRole("button", { name: `Volver a ${TEMPLATE_NAME} versión 2` }),
      );

      expect(await screen.findByRole("heading", { name: /Asignación masiva/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: v2Title })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Seleccionar operadores" })).toHaveTextContent(
        "2 operadores seleccionados",
      );
      expect(screen.getByRole("button", { name: /Vigente desde/i })).toHaveTextContent(
        formatDate("2026-09-01"),
      );
      expect(screen.getByText(coverageHint)).toBeInTheDocument();
      expect(screen.getByText(pendingBanner)).toBeInTheDocument();
      expect(screen.queryByTestId("operators-sheet-focus-notice")).not.toBeInTheDocument();
      expect(currentParams()).toEqual({
        operators: "tpl-v2",
        assign: `${FERNANDO},${ANA}`,
        assignFrom: "2026-09-01",
        ...PAYABLES,
      });

      // Criterio 20: cerrar el destino con la X limpia foco y regreso; al reabrir, nada resaltado.
      await user.click(await screen.findByRole("button", { name: goToBlocking }));
      expect(await screen.findByRole("heading", { name: v1Title })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Cerrar" }));
      await waitFor(() =>
        expect(screen.queryByRole("heading", { name: /^Operadores —/ })).not.toBeInTheDocument(),
      );
      expect(currentParams()).toEqual(PAYABLES);

      await user.click(
        within(catalogRow(compensationCopy.templates.versionLabel(1))).getByRole("button", {
          name: /^Operadores$/,
        }),
      );
      expect(await screen.findByRole("heading", { name: v1Title })).toBeInTheDocument();
      expect(await within(operatorsTable()).findByText("Fernando Castillo")).toBeInTheDocument();
      expect(document.querySelector("[data-focused]")).toBeNull();
      expect(screen.queryByTestId("operators-sheet-focus-notice")).not.toBeInTheDocument();
    });

    describe("con «hoy» fijo en CDMX (08 oct 2026)", () => {
      beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-10-08T18:00:00Z"));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("12. «2 · +1 programada» en el listado y «Concluida» en el sheet (criterios 8, 10, 11)", async () => {
        const user = userEvent.setup();
        const v2WithCounts = { ...v2, activeAssignmentsCount: 2, scheduledAssignmentsCount: 1 };
        const v1WithoutCurrent = { ...v1, activeAssignmentsCount: 0 };
        mockListTemplates.mockResolvedValue({
          data: [v2WithCounts, v1WithoutCurrent],
          pagination: { total: 2, page: 1, limit: 100, totalPages: 1 },
        });
        mockGetTemplate.mockImplementation(async (id: string) =>
          id === "tpl-v1" ? v1WithoutCurrent : v2WithCounts,
        );
        assignments = [
          assignmentOf(FERNANDO_V1, FERNANDO, "tpl-v1", "2026-09-01", "2026-10-06"),
          assignmentOf("asg-ana", ANA, "tpl-v2", "2026-10-07"),
          assignmentOf("asg-luis", LUIS, "tpl-v2", "2026-08-01"),
          assignmentOf("asg-marta", MARTA, "tpl-v2", "2026-11-01"),
        ];

        renderHub("/finance/compensation/templates");

        // Criterio 8: vigentes + programadas, con tooltip accesible por teclado.
        await screen.findAllByText(TEMPLATE_NAME);
        const v2Row = catalogRow(compensationCopy.templates.versionLabel(2));
        const count = within(v2Row).getByTestId("template-operators-count-trigger");
        expect(count).toHaveTextContent(/^2 · \+1 programada$/);
        expect(count).toHaveAttribute("tabindex", "0");
        act(() => count.focus());
        expect(
          await screen.findByRole("tooltip", {
            name: "2 operadores cobran con esta versión hoy. 1 más empieza después.",
          }),
        ).toBeInTheDocument();

        // Criterio 11: filas «Vigente» = número de la columna; filas «Programada» = «+k».
        await user.click(within(v2Row).getByRole("button", { name: /^Operadores$/ }));
        expect(
          await screen.findByRole("heading", { name: `Operadores — ${TEMPLATE_NAME} versión 2` }),
        ).toBeInTheDocument();
        await within(operatorsTable()).findByText("Marta Ríos");
        expect(within(operatorsTable()).getAllByText("Vigente")).toHaveLength(2);
        expect(within(operatorsTable()).getAllByText("Programada")).toHaveLength(1);

        // Criterio 10: la de Fernando en v1 (01 sep – 06 oct) aparece «Concluida» el 08 oct.
        await user.click(screen.getByRole("button", { name: "Cerrar" }));
        await waitFor(() =>
          expect(screen.queryByRole("heading", { name: /^Operadores —/ })).not.toBeInTheDocument(),
        );
        await user.click(
          within(catalogRow(compensationCopy.templates.versionLabel(1))).getByRole("button", {
            name: /^Operadores$/,
          }),
        );
        const fernandoRow = (await within(operatorsTable()).findByText("Fernando Castillo")).closest(
          "tr",
        )!;
        expect(within(fernandoRow).getByText("Concluida")).toBeInTheDocument();
        expect(within(fernandoRow).queryByText("Vigente")).not.toBeInTheDocument();
      });
    });
  });
});
