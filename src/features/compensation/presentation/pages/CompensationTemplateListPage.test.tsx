import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BatchAssignmentConflict, TemplateAssignment } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { makeCompensationTemplate } from "../utils/makeCompensationTemplate";
import { CompensationTemplateListPage } from "./CompensationTemplateListPage";

const copy = compensationCopy.templates;

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;

const mockNavigate = vi.fn();
const mockBatchMutate = vi.fn();
const mockRefetchTemplates = vi.fn();

const {
  mockUseCompensationTemplates,
  mockUseCompensationTemplate,
  mockUsePreview,
  mockUseTemplateAssignments,
  mockUseTemplateVersions,
} = vi.hoisted(() => ({
  mockUseCompensationTemplates: vi.fn(),
  mockUseCompensationTemplate: vi.fn(),
  mockUsePreview: vi.fn(),
  mockUseTemplateAssignments: vi.fn(),
  mockUseTemplateVersions: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../application/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../application/hooks")>();
  return {
    ...actual,
    useCompensationTemplates: (...args: unknown[]) => mockUseCompensationTemplates(...args),
    useCompensationTemplate: (...args: unknown[]) => mockUseCompensationTemplate(...args),
    useCreateCompensationTemplate: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useBatchCreateTemplateAssignments: () => ({
      mutateAsync: mockBatchMutate,
      isPending: false,
    }),
    useBatchAssignmentPreview: (...args: unknown[]) => mockUsePreview(...args),
    useDeleteCompensationTemplate: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useTemplateAssignments: (...args: unknown[]) => mockUseTemplateAssignments(...args),
    useTemplateAssignment: () => ({ data: undefined, isError: false }),
    useTemplateVersions: (...args: unknown[]) => mockUseTemplateVersions(...args),
  };
});

vi.mock("@features/employees", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/employees")>();
  return {
    ...actual,
    useEmployee: () => ({
      data: {
        data: {
          fullName: "Juan Pérez",
        },
      },
    }),
  };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
    useMediaQuery: (query: string) => query !== "(max-width: 1023px)",
  };
});

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [] } }),
}));

