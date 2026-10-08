import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompensationSchemeBuilderPage } from "./CompensationSchemeBuilderPage";
import type { CompensationTemplate } from "../../domain/entities";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { compensationCopy } from "../copy/compensationCopy";

const {
  mockUseCompensationTemplate,
  mockMutateAsync,
  mockHasPermission,
  mockUseCorridorTariffs,
  mockUseBranches,
  mockUseTemplateVersions,
} = vi.hoisted(() => ({
  mockUseTemplateVersions: vi.fn(),
  mockUseCompensationTemplate: vi.fn(),
  mockMutateAsync: vi.fn(),
  mockHasPermission: vi.fn(() => true),
  mockUseCorridorTariffs: vi.fn(),
  mockUseBranches: vi.fn(),
}));

vi.mock("../../application/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../application/hooks")>();
  return {
    ...actual,
    useCompensationTemplate: (...args: unknown[]) =>
      mockUseCompensationTemplate(...args),
    useUpdateCompensationTemplate: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
    useActivateCompensationTemplate: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useCreateCompensationTemplateVersion: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useTemplateVersions: (...args: unknown[]) => mockUseTemplateVersions(...args),
    useTemplateActivity: () => ({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      isLoading: false,
    }),
    useCorridorTariffs: (...args: unknown[]) => mockUseCorridorTariffs(...args),
    useTemplateAssignments: () => ({
      data: {
        data: [
          {
            id: "assign-1",
            employeeId: "emp-1",
            employeeFullName: "Roberto González",
            templateId: "tpl-1",
            isActive: true,
            effectiveFrom: "2026-08-01",
          },
        ],
      },
      isLoading: false,
    }),
  };
});

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: (...args: unknown[]) => mockUseBranches(...args),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (...args: unknown[]) => mockHasPermission(...args),
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const template: CompensationTemplate = {
  id: "tpl-1",
  name: "Operador foráneo",
  description: "Esquema demo",
  isActive: true,
  status: "active",
  version: 1,
  familyId: "tpl-1",
  supersedesTemplateId: null,
  lockedForEdit: false,
  rules: [
    {
      routeType: "long_haul",
      commissionType: "rate_per_km",
      rateValue: 3,
      minimumGuaranteedAmount: 400,
    },
  ],
  fixedAllowances: [
    {
      allowanceType: "meals",
      label: "Comidas",
      amount: 500,
      period: "weekly",
      isMandatory: true,
    },
  ],
  deductions: [],
  corridorIds: [],
  corridors: [],
  activeAssignmentsCount: 0,
};

