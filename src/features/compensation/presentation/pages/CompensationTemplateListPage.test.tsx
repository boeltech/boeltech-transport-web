import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BatchAssignmentConflict, TemplateAssignment } from "../../domain/entities";
import { CompensationTemplateListPage } from "./CompensationTemplateListPage";

const mockNavigate = vi.fn();
const mockBatchMutate = vi.fn();
const mockRefetchTemplates = vi.fn();

const {
  mockUseCompensationTemplates,
  mockUseCompensationTemplate,
  mockUsePreview,
  mockUseTemplateAssignments,
} = vi.hoisted(() => ({
  mockUseCompensationTemplates: vi.fn(),
  mockUseCompensationTemplate: vi.fn(),
  mockUsePreview: vi.fn(),
  mockUseTemplateAssignments: vi.fn(),
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

  it("muestra catálogo con Uso, Cómo se paga y operadores", () => {
    renderPage();

    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Operador foráneo")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Uso" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Cómo se paga" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Operadores" })).toBeInTheDocument();
    expect(screen.getAllByTestId("template-operators-count-trigger")[0]).toHaveTextContent(/^2$/);
    expect(screen.getByText("Falta definir el pago")).toBeInTheDocument();
    expect(screen.getByText("Listo para usar en pagos")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Completar pago/i }),
    ).toHaveAttribute("href", "/finance/compensation/templates/tpl-1/build");
    expect(screen.getByRole("link", { name: /^Editar$/i })).toHaveAttribute(
      "href",
      "/finance/compensation/templates/tpl-2/build",
    );
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
        "Esta versión ya fue reemplazada. Los operadores asignados aquí siguen cobrando con ella. Para que cobren con la versión activa, asígnalos desde esa versión indicando desde qué fecha.",
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
