import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError, getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate } from "@shared/utils/dateUtils";
import { TemplateAssignmentActions } from "./TemplateAssignmentActions";
import type { TemplateAssignment } from "../../domain/entities";

const mockUsePermissions = vi.fn();
const mockToast = vi.fn();
const mockUpdateAssignment = vi.fn();
const mockDeleteAssignment = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../application/hooks", () => ({
  useUpdateTemplateAssignment: () => ({
    mutateAsync: mockUpdateAssignment,
    isPending: false,
  }),
  useDeleteTemplateAssignment: () => ({
    mutateAsync: mockDeleteAssignment,
    isPending: false,
  }),
}));

const sampleAssignment: TemplateAssignment = {
  id: "assign-1",
  employeeId: "emp-1",
  employeeFullName: "Carlos López",
  templateId: "tpl-1",
  templateName: "Esquema demo",
  effectiveFrom: "2026-08-01",
  effectiveTo: null,
  isActive: true,
  assignedBy: null,
  reason: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

describe("TemplateAssignmentActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateAssignment.mockResolvedValue({ ...sampleAssignment, isActive: false });
    mockDeleteAssignment.mockResolvedValue(undefined);
  });

  it("no renderiza menú sin permisos settlements update/delete", () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn(() => false),
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <TemplateAssignmentActions assignment={sampleAssignment} />
      </QueryClientProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("muestra acciones con permisos y desactiva vía PATCH", async () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((resource: string, action: string) => {
        if (resource === "settlements" && action === "update") return true;
        if (resource === "settlements" && action === "delete") return true;
        return false;
      }),
    });

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TemplateAssignmentActions assignment={sampleAssignment} />
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: /Abrir menú de acciones de asignación/i }),
    );
    expect(screen.getByText("Desactivar asignación")).toBeInTheDocument();
    expect(screen.getByText("Eliminar asignación")).toBeInTheDocument();

    await user.click(screen.getByText("Desactivar asignación"));
    await user.click(screen.getByRole("button", { name: /^Desactivar$/i }));

    await waitFor(() => {
      expect(mockUpdateAssignment).toHaveBeenCalledWith({
        id: "assign-1",
        payload: { isActive: false },
      });
    });
  });

  describe("Cerrar vigencia en día de México (ADR-0101)", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    const setClock = (iso: string) => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(iso));
    };

    function renderWithPermissions() {
      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(
          (resource: string, action: string) =>
            resource === "settlements" && (action === "update" || action === "delete"),
        ),
      });
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <TemplateAssignmentActions assignment={sampleAssignment} />
        </QueryClientProvider>,
      );
    }

    async function openAndConfirmCloseValidity(user: ReturnType<typeof userEvent.setup>) {
      await user.click(
        screen.getByRole("button", { name: /Abrir menú de acciones de asignación/i }),
      );
      await user.click(screen.getByText("Cerrar vigencia…"));
      await user.click(screen.getByRole("button", { name: /^Cerrar vigencia$/i }));
    }

    it.each([
      ["19:00 CDMX del último día del mes", "2026-10-01T01:00:00Z", "2026-09-30"],
      ["00:00 CDMX del día 1", "2026-10-01T06:00:00Z", "2026-10-01"],
    ])("propone el día de México a las %s", async (_label, now, expected) => {
      setClock(now);
      const user = userEvent.setup();
      renderWithPermissions();

      await openAndConfirmCloseValidity(user);

      await waitFor(() => {
        expect(mockUpdateAssignment).toHaveBeenCalledWith({
          id: "assign-1",
          payload: { effectiveTo: expected },
        });
      });
    });

    it("recalcula la fecha al abrir el diálogo, no al montar la fila", async () => {
      setClock("2026-10-01T05:59:00Z");
      const user = userEvent.setup();
      renderWithPermissions();

      vi.setSystemTime(new Date("2026-10-01T06:00:00Z"));
      await openAndConfirmCloseValidity(user);

      await waitFor(() => {
        expect(mockUpdateAssignment).toHaveBeenCalledWith({
          id: "assign-1",
          payload: { effectiveTo: "2026-10-01" },
        });
      });
    });
  });

  describe("menú y diálogos por vigencia (PRD D13/D14)", () => {
    const MIN_EFFECTIVE_TO = "2026-10-15";
    const SETTLED_MESSAGE = "El periodo ya está en la liquidación LIQ-0042.";

    const concluded: TemplateAssignment = {
      ...sampleAssignment,
      effectiveTo: "2026-09-30",
    };
    const deactivated: TemplateAssignment = { ...sampleAssignment, isActive: false };
    const scheduled: TemplateAssignment = {
      ...sampleAssignment,
      effectiveFrom: "2026-11-01",
    };

    function settledError(withMinEffectiveTo = true) {
      return new ApiError("Conflict", 409, "ASSIGNMENT_PERIOD_SETTLED", {
        message: SETTLED_MESSAGE,
        ...(withMinEffectiveTo ? { min_effective_to: MIN_EFFECTIVE_TO } : {}),
      });
    }

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-08T18:00:00Z"));
      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(
          (resource: string, action: string) =>
            resource === "settlements" && (action === "update" || action === "delete"),
        ),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function openMenu(assignment: TemplateAssignment) {
      const user = userEvent.setup();
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <TemplateAssignmentActions assignment={assignment} />
        </QueryClientProvider>,
      );
      await user.click(
        screen.getByRole("button", { name: /Abrir menú de acciones de asignación/i }),
      );
      return user;
    }

    const menuItemNames = () =>
      screen.getAllByRole("menuitem").map((item) => item.textContent?.trim());

    it("criterio 12: concluida ofrece «Cambiar fecha de fin…» y no «Cerrar vigencia…»", async () => {
      const user = await openMenu(concluded);

      expect(menuItemNames()).toEqual([
        "Cambiar fecha de fin…",
        "Desactivar asignación",
        "Eliminar asignación",
      ]);
      expect(screen.queryByText("Cerrar vigencia…")).not.toBeInTheDocument();

      await user.click(screen.getByText("Cambiar fecha de fin…"));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Cambiar fecha de fin")).toBeInTheDocument();
      expect(
        within(dialog).getByText(
          `Concluyó el ${formatDate("2026-09-30")}. Cambia la fecha solo si se capturó mal.`,
        ),
      ).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Vigente hasta")).toHaveTextContent(
        formatDate("2026-09-30"),
      );
    });

    it.each([
      ["API anterior (sin el campo)", undefined],
      ["sin uso en liquidaciones", false],
    ])(
      "criterio 12 / CA3–CA4: desactivada %s solo ofrece «Eliminar asignación»",
      async (_label, isUsedInSettlement) => {
        await openMenu({ ...deactivated, isUsedInSettlement });

        expect(menuItemNames()).toEqual(["Eliminar asignación"]);
      },
    );

    it("desactivada sin permiso de eliminar no muestra menú", () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(
          (resource: string, action: string) =>
            resource === "settlements" && action === "update",
        ),
      });
      const { container } = render(
        <QueryClientProvider client={createTestQueryClient()}>
          <TemplateAssignmentActions assignment={deactivated} />
        </QueryClientProvider>,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("programada cierra vigencia desde su fecha de inicio", async () => {
      const user = await openMenu(scheduled);

      expect(menuItemNames()).toEqual([
        "Cerrar vigencia…",
        "Desactivar asignación",
        "Eliminar asignación",
      ]);
      await user.click(screen.getByText("Cerrar vigencia…"));
      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByText(
          `Empieza el ${formatDate("2026-11-01")}. Indica el último día en que cobrará con esta versión.`,
        ),
      ).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Vigente hasta")).toHaveTextContent(
        formatDate("2026-11-01"),
      );
    });

    it("criterio 13: días liquidados al cerrar vigencia → aviso en el diálogo y «Usar» no guarda", async () => {
      mockUpdateAssignment.mockRejectedValueOnce(settledError());
      const user = await openMenu(sampleAssignment);

      await user.click(screen.getByText("Cerrar vigencia…"));
      await user.click(screen.getByRole("button", { name: /^Cerrar vigencia$/i }));

      const dialog = await screen.findByRole("dialog");
      const alert = await within(dialog).findByTestId("assignment-action-error");
      expect(within(alert).getByText("Hay días ya liquidados")).toBeInTheDocument();
      expect(within(alert).getByText(SETTLED_MESSAGE)).toBeInTheDocument();
      expect(mockToast).not.toHaveBeenCalled();

      await user.click(
        within(alert).getByRole("button", { name: `Usar ${formatDate(MIN_EFFECTIVE_TO)}` }),
      );

      expect(within(dialog).getByLabelText("Vigente hasta")).toHaveTextContent(
        formatDate(MIN_EFFECTIVE_TO),
      );
      expect(mockUpdateAssignment).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("criterio 14: días liquidados al desactivar → «Desactivar» deshabilitado y salto a cerrar vigencia", async () => {
      mockUpdateAssignment.mockRejectedValueOnce(settledError());
      const user = await openMenu(sampleAssignment);

      await user.click(screen.getByText("Desactivar asignación"));
      await user.click(screen.getByRole("button", { name: /^Desactivar$/i }));

      const alertDialog = await screen.findByRole("alertdialog");
      const alert = await within(alertDialog).findByTestId("assignment-action-error");
      expect(within(alert).getByText("Hay días ya liquidados")).toBeInTheDocument();
      expect(within(alert).getByText(SETTLED_MESSAGE)).toBeInTheDocument();
      expect(within(alertDialog).getByRole("button", { name: /^Desactivar$/i })).toBeDisabled();

      await user.click(
        within(alert).getByRole("button", {
          name: `Cerrar vigencia el ${formatDate(MIN_EFFECTIVE_TO)}`,
        }),
      );

      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText("Cerrar vigencia de asignación")).toBeInTheDocument();
      expect(within(dialog).getByLabelText("Vigente hasta")).toHaveTextContent(
        formatDate(MIN_EFFECTIVE_TO),
      );
      expect(within(dialog).queryByTestId("assignment-action-error")).not.toBeInTheDocument();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(mockUpdateAssignment).toHaveBeenCalledTimes(1);
    });

    it("criterio 14: sin fecha mínima no ofrece el salto, solo deshabilita «Desactivar»", async () => {
      mockUpdateAssignment.mockRejectedValueOnce(settledError(false));
      const user = await openMenu(sampleAssignment);

      await user.click(screen.getByText("Desactivar asignación"));
      await user.click(screen.getByRole("button", { name: /^Desactivar$/i }));

      const alertDialog = await screen.findByRole("alertdialog");
      await within(alertDialog).findByTestId("assignment-action-error");
      expect(within(alertDialog).getByRole("button", { name: /^Desactivar$/i })).toBeDisabled();
      expect(
        within(alertDialog).queryByRole("button", { name: /^Cerrar vigencia el/ }),
      ).not.toBeInTheDocument();
    });

    it("criterio 15: error cualquiera al eliminar se muestra en el diálogo", async () => {
      const serverError = new ApiError("Error interno al eliminar", 500);
      mockDeleteAssignment.mockRejectedValueOnce(serverError);
      const user = await openMenu(sampleAssignment);

      await user.click(screen.getByText("Eliminar asignación"));
      await user.click(screen.getByRole("button", { name: /^Eliminar$/i }));

      const alertDialog = await screen.findByRole("alertdialog");
      const alert = await within(alertDialog).findByTestId("assignment-action-error");
      expect(within(alert).getByText(getErrorMessage(serverError))).toBeInTheDocument();
      expect(within(alert).queryByText("Hay días ya liquidados")).not.toBeInTheDocument();
      expect(within(alertDialog).getByRole("button", { name: /^Eliminar$/i })).toBeEnabled();
    });

    it("criterio 15: días liquidados al eliminar → aviso en el diálogo y «Eliminar» deshabilitado", async () => {
      mockDeleteAssignment.mockRejectedValueOnce(settledError());
      const user = await openMenu(sampleAssignment);

      await user.click(screen.getByText("Eliminar asignación"));
      await user.click(screen.getByRole("button", { name: /^Eliminar$/i }));

      const alertDialog = await screen.findByRole("alertdialog");
      const alert = await within(alertDialog).findByTestId("assignment-action-error");
      expect(within(alert).getByText("Hay días ya liquidados")).toBeInTheDocument();
      expect(within(alert).getByText(SETTLED_MESSAGE)).toBeInTheDocument();
      expect(within(alertDialog).getByRole("button", { name: /^Eliminar$/i })).toBeDisabled();
      expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("asignación usada en una liquidación (PRD D1–D4)", () => {
    const IN_USE_TITLE = "No se puede eliminar";
    const IN_USE_DEACTIVATED =
      "Esta asignación formó parte de una liquidación (aunque esté cancelada) y se conserva como historial. Como está desactivada, no cobra ni afecta a otras asignaciones.";
    const IN_USE_NOT_DEACTIVATED =
      "Esta asignación formó parte de una liquidación (aunque esté cancelada) y se conserva como historial. Para que deje de cobrar, desactívala o cierra su vigencia.";

    const deactivated: TemplateAssignment = { ...sampleAssignment, isActive: false };

    function inUseError() {
      return new ApiError("La asignación tiene liquidaciones", 409, "ASSIGNMENT_IN_USE");
    }

    function grant(...actions: string[]) {
      mockUsePermissions.mockReturnValue({
        hasPermission: vi.fn(
          (resource: string, action: string) =>
            resource === "settlements" && actions.includes(action),
        ),
      });
    }

    function renderActions(assignment: TemplateAssignment) {
      const queryClient = createTestQueryClient();
      const element = (row: TemplateAssignment) => (
        <QueryClientProvider client={queryClient}>
          <TemplateAssignmentActions assignment={row} />
        </QueryClientProvider>
      );
      const utils = render(element(assignment));
      return { ...utils, rerenderWith: (row: TemplateAssignment) => utils.rerender(element(row)) };
    }

    const openMenuButton = () =>
      screen.getByRole("button", { name: /Abrir menú de acciones de asignación/i });
    const menuItemNames = () =>
      screen.getAllByRole("menuitem").map((item) => item.textContent?.trim());

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-08T18:00:00Z"));
      grant("update", "delete");
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it.each([
      ["vigente", sampleAssignment, ["Cerrar vigencia…", "Desactivar asignación"]],
      [
        "programada",
        { ...sampleAssignment, effectiveFrom: "2026-11-01" },
        ["Cerrar vigencia…", "Desactivar asignación"],
      ],
      [
        "concluida",
        { ...sampleAssignment, effectiveTo: "2026-09-30" },
        ["Cambiar fecha de fin…", "Desactivar asignación"],
      ],
    ])("CA1: %s en uso → acciones de fecha y desactivar, sin «Eliminar»", async (_l, row, items) => {
      const user = userEvent.setup();
      renderActions({ ...row, isUsedInSettlement: true });

      await user.click(openMenuButton());

      expect(menuItemNames()).toEqual(items);
      expect(screen.queryByText("Eliminar asignación")).not.toBeInTheDocument();
    });

    it("CA4: vigente sin el campo (API anterior) sigue ofreciendo «Eliminar»", async () => {
      const user = userEvent.setup();
      renderActions({ ...sampleAssignment, isUsedInSettlement: undefined });

      await user.click(openMenuButton());

      expect(menuItemNames()).toEqual([
        "Cerrar vigencia…",
        "Desactivar asignación",
        "Eliminar asignación",
      ]);
    });

    it("CA2: desactivada en uso → sin «···»", () => {
      const { container } = renderActions({ ...deactivated, isUsedInSettlement: true });

      expect(container).toBeEmptyDOMElement();
    });

    it("CA12: contador (sin eliminar) → desactivada sin «···», con o sin uso", () => {
      grant("update");
      const { container, rerenderWith } = renderActions({
        ...deactivated,
        isUsedInSettlement: false,
      });
      expect(container).toBeEmptyDOMElement();

      rerenderWith({ ...deactivated, isUsedInSettlement: undefined });
      expect(container).toBeEmptyDOMElement();
    });

    it("CA3: desactivada sin uso → elimina, toast de éxito y cierra", async () => {
      const user = userEvent.setup();
      renderActions({ ...deactivated, isUsedInSettlement: false });

      await user.click(openMenuButton());
      await user.click(screen.getByText("Eliminar asignación"));
      await user.click(screen.getByRole("button", { name: /^Eliminar$/i }));

      await waitFor(() => expect(mockDeleteAssignment).toHaveBeenCalledWith("assign-1"));
      expect(mockToast).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith({ title: "Asignación eliminada", variant: "success" });
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("el diálogo de eliminar explica que cuenta cualquier liquidación", async () => {
      const user = userEvent.setup();
      renderActions(deactivated);

      await user.click(openMenuButton());
      await user.click(screen.getByText("Eliminar asignación"));

      expect(
        within(screen.getByRole("alertdialog")).getByText(
          "La asignación se borrará de forma permanente. Solo se puede eliminar si nunca formó parte de una liquidación, sin importar su estado (incluso cancelada). Si ya formó parte de una, desactívala o cierra su vigencia: deja de cobrar y se conserva como historial.",
        ),
      ).toBeInTheDocument();
    });

    it.each([
      ["desactivada", deactivated, IN_USE_DEACTIVATED],
      ["vigente", sampleAssignment, IN_USE_NOT_DEACTIVATED],
    ])(
      "CA5: 409 ASSIGNMENT_IN_USE en %s → Alert con título y texto por estado, sin toast",
      async (_label, row, message) => {
        mockDeleteAssignment.mockRejectedValueOnce(inUseError());
        const user = userEvent.setup();
        renderActions(row);

        await user.click(openMenuButton());
        await user.click(screen.getByText("Eliminar asignación"));
        await user.click(screen.getByRole("button", { name: /^Eliminar$/i }));

        const alertDialog = await screen.findByRole("alertdialog");
        const alert = await within(alertDialog).findByTestId("assignment-action-error");
        expect(within(alert).getByText(IN_USE_TITLE)).toBeInTheDocument();
        expect(within(alert).getByText(message)).toBeInTheDocument();
        expect(within(alert).queryByText("La asignación tiene liquidaciones")).not.toBeInTheDocument();
        expect(within(alertDialog).getByRole("button", { name: /^Eliminar$/i })).toBeDisabled();
        expect(within(alertDialog).getByRole("button", { name: "Cerrar" })).toBeEnabled();
        expect(
          within(alertDialog).queryByRole("button", { name: "Cancelar" }),
        ).not.toBeInTheDocument();
        expect(mockToast).not.toHaveBeenCalled();
      },
    );

    it("CA5: al recargar la fila en uso el diálogo sigue montado; al cerrar ya no hay «···»", async () => {
      mockDeleteAssignment.mockRejectedValueOnce(inUseError());
      const user = userEvent.setup();
      const { container, rerenderWith } = renderActions(deactivated);

      await user.click(openMenuButton());
      await user.click(screen.getByText("Eliminar asignación"));
      await user.click(screen.getByRole("button", { name: /^Eliminar$/i }));
      await screen.findByTestId("assignment-action-error");

      rerenderWith({ ...deactivated, isUsedInSettlement: true });

      const alertDialog = screen.getByRole("alertdialog");
      expect(within(alertDialog).getByText(IN_USE_DEACTIVATED)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Abrir menú de acciones de asignación/i }),
      ).not.toBeInTheDocument();

      await user.click(within(alertDialog).getByRole("button", { name: "Cerrar" }));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(container).toBeEmptyDOMElement();
    });

    it("CA6: error al desactivar → un solo aviso en el diálogo, sin toast", async () => {
      mockUpdateAssignment.mockRejectedValueOnce(new ApiError("Fallo al desactivar", 500));
      const user = userEvent.setup();
      renderActions(sampleAssignment);

      await user.click(openMenuButton());
      await user.click(screen.getByText("Desactivar asignación"));
      await user.click(screen.getByRole("button", { name: /^Desactivar$/i }));

      const alertDialog = await screen.findByRole("alertdialog");
      expect(within(alertDialog).getAllByTestId("assignment-action-error")).toHaveLength(1);
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("CA6: error al cerrar vigencia → un solo aviso en el diálogo, sin toast", async () => {
      mockUpdateAssignment.mockRejectedValueOnce(new ApiError("Fallo al cerrar", 500));
      const user = userEvent.setup();
      renderActions(sampleAssignment);

      await user.click(openMenuButton());
      await user.click(screen.getByText("Cerrar vigencia…"));
      await user.click(screen.getByRole("button", { name: /^Cerrar vigencia$/i }));

      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getAllByTestId("assignment-action-error")).toHaveLength(1);
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("CA6: éxito al desactivar conserva el toast", async () => {
      const user = userEvent.setup();
      renderActions(sampleAssignment);

      await user.click(openMenuButton());
      await user.click(screen.getByText("Desactivar asignación"));
      await user.click(screen.getByRole("button", { name: /^Desactivar$/i }));

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith({
          title: "Asignación desactivada",
          variant: "success",
        }),
      );
    });
  });
});