function renderPage(initialPath = "/finance/compensation/templates/tpl-1/build") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/finance/compensation/templates/:id/build"
            element={<CompensationSchemeBuilderPage />}
          />
          <Route
            path="/finance/compensation/templates"
            element={<div>Lista de esquemas</div>}
          />
          <Route
            path="/finance/settlements/new"
            element={<div>Armar pago</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CompensationSchemeBuilderPage", () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({ data: template });
    mockUseCompensationTemplate.mockReturnValue({
      data: template,
      isLoading: false,
      isError: false,
    });
    mockUseCorridorTariffs.mockReturnValue({ data: { data: [] } });
    mockUseBranches.mockReturnValue({ data: { data: [] } });
    mockUseTemplateVersions.mockReturnValue({ data: [], isLoading: false, isError: false });
  });

  it("monta el Builder con plantilla y secciones operativas (sin Identidad)", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Operador foráneo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Define cuánto se paga a los operadores/i),
    ).toBeInTheDocument();

    const desktopNav = screen.getByTestId("builder-section-nav-desktop");
    expect(
      within(desktopNav).queryByRole("tab", { name: /Identidad/i }),
    ).not.toBeInTheDocument();
    expect(
      within(desktopNav).getByRole("tab", { name: /Pago por viaje/i }),
    ).toBeInTheDocument();
    expect(
      within(desktopNav).getByRole("tab", { name: /Extras fijos/i }),
    ).toBeInTheDocument();
    expect(
      within(desktopNav).getByRole("tab", { name: /Tarifas por corredor/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Nombre")).toHaveValue("Operador foráneo");
    expect(screen.getAllByText("Activa").length).toBeGreaterThan(0);
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tarifa activa")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Esquema demo")).toBeInTheDocument();

    const inspector = screen.getByTestId("builder-inspector-desktop");
    expect(within(inspector).queryByText(/Resumen en vivo/i)).not.toBeInTheDocument();
    expect(within(inspector).queryByText(/Completitud/i)).not.toBeInTheDocument();
    expect(within(inspector).getByText(/Resumen en tiempo real/i)).toBeInTheDocument();
    expect(within(inspector).getByText(/Cada extra fijo se suma una vez/i)).toBeInTheDocument();
    expect(within(inspector).getByText(/no divide el monto/i)).toBeInTheDocument();
    expect(within(inspector).getByText(/Cuando viaje foráneo, pagar/i)).toBeInTheDocument();
    expect(within(inspector).getByText(/Tarifa lista para usar/i)).toBeInTheDocument();
    expect(
      within(inspector).queryByRole("link", { name: /Vista previa/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Vista previa del pago" }),
    ).toBeInTheDocument();
  });

  it("arranca en Pago por viaje", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 2, name: "Pago por viaje" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cada clase de ruta puede tener su propia regla de pago/i),
    ).toBeInTheDocument();
  });

  it("navega entre secciones sin orden lineal", async () => {
    const user = userEvent.setup();
    renderPage();

    const desktopNav = screen.getByTestId("builder-section-nav-desktop");
    await user.click(
      within(desktopNav).getByRole("tab", { name: /Extras fijos/i }),
    );

    expect(
      screen.getByText(/Montos fijos que se suman al pago del operador/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Descuentos al operador/i),
    ).toBeInTheDocument();

    await user.click(
      within(desktopNav).getByRole("tab", { name: /Tarifas por corredor/i }),
    );

    expect(
      screen.getByText(/Si el viaje coincide con una de estas rutas/i),
    ).toBeInTheDocument();
  });

  it("muestra alert incompleto en el inspector cuando falta pago y rutas", () => {
    mockUseCompensationTemplate.mockReturnValue({
      data: {
        ...template,
        rules: [],
        corridorIds: [],
        corridors: [],
        fixedAllowances: [],
      },
      isLoading: false,
      isError: false,
    });

    renderPage();

    const inspector = screen.getByTestId("builder-inspector-desktop");
    expect(
      within(inspector).getByText(
        /Para usar esta tarifa, agrega al menos una regla de pago/i,
      ),
    ).toBeInTheDocument();
  });

  it("guarda vía mutación al confirmar footer", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.clear(screen.getByLabelText("Nombre"));
    await user.type(screen.getByLabelText("Nombre"), "Esquema actualizado");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(mockMutateAsync).toHaveBeenCalled();
    expect(mockMutateAsync.mock.calls[0]?.[0]).toMatchObject({
      id: "tpl-1",
      name: "Esquema actualizado",
      deductions: [],
      fixedAllowances: expect.arrayContaining([
        expect.objectContaining({ allowanceType: "meals", label: "Comidas" }),
      ]),
    });
  });

  it("descarta sin confirmar cuando no hay cambios", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Descartar" }));

    expect(screen.getByText("Lista de esquemas")).toBeInTheDocument();
  });

  it("muestra not found cuando falla la carga", () => {
    mockUseCompensationTemplate.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderPage();

    expect(screen.getByText("Tarifa no encontrada")).toBeInTheDocument();
  });
});