vi.mock("../../application/hooks/useCorridors", () => ({
  useCorridorTariffs: () => ({ data: { data: [] } }),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search" data-search={location.search} />;
}

function currentParams(): Record<string, string> {
  const search = screen.getByTestId("location-search").getAttribute("data-search") ?? "";
  return Object.fromEntries(new URLSearchParams(search));
}

function renderPage(initialPath = "/finance/compensation/templates") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/finance/compensation/templates" element={<CompensationTemplateListPage />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Última consulta del listado (la de `page_size=1` es el conteo de D23). */
function listQuery(): Record<string, unknown> | undefined {
  const calls = mockUseCompensationTemplates.mock.calls.filter(
    ([params]) => (params as { pageSize?: number } | undefined)?.pageSize !== 1,
  );
  return calls.at(-1)?.[0] as Record<string, unknown> | undefined;
}

function assignmentsPage(rows: TemplateAssignment[]) {
  return { data: { data: rows }, isLoading: false, isSuccess: true, isError: false, refetch: vi.fn() };
}

describe("CompensationTemplateListPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockBatchMutate.mockReset();
    mockBatchMutate.mockResolvedValue({
      createdCount: 1,
      skippedCount: 0,
      conflicts: [],
      created: [],
    });
    mockRefetchTemplates.mockReset();
    mockUseCompensationTemplate.mockReset();
    mockUseCompensationTemplate.mockReturnValue({ data: undefined });
    mockUsePreview.mockReset();
    mockUsePreview.mockReturnValue({ data: undefined, isError: false });
    mockUseTemplateAssignments.mockReset();
    mockUseTemplateAssignments.mockReturnValue(assignmentsPage([]));
    mockUseTemplateVersions.mockReset();
    mockUseTemplateVersions.mockReturnValue({
      data: undefined,
      isError: false,
      isFetching: true,
      refetch: vi.fn(),
    });
    mockUseCompensationTemplates.mockReset();
    mockUseCompensationTemplates.mockReturnValue({
      data: {
        data: [
          {
            id: "tpl-1",
            name: "Operador foráneo",
            description: null,
            isActive: true,
            status: "active",
            version: 1,
            familyId: "tpl-1",
            lockedForEdit: false,
            rules: [],
            fixedAllowances: [],
            deductions: [],
            corridorIds: [],
            corridors: [],
            activeAssignmentsCount: 2,
          },
          {
            id: "tpl-2",
            name: "Esquema local",
            description: null,
            isActive: true,
            status: "active",
            version: 1,
            familyId: "tpl-2",
            lockedForEdit: false,
            rules: [
              {
                routeType: "local",
                commissionType: "none",
                rateValue: 0,
                minimumGuaranteedAmount: 0,
              },
            ],
            fixedAllowances: [],
            deductions: [],
            corridorIds: [],
            corridors: [],
            activeAssignmentsCount: 0,
          },
        ],
        pagination: { page: 1, limit: 20, total: 25, totalPages: 2 },
      },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchTemplates,
    });
  });

  it("muestra catálogo con Estado, Cómo se paga y operadores, sin columna Uso", () => {
    renderPage();

    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Operador foráneo")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Uso" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Cómo se paga" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Operadores" })).toBeInTheDocument();
    expect(screen.getAllByTestId("template-operators-count-trigger")[0]).toHaveTextContent(/^2$/);
    expect(screen.getByText("Falta definir el pago")).toBeInTheDocument();
    expect(screen.getByText("Local sin pago por viaje")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Completar pago/i }),
    ).toHaveAttribute("href", "/finance/compensation/templates/tpl-1/build");
    expect(screen.queryByRole("link", { name: /^Editar$/i })).not.toBeInTheDocument();
  });

  it("clic en la fila abre el panel de Operadores de esa versión", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("Local sin pago por viaje"));

    expect(currentParams()).toEqual({ operators: "tpl-2" });
    expect(
      await screen.findByRole("heading", { name: /Operadores — Esquema local/i }),
    ).toBeInTheDocument();
  });

  it("D12/CA21: ?status=inactive se rotula «Reemplazadas o desactivadas» y filtra inactive sin motivo", async () => {
    const user = userEvent.setup();
    renderPage("/finance/compensation/templates?status=inactive");

    expect(listQuery()).toEqual(
      expect.objectContaining({ groupBy: "family", status: "inactive" }),
    );
    expect(listQuery()).not.toHaveProperty("inactiveReason");
    expect(listQuery()).not.toHaveProperty("scope");
    expect(screen.getByRole("combobox", { name: "Estado" })).toHaveTextContent(
      "Reemplazadas o desactivadas",
    );
    expect(screen.getByText("Estado: Reemplazadas o desactivadas")).toBeInTheDocument();
    expect(currentParams()).toEqual({ status: "inactive" });

    await user.click(screen.getByRole("combobox", { name: "Estado" }));
    await user.click(await screen.findByRole("option", { name: "Activas" }));

    expect(currentParams()).toEqual({ status: "active", page: "1" });
    await user.click(screen.getByRole("combobox", { name: "Estado" }));
    expect(await screen.findByRole("option", { name: "Activas" })).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Reemplazadas o desactivadas" }),
    ).not.toBeInTheDocument();
  });

  describe("F2b: filtro por estado (PRD D22)", () => {
    it("CA19: sin ?status → «Vigentes», sin chip, agrupado y sin is_active", () => {
      renderPage();

      expect(listQuery()).toEqual({
        search: undefined,
        groupBy: "family",
        scope: "current",
        page: 1,
        pageSize: 20,
      });
      expect(screen.getByRole("combobox", { name: "Estado" })).toHaveTextContent("Vigentes");
      expect(screen.queryByText(/^Estado: /)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
    });

    it("las opciones van en el orden del PRD", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("combobox", { name: "Estado" }));

      expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
        "Vigentes",
        "Activas",
        "Borradores",
        "Reemplazadas",
        "Desactivadas",
        "Todos los estados",
      ]);
    });

    it.each([
      ["superseded", "Reemplazadas", { status: "inactive", inactiveReason: "superseded" }],
      ["deactivated", "Desactivadas", { status: "inactive", inactiveReason: "manual" }],
      ["draft", "Borradores", { status: "draft" }],
    ])("CA20: ?status=%s → «%s» con su motivo y chip", (status, label, query) => {
      renderPage(`/finance/compensation/templates?status=${status}`);

      expect(listQuery()).toEqual(expect.objectContaining({ groupBy: "family", ...query }));
      expect(listQuery()).not.toHaveProperty("scope");
      expect(screen.getByRole("combobox", { name: "Estado" })).toHaveTextContent(label);
      expect(screen.getByText(`Estado: ${label}`)).toBeInTheDocument();
    });

    it("CA20: «Todos los estados» queda en la URL con chip, sin status ni scope; «Limpiar filtros» vuelve a «Vigentes»", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("combobox", { name: "Estado" }));
      await user.click(await screen.findByRole("option", { name: "Todos los estados" }));

      expect(currentParams()).toEqual({ status: "all", page: "1" });
      expect(listQuery()).toEqual({
        search: undefined,
        groupBy: "family",
        page: 1,
        pageSize: 20,
      });
      expect(screen.getByText("Estado: Todos los estados")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));

      expect(currentParams()).toEqual({});
      expect(screen.getByRole("combobox", { name: "Estado" })).toHaveTextContent("Vigentes");
      expect(listQuery()).toEqual(expect.objectContaining({ scope: "current" }));
    });

    it("un ?status desconocido equivale a «Vigentes» sin chip", () => {
      renderPage("/finance/compensation/templates?status=bogus");

      expect(listQuery()).toEqual(expect.objectContaining({ scope: "current" }));
      expect(screen.queryByText(/^Estado: /)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Limpiar filtros" })).not.toBeInTheDocument();
    });
  });

  describe("F2b: «Vigentes» vacío (PRD D23)", () => {
    function emptyCurrentList(anyTotal: number) {
      mockUseCompensationTemplates.mockImplementation((params?: { pageSize?: number }) =>
        params?.pageSize === 1
          ? {
              data: {
                data: [],
                pagination: { page: 1, limit: 1, total: anyTotal, totalPages: anyTotal },
              },
              isLoading: false,
            }
          : {
              data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
              isLoading: false,
              isFetching: false,
              refetch: mockRefetchTemplates,
            },
      );
    }

    it("CA26: con tarifas en otros estados → «No hay tarifas vigentes» y «Ver todos los estados»", async () => {
      const user = userEvent.setup();
      emptyCurrentList(3);
      renderPage();

      expect(mockUseCompensationTemplates).toHaveBeenCalledWith(
        { groupBy: "family", page: 1, pageSize: 1 },
        { enabled: true },
      );
      expect(screen.getByText(copy.currentEmpty.title)).toBeInTheDocument();
      expect(screen.getByText(copy.currentEmpty.description)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: copy.create })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: copy.currentEmpty.viewAll }));

      expect(currentParams()).toEqual({ status: "all", page: "1" });
    });

    it("CA26: tenant sin tarifas → vacío actual", () => {
      emptyCurrentList(0);
      renderPage();

      expect(screen.getByText(copy.emptyTitle)).toBeInTheDocument();
      expect(screen.queryByText(copy.currentEmpty.title)).not.toBeInTheDocument();
    });

    it("con búsqueda o en otro filtro no consulta el total", () => {
      emptyCurrentList(3);
      renderPage("/finance/compensation/templates?status=active");

      expect(mockUseCompensationTemplates).toHaveBeenCalledWith(
        { groupBy: "family", page: 1, pageSize: 1 },
        { enabled: false },
      );
      expect(screen.queryByText(copy.currentEmpty.title)).not.toBeInTheDocument();
    });
  });

  describe("F2b: enlace a una versión que no es fila (PRD D21)", () => {
    const v1 = makeCompensationTemplate({
      id: "tpl-v1",
      familyId: "fam-1",
      name: "Operador foráneo",
      status: "inactive",
      inactiveReason: "superseded",
      version: 1,
      activeAssignmentsCount: 2,
    });
    const v2 = makeCompensationTemplate({
      id: "tpl-v2",
      familyId: "fam-1",
      name: "Operador foráneo",
      status: "active",
      version: 2,
    });
    const v2Row = {
      ...v2,
      family: {
        versionsCount: 2,
        activeVersion: { id: "tpl-v2", version: 2 },
        draftVersion: null,
        supersededActiveAssignmentsCount: 2,
        supersededScheduledAssignmentsCount: 0,
      },
    };

    beforeEach(() => {
      mockUseCompensationTemplates.mockReturnValue({
        data: { data: [v2Row], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
        isLoading: false,
        isFetching: false,
        refetch: mockRefetchTemplates,
      });
      mockUseTemplateVersions.mockReturnValue({
        data: [v1, v2],
        isError: false,
        isFetching: false,
        refetch: vi.fn(),
      });
      mockUseCompensationTemplate.mockImplementation((id?: string) => ({
        data: id === "tpl-v1" ? v1 : undefined,
      }));
    });

    it("CA24: la familia abre por familyId y al cerrar el panel el foco vuelve a la sub-fila", async () => {
      const user = userEvent.setup();
      renderPage("/finance/compensation/templates?operators=tpl-v1");

      expect(
        await screen.findByRole("heading", { name: "Operadores — Operador foráneo versión 1" }),
      ).toBeInTheDocument();
      const toggle = screen.getByTestId("template-family-toggle");
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      const subRowName = screen.getByRole("button", {
        name: "Abrir operadores de Operador foráneo v1",
      });

      await user.keyboard("{Escape}");

      await waitFor(() => expect(currentParams()).toEqual({}));
      await waitFor(() => expect(subRowName).toHaveFocus());
      expect(toggle).toHaveAttribute("aria-expanded", "true");
    });

    it("cerrar el panel de una fila devuelve el foco a su nombre", async () => {
      const user = userEvent.setup();
      renderPage("/finance/compensation/templates?operators=tpl-v2");

      expect(
        await screen.findByRole("heading", { name: /Operadores — Operador foráneo/ }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("template-family-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );

      await user.keyboard("{Escape}");

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Abrir operadores de Operador foráneo v2" }),
        ).toHaveFocus(),
      );
    });

    it("si la familia no está en la página, el panel abre como hoy sin desplegar nada", async () => {
      mockUseCompensationTemplate.mockImplementation((id?: string) => ({
        data: id === "tpl-v1" ? { ...v1, familyId: "fam-other" } : undefined,
      }));
      renderPage("/finance/compensation/templates?operators=tpl-v1");

      expect(
        await screen.findByRole("heading", { name: "Operadores — Operador foráneo versión 1" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("template-family-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("D15: cambiar de filtro cierra las familias abiertas", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByTestId("template-family-toggle"));
      expect(screen.getByTestId("template-family-toggle")).toHaveAttribute(
        "aria-expanded",
        "true",
      );

      await user.click(screen.getByRole("combobox", { name: "Estado" }));
      await user.click(await screen.findByRole("option", { name: "Activas" }));

      expect(screen.getByTestId("template-family-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });

  it("abre Sheet de operadores al asignar desde banner employeeId solo en esquemas listos", async () => {
    const user = userEvent.setup();
    renderPage("/finance/compensation/templates?employeeId=emp-1");

    expect(
      screen.getByText(/Este operador aún no tiene tarifa de pago/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Juan Pérez no tiene una tarifa de pago vigente/i),
    ).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: /Asignar a esta tarifa/i })).toHaveLength(
      1,
    );

    await user.click(screen.getByRole("button", { name: /Asignar a esta tarifa/i }));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: /Operadores — Esquema local/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Asignación masiva/i })).toBeInTheDocument();
  });

  it("abre Sheet de operadores con deep link ?operators=", async () => {
    renderPage("/finance/compensation/templates?operators=tpl-1");

    expect(
      await screen.findByRole("heading", { name: /Operadores — Operador foráneo/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /Asignar operadores/i }),
    ).toBeInTheDocument();
  });

  it("Completar pago apunta al editor de esquema", () => {
    renderPage();

    expect(screen.getByRole("link", { name: /Completar pago/i })).toHaveAttribute(
      "href",
      "/finance/compensation/templates/tpl-1/build",
    );
  });

  it("abre operadores con assign pre-cargado", async () => {
    renderPage("/finance/compensation/templates?operators=tpl-2&assign=emp-9");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Operadores — Esquema local/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: /Asignación masiva/i })).toBeInTheDocument();
  });

  it("tras confirmar asignación cierra sheets y limpia banner employeeId", async () => {
    const user = userEvent.setup();
    const employeeId = "11111111-1111-4111-8111-111111111111";
    renderPage(`/finance/compensation/templates?employeeId=${employeeId}`);

    expect(
      screen.getByText(/Este operador aún no tiene tarifa de pago/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Asignar a esta tarifa/i }));

    expect(
      await screen.findByRole("heading", { name: /Asignación masiva/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Confirmar asignación/i }));

    await waitFor(() => {
      expect(mockBatchMutate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/Este operador aún no tiene tarifa de pago/i),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: /Asignación masiva/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Operadores —/i }),
    ).not.toBeInTheDocument();
    expect(mockRefetchTemplates).toHaveBeenCalled();
  });

  describe("Sheet de operadores en versiones no activas (W5)", () => {
    function listWithInactiveVersion(extra: Record<string, unknown>) {
      mockUseCompensationTemplates.mockReturnValue({
        data: {
          data: [
            {
              id: "tpl-old",
              name: "Operador foráneo",
              description: null,
              isActive: false,
              status: "inactive",
              version: 2,
              familyId: "tpl-1",
              lockedForEdit: true,
              rules: [],
              fixedAllowances: [],
              deductions: [],
              corridorIds: [],
              corridors: [],
              activeAssignmentsCount: 2,
              ...extra,
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
        isLoading: false,
        isFetching: false,
        refetch: mockRefetchTemplates,
      });
    }

    it.each([
      [
        "reemplazada",
        { inactiveReason: "superseded", lockedReason: "superseded" },
        "Esta versión ya fue reemplazada, pero hay operadores que todavía cobran o cobrarán con ella. Para que cobren con la versión activa, asígnalos desde esa versión indicando desde qué fecha.",
      ],
      [
        "desactivada",
        { inactiveReason: "manual" },
        "Esta versión está desactivada y no calcula pagos, ni siquiera de los operadores asignados aquí. Asígnalos a otra versión para que puedan cobrar.",
      ],
    ])(
      "criterio 11: %s — título con versión, aviso y «Asignar operadores» disponible",
      async (_label, extra, notice) => {
        listWithInactiveVersion(extra);
        renderPage("/finance/compensation/templates?operators=tpl-old");

        expect(
          await screen.findByRole("heading", {
            name: "Operadores — Operador foráneo versión 2",
          }),
        ).toBeInTheDocument();
        expect(screen.getByTestId("operators-sheet-version-notice")).toHaveTextContent(notice);
        expect(
          await screen.findByRole("button", { name: /Asignar operadores/i }),
        ).toBeEnabled();
      },
    );

    it("inactiva sin motivo (API anterior) no muestra aviso", async () => {
      listWithInactiveVersion({});
      renderPage("/finance/compensation/templates?operators=tpl-old");

      expect(
        await screen.findByRole("heading", {
          name: "Operadores — Operador foráneo versión 2",
        }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("operators-sheet-version-notice")).not.toBeInTheDocument();
    });

    it("D5: reemplazada sin vigentes ni programadas y con filas → aviso de historial", async () => {
      listWithInactiveVersion({
        inactiveReason: "superseded",
        lockedReason: "superseded",
        activeAssignmentsCount: 0,
        scheduledAssignmentsCount: 0,
      });
      mockUseTemplateAssignments.mockReturnValue(
        assignmentsPage([
          {
            id: "asg-old",
            employeeId: "emp-old",
            employeeFullName: "Juan Pérez",
            templateId: "tpl-old",
            effectiveFrom: "2026-01-01",
            effectiveTo: null,
            isActive: false,
            isUsedInSettlement: true,
          },
        ]),
      );
      renderPage("/finance/compensation/templates?operators=tpl-old");

      expect(
        await screen.findByRole("heading", {
          name: "Operadores — Operador foráneo versión 2",
        }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("operators-sheet-version-notice")).toHaveTextContent(
        "Esta versión ya fue reemplazada y ningún operador cobra con ella. Las asignaciones de abajo se conservan como historial.",
      );
    });
  });

  describe("W5: ir a la asignación que bloquea y volver al lote", () => {
    const FERNANDO = "11111111-1111-4111-8111-111111111111";
    const BLOCKING_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const PAYABLES = `employeeId=${FERNANDO}&periodStart=2026-09-01&periodEnd=2026-09-15`;

    const blockingAssignment: TemplateAssignment = {
      id: BLOCKING_ID,
      employeeId: FERNANDO,
      employeeFullName: "Fernando Ruiz",
      templateId: "tpl-1",
      templateName: "Operador foráneo",
      effectiveFrom: "2026-08-01",
      effectiveTo: null,
      isActive: true,
      assignedBy: null,
      reason: null,
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    };

    function conflictIn(templateId: string, templateName: string): BatchAssignmentConflict {
      return {
        employeeId: FERNANDO,
        code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
        message: "Mensaje de la API",
        reason: "previous_starts_on_or_after",
        employeeFullName: "Fernando Ruiz",
        existingAssignmentId: BLOCKING_ID,
        existingTemplateId: templateId,
        existingTemplateName: templateName,
        existingTemplateVersion: 1,
        existingEffectiveFrom: "2026-09-01",
        existingEffectiveTo: "2026-09-30",
        closePreviousOn: null,
        suggestedEffectiveFrom: "2026-10-01",
      };
    }

    function previewWith(conflict: BatchAssignmentConflict) {
      return {
        data: {
          wouldCreateCount: 0,
          wouldSkipCount: 1,
          employees: [],
          conflicts: [conflict],
          closures: [],
        },
        isError: false,
      };
    }

    function focusNotice() {
      return screen.getByTestId("operators-sheet-focus-notice");
    }

    beforeEach(() => {
      mockUseTemplateAssignments.mockImplementation((params?: { templateId?: string }) =>
        assignmentsPage(
          params?.templateId === blockingAssignment.templateId ? [blockingAssignment] : [],
        ),
      );
    });

    it("criterios 16, 18 y 22: cambia a la otra versión con foco y regreso, y «Volver» reabre el lote", async () => {
      const user = userEvent.setup();
      const local = mockUseCompensationTemplates().data.data[1];
      mockUseCompensationTemplate.mockImplementation((id?: string) => ({
        data: id === "tpl-2" ? local : undefined,
      }));
      mockUsePreview.mockReturnValue(previewWith(conflictIn("tpl-1", "Operador foráneo")));
      renderPage(
        `/finance/compensation/templates?operators=tpl-2&assign=${FERNANDO}&assignFrom=2026-09-01&${PAYABLES}`,
      );

      await user.click(
        await screen.findByRole("button", {
          name: "Ir a su asignación en Operador foráneo versión 1",
        }),
      );

      expect(currentParams()).toEqual({
        operators: "tpl-1",
        focus: BLOCKING_ID,
        returnTo: "tpl-2",
        returnAssign: FERNANDO,
        returnFrom: "2026-09-01",
        employeeId: FERNANDO,
        periodStart: "2026-09-01",
        periodEnd: "2026-09-15",
      });
      expect(
        await screen.findByRole("heading", { name: /Operadores — Operador foráneo/i }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { name: /Operadores —/i })).toHaveLength(1);
      expect(screen.queryByRole("heading", { name: /Asignación masiva/i })).not.toBeInTheDocument();
      expect(within(focusNotice()).getByText("Asignación de Fernando Ruiz")).toBeInTheDocument();

      const focusedRow = document.querySelector<HTMLElement>('[data-focused="true"]');
      expect(focusedRow).toHaveTextContent("Fernando Ruiz");
      await waitFor(() => {
        expect(focusedRow!.querySelector("[data-assignment-menu-trigger]")).toHaveFocus();
      });

      await user.click(
        within(focusNotice()).getByRole("button", { name: "Volver a Esquema local versión 1" }),
      );

      expect(currentParams()).toEqual({
        operators: "tpl-2",
        assign: FERNANDO,
        assignFrom: "2026-09-01",
        employeeId: FERNANDO,
        periodStart: "2026-09-01",
        periodEnd: "2026-09-15",
      });
      expect(
        await screen.findByRole("heading", { name: /Asignación masiva/i }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("operators-sheet-focus-notice")).not.toBeInTheDocument();
    });

    it("D5: «Ver su asignación» en la misma versión cierra el lote y resalta sin regreso", async () => {
      const user = userEvent.setup();
      mockUseTemplateAssignments.mockImplementation((params?: { templateId?: string }) =>
        assignmentsPage(
          params?.templateId === "tpl-2" ? [{ ...blockingAssignment, templateId: "tpl-2" }] : [],
        ),
      );
      mockUsePreview.mockReturnValue(previewWith(conflictIn("tpl-2", "Esquema local")));
      renderPage(
        `/finance/compensation/templates?operators=tpl-2&assign=${FERNANDO}&assignFrom=2026-09-01`,
      );

      await user.click(await screen.findByRole("button", { name: "Ver su asignación" }));

      expect(currentParams()).toEqual({ operators: "tpl-2", focus: BLOCKING_ID });
      await waitFor(() => {
        expect(
          screen.queryByRole("heading", { name: /Asignación masiva/i }),
        ).not.toBeInTheDocument();
      });
      expect(screen.queryByTestId("operators-sheet-focus-notice")).not.toBeInTheDocument();
      expect(document.querySelector('[data-focused="true"]')).toHaveTextContent("Fernando Ruiz");
    });

    it("criterio 17: en la versión destino no se abre el lote aunque haya employeeId; «Listo» quita foco y regreso", async () => {
      const user = userEvent.setup();
      renderPage(
        `/finance/compensation/templates?operators=tpl-1&focus=${BLOCKING_ID}&returnTo=tpl-2&returnAssign=${FERNANDO}&returnFrom=2026-09-01&${PAYABLES}`,
      );

      expect(
        await screen.findByRole("heading", { name: /Operadores — Operador foráneo/i }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /Asignación masiva/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog", { name: /Desactivar/i })).not.toBeInTheDocument();

      await user.click(within(focusNotice()).getByRole("button", { name: "Listo" }));

      expect(currentParams()).toEqual({
        operators: "tpl-1",
        employeeId: FERNANDO,
        periodStart: "2026-09-01",
        periodEnd: "2026-09-15",
      });
      expect(screen.queryByTestId("operators-sheet-focus-notice")).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /Asignación masiva/i })).not.toBeInTheDocument();
    });
  });
});
