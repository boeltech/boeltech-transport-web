import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompensationSchemeBuilderPage } from "./CompensationSchemeBuilderPage";
import type { CompensationTemplate } from "../../domain/entities";

const {
  mockUseCompensationTemplate,
  mockMutateAsync,
  mockHasPermission,
  mockUseCorridorTariffs,
  mockUseBranches,
} = vi.hoisted(() => ({
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
            element={<div>Nueva liquidación</div>}
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
  });

  it("monta el Builder con plantilla y secciones operativas (sin Identidad)", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Operador foráneo" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Define cuánto se le paga a este operador/i),
    ).toBeInTheDocument();

    const desktopNav = screen.getByTestId("builder-section-nav-desktop");
    expect(
      within(desktopNav).queryByRole("tab", { name: /Identidad/i }),
    ).not.toBeInTheDocument();
    expect(
      within(desktopNav).getByRole("tab", { name: /Pago por tipo de viaje/i }),
    ).toBeInTheDocument();
    expect(
      within(desktopNav).getByRole("tab", { name: /Pagos fijos adicionales/i }),
    ).toBeInTheDocument();
    expect(
      within(desktopNav).getByRole("tab", { name: /Rutas con precio fijo/i }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Nombre")).toHaveValue("Operador foráneo");
    expect(screen.getByLabelText("Esquema activo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Esquema demo")).toBeInTheDocument();

    const inspector = screen.getByTestId("builder-inspector-desktop");
    expect(within(inspector).queryByText(/Resumen en vivo/i)).not.toBeInTheDocument();
    expect(within(inspector).queryByText(/Completitud/i)).not.toBeInTheDocument();
    expect(within(inspector).getByText(/Lo que se está armando/i)).toBeInTheDocument();
    expect(within(inspector).getByText(/Cuando viaje foráneo, pagar/i)).toBeInTheDocument();
    expect(within(inspector).getByText(/Listo para liquidar/i)).toBeInTheDocument();
    expect(
      within(inspector).queryByRole("link", { name: /Vista previa/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Vista previa de liquidación" }),
    ).toBeInTheDocument();
  });

  it("arranca en Pago por tipo de viaje", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 2, name: "Pago por tipo de viaje" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Elige un tipo de viaje y cuánto se paga/i),
    ).toBeInTheDocument();
  });

  it("navega entre secciones sin orden lineal", async () => {
    const user = userEvent.setup();
    renderPage();

    const desktopNav = screen.getByTestId("builder-section-nav-desktop");
    await user.click(
      within(desktopNav).getByRole("tab", { name: /Rutas con precio fijo/i }),
    );

    expect(
      screen.getByText(/Si el viaje va por una de estas rutas/i),
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
        /Para poder liquidar con este esquema, agrega al menos un tipo de viaje/i,
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

    expect(screen.getByText("Esquema no encontrado")).toBeInTheDocument();
  });
});