describe("CompensationSchemeBuilderPage — versiones reemplazadas y desactivadas (W5)", () => {
  const builderCopy = compensationCopy.builder;
  const superseded: CompensationTemplate = {
    ...template,
    id: "tpl-v2",
    isActive: false,
    status: "inactive",
    version: 2,
    lockedForEdit: true,
    lockedReason: "superseded",
    inactiveReason: "superseded",
    supersededByTemplateId: "tpl-v3-borrada",
    inactivatedAt: "2026-10-01T15:00:00Z",
    activeAssignmentsCount: 3,
  };
  const activeV1: CompensationTemplate = {
    ...template,
    id: "tpl-v1",
    version: 1,
  };

  function templatesById(byId: Record<string, CompensationTemplate>) {
    mockUseCompensationTemplate.mockImplementation((id: string) => ({
      data: byId[id],
      isLoading: false,
      isError: !byId[id],
    }));
  }

  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
    mockMutateAsync.mockReset();
    mockUseCorridorTariffs.mockReturnValue({ data: { data: [] } });
    mockUseBranches.mockReturnValue({ data: { data: [] } });
    mockUseTemplateVersions.mockReturnValue({
      data: [activeV1, superseded],
      isLoading: false,
      isError: false,
    });
    templatesById({ "tpl-v2": superseded, "tpl-v1": activeV1 });
  });

  it("criterio 5: v2 reemplazada con v1 activa — aviso, «La versión activa hoy es la 1.» y «Abrir versión 1» abre v1", async () => {
    const user = userEvent.setup();
    renderPage("/finance/compensation/templates/tpl-v2/build");

    const banner = screen.getByTestId("builder-superseded-banner");
    expect(within(banner).getByText(builderCopy.supersededBanner.title)).toBeInTheDocument();
    expect(
      within(banner).getByText(
        "Sigue calculando el pago de 3 operadores asignados a esta versión hasta que los reasignes, pero su configuración ya no se puede cambiar. Para cambiarla, crea una nueva versión.",
      ),
    ).toBeInTheDocument();
    expect(within(banner).getByText("La versión activa hoy es la 1.")).toBeInTheDocument();
    expect(banner).not.toHaveTextContent(/nueva versión activa|la nueva/i);
    expect(
      within(banner).getByRole("button", { name: builderCopy.lockedBannerAction }),
    ).toBeInTheDocument();
    expect(screen.queryByText(builderCopy.lockedBannerTitle)).not.toBeInTheDocument();
    expect(screen.getAllByText("Reemplazada").length).toBeGreaterThan(0);
    expect(mockUseTemplateVersions).toHaveBeenCalledWith("tpl-v2", true);

    const openV1 = within(banner).getByRole("link", { name: "Abrir versión 1" });
    expect(openV1).toHaveAttribute("href", "/finance/compensation/templates/tpl-v1/build");
    await user.click(openV1);

    expect(mockUseCompensationTemplate).toHaveBeenLastCalledWith("tpl-v1");
    expect(screen.queryByTestId("builder-superseded-banner")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("M sale de la versión activa hoy, no de supersededByTemplateId, y puede tener otro nombre", () => {
    mockUseTemplateVersions.mockReturnValue({
      data: [{ ...activeV1, name: "Operador foráneo 2026" }, superseded],
      isLoading: false,
      isError: false,
    });
    renderPage("/finance/compensation/templates/tpl-v2/build");

    const banner = screen.getByTestId("builder-superseded-banner");
    expect(
      within(banner).getByText("La versión activa hoy es Operador foráneo 2026 versión 1."),
    ).toBeInTheDocument();
    expect(within(banner).getByRole("link", { name: "Abrir versión 1" })).toHaveAttribute(
      "href",
      "/finance/compensation/templates/tpl-v1/build",
    );
  });

  it.each([
    [1, "Sigue calculando el pago de 1 operador asignado a esta versión hasta que lo reasignes, pero su configuración ya no se puede cambiar. Para cambiarla, crea una nueva versión."],
    [0, "Hoy no tiene operadores asignados y su configuración ya no se puede cambiar. Para cambiarla, crea una nueva versión."],
  ])("aviso de reemplazada con %i operadores", (count, expected) => {
    templatesById({ "tpl-v2": { ...superseded, activeAssignmentsCount: count } });
    renderPage("/finance/compensation/templates/tpl-v2/build");

    expect(
      within(screen.getByTestId("builder-superseded-banner")).getByText(expected),
    ).toBeInTheDocument();
  });

  it("criterio 6: sin versión activa — «Ninguna versión…» y solo «Crear nueva versión»", () => {
    mockUseTemplateVersions.mockReturnValue({
      data: [superseded],
      isLoading: false,
      isError: false,
    });
    renderPage("/finance/compensation/templates/tpl-v2/build");

    const banner = screen.getByTestId("builder-superseded-banner");
    expect(
      within(banner).getByText("Ninguna versión de esta tarifa está activa hoy."),
    ).toBeInTheDocument();
    expect(within(banner).queryByRole("link")).not.toBeInTheDocument();
    expect(within(banner).getAllByRole("button")).toHaveLength(1);
    expect(
      within(banner).getByRole("button", { name: builderCopy.lockedBannerAction }),
    ).toBeInTheDocument();
  });

  it("cargando versiones: sin frase de versión activa y solo «Crear nueva versión»", () => {
    mockUseTemplateVersions.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderPage("/finance/compensation/templates/tpl-v2/build");

    const banner = screen.getByTestId("builder-superseded-banner");
    expect(within(banner).queryByText(/versión activa hoy|Ninguna versión/)).not.toBeInTheDocument();
    expect(within(banner).queryByRole("link")).not.toBeInTheDocument();
    expect(within(banner).getAllByRole("button")).toHaveLength(1);
  });

  it.each([
    ["locked_reason ausente (API anterior)", {}],
    ["used_in_settlements", { lockedReason: "used_in_settlements" as const }],
  ])("criterio 7: bloqueada con %s conserva el aviso actual palabra por palabra", (_label, extra) => {
    templatesById({ "tpl-1": { ...template, lockedForEdit: true, ...extra } });
    renderPage();

    expect(screen.getByText("Esta tarifa ya fue utilizada en pagos")).toBeInTheDocument();
    expect(
      screen.getByText(
        "La configuración está bloqueada. Crea una nueva versión para cambiar el pago.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("builder-superseded-banner")).not.toBeInTheDocument();
    expect(mockUseTemplateVersions).toHaveBeenCalledWith("tpl-1", false);
  });

  it("criterio 8: 409 superseded — mensaje persistente y la pantalla pasa a bloqueada sin recargar", async () => {
    const user = userEvent.setup();
    const editable: CompensationTemplate = { ...template, id: "tpl-v2", version: 2 };
    templatesById({ "tpl-v2": editable });
    mockUseTemplateVersions.mockReturnValue({ data: [], isLoading: false, isError: false });
    mockMutateAsync.mockImplementation(async () => {
      templatesById({ "tpl-v2": superseded });
      throw new ApiError("Versión reemplazada", 409, "TEMPLATE_CONFIG_LOCKED", {
        reason: "superseded",
      });
    });
    renderPage("/finance/compensation/templates/tpl-v2/build");

    await user.clear(screen.getByLabelText("Nombre"));
    await user.type(screen.getByLabelText("Nombre"), "Cambio en carrera");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    const message =
      "Esta versión ya fue reemplazada y tus cambios no se guardaron. Crea una nueva versión y vuelve a capturarlos.";
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByTestId("builder-superseded-banner")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("409 sin details.reason conserva el mensaje actual", async () => {
    const user = userEvent.setup();
    templatesById({ "tpl-1": template });
    mockMutateAsync.mockRejectedValue(
      new ApiError("Bloqueada", 409, "TEMPLATE_CONFIG_LOCKED"),
    );
    renderPage();

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(
        "Esta tarifa ya fue utilizada en pagos. Crea una nueva versión para editarla.",
      ),
    ).toBeInTheDocument();
  });

  it("criterio 9: desactivada con 2 operadores — aviso y «Ver operadores»", () => {
    templatesById({
      "tpl-1": {
        ...template,
        isActive: false,
        status: "inactive",
        inactiveReason: "manual",
        activeAssignmentsCount: 2,
      },
    });
    renderPage();

    const banner = screen.getByTestId("builder-deactivated-operators-banner");
    expect(
      within(banner).getByText("Versión desactivada con operadores asignados"),
    ).toBeInTheDocument();
    expect(
      within(banner).getByText(
        "2 operadores siguen asignados a esta versión y no pueden cobrar con ella. Reasígnalos a otra versión para que puedan cobrar.",
      ),
    ).toBeInTheDocument();
    expect(within(banner).getByRole("link", { name: "Ver operadores" })).toHaveAttribute(
      "href",
      "/finance/compensation/templates?operators=tpl-1",
    );
    expect(screen.getAllByText("Desactivada").length).toBeGreaterThan(0);
  });

  it("desactivada con 1 operador usa singular", () => {
    templatesById({
      "tpl-1": {
        ...template,
        isActive: false,
        status: "inactive",
        inactiveReason: null,
        activeAssignmentsCount: 1,
      },
    });
    renderPage();

    expect(
      screen.getByText(
        "1 operador sigue asignado a esta versión y no puede cobrar con ella. Reasígnalo a otra versión para que pueda cobrar.",
      ),
    ).toBeInTheDocument();
  });

  it.each([
    ["desactivada con 0 operadores", { inactiveReason: "manual" as const, activeAssignmentsCount: 0 }],
    ["inactiva sin motivo (API anterior)", { activeAssignmentsCount: 2 }],
  ])("criterio 9: %s no muestra aviso", (_label, extra) => {
    templatesById({
      "tpl-1": { ...template, isActive: false, status: "inactive", ...extra },
    });
    renderPage();

    expect(screen.queryByTestId("builder-deactivated-operators-banner")).not.toBeInTheDocument();
  });
});
