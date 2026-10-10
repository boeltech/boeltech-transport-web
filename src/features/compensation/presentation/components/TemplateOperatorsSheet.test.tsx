import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatDate } from "@shared/utils/dateUtils";
import type { CompensationTemplate, TemplateAssignment } from "../../domain/entities";
import type { FocusedTemplateAssignment } from "../hooks/useFocusedTemplateAssignment";
import { TemplateOperatorsSheet } from "./TemplateOperatorsSheet";

const { mockUseFocused, mockUseCompensationTemplate, mockUseTemplateAssignments } = vi.hoisted(
  () => ({
    mockUseFocused: vi.fn(),
    mockUseCompensationTemplate: vi.fn(),
    mockUseTemplateAssignments: vi.fn(),
  }),
);

vi.mock("../hooks/useFocusedTemplateAssignment", () => ({
  TEMPLATE_OPERATORS_PAGE_SIZE: 100,
  useFocusedTemplateAssignment: (...args: unknown[]) => mockUseFocused(...args),
}));

vi.mock("../../application/hooks", () => ({
  useCompensationTemplate: (...args: unknown[]) => mockUseCompensationTemplate(...args),
  useTemplateAssignments: (...args: unknown[]) => mockUseTemplateAssignments(...args),
}));

vi.mock("./TemplateOperatorsPanel", () => ({
  TemplateOperatorsPanel: ({
    batchOpen,
    onBatchOpenChange,
    focusAssignmentId,
  }: {
    batchOpen: boolean;
    onBatchOpenChange: (open: boolean) => void;
    focusAssignmentId?: string;
  }) => (
    <div
      data-testid="operators-panel"
      data-batch-open={String(batchOpen)}
      data-focus={focusAssignmentId ?? ""}
    >
      <button type="button" onClick={() => onBatchOpenChange(false)}>
        Cerrar lote
      </button>
    </div>
  ),
}));

function makeTemplate(overrides: Partial<CompensationTemplate>): CompensationTemplate {
  return {
    id: "tpl-v1",
    name: "Foráneo",
    description: null,
    isActive: true,
    status: "active",
    version: 1,
    familyId: "tpl-v1",
    lockedForEdit: false,
    rules: [],
    fixedAllowances: [],
    deductions: [],
    corridorIds: [],
    corridors: [],
    ...overrides,
  } as CompensationTemplate;
}

const destination = makeTemplate({ id: "tpl-v1", name: "Foráneo", version: 1 });
const origin = makeTemplate({ id: "tpl-v2", name: "Foráneo", version: 2, familyId: "tpl-v1" });

const fernando: TemplateAssignment = {
  id: "asg-fernando",
  employeeId: "emp-fernando",
  employeeFullName: "Fernando Ruiz",
  templateId: "tpl-v1",
  templateName: "Foráneo",
  effectiveFrom: "2026-08-01",
  effectiveTo: null,
  isActive: true,
  assignedBy: null,
  reason: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

function found(assignment: TemplateAssignment = fernando): FocusedTemplateAssignment {
  return { status: "found", assignment, inPage: true };
}

type SheetProps = Partial<Parameters<typeof TemplateOperatorsSheet>[0]>;

function sheetElement(props: SheetProps) {
  return (
    <TemplateOperatorsSheet open onOpenChange={vi.fn()} template={destination} {...props} />
  );
}

function notice() {
  return screen.getByTestId("operators-sheet-focus-notice");
}

describe("TemplateOperatorsSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFocused.mockReturnValue({ status: "none" });
    mockUseCompensationTemplate.mockImplementation((id?: string) => ({
      data: id === origin.id ? origin : undefined,
    }));
    mockUseTemplateAssignments.mockReturnValue({ data: { data: [] } });
  });

  describe("D5: aviso de versión reemplazada según quién cobra con ella", () => {
    const STILL_PAYING =
      "Esta versión ya fue reemplazada, pero hay operadores que todavía cobran o cobrarán con ella. Para que cobren con la versión activa, asígnalos desde esa versión indicando desde qué fecha.";
    const NONE_PAYING = "Esta versión ya fue reemplazada y ningún operador cobra con ella.";
    const HISTORY = "Las asignaciones de abajo se conservan como historial.";

    function superseded(counts: Partial<CompensationTemplate>) {
      return makeTemplate({
        isActive: false,
        status: "inactive",
        inactiveReason: "superseded",
        activeAssignmentsCount: 0,
        ...counts,
      });
    }

    const versionNotice = () => screen.getByTestId("operators-sheet-version-notice");

    it.each([
      ["vigentes", { activeAssignmentsCount: 2, scheduledAssignmentsCount: 0 }],
      ["solo programadas", { activeAssignmentsCount: 0, scheduledAssignmentsCount: 1 }],
      ["sin programadas en la API (API anterior)", { activeAssignmentsCount: 0 }],
    ])("CA7: con %s → variante A", (_label, counts) => {
      mockUseTemplateAssignments.mockReturnValue({ data: { data: [fernando] } });
      render(sheetElement({ template: superseded(counts) }));

      expect(versionNotice()).toHaveTextContent(STILL_PAYING);
    });

    it("CA8: nadie cobra y hay filas → variante B con la segunda oración", () => {
      mockUseTemplateAssignments.mockReturnValue({
        data: { data: [{ ...fernando, isActive: false }] },
      });
      render(
        sheetElement({
          template: superseded({ activeAssignmentsCount: 0, scheduledAssignmentsCount: 0 }),
        }),
      );

      expect(versionNotice().textContent?.trim()).toBe(`${NONE_PAYING} ${HISTORY}`);
    });

    it("CA8: nadie cobra y no hay filas → solo la primera oración", () => {
      render(
        sheetElement({
          template: superseded({ activeAssignmentsCount: 0, scheduledAssignmentsCount: 0 }),
        }),
      );

      expect(versionNotice().textContent?.trim()).toBe(NONE_PAYING);
    });

    it("pide la misma página de asignaciones que la tabla, solo con el sheet abierto", () => {
      const template = superseded({ activeAssignmentsCount: 1 });
      const { rerender } = render(sheetElement({ template }));
      expect(mockUseTemplateAssignments).toHaveBeenLastCalledWith({
        templateId: template.id,
        pageSize: 100,
      });

      rerender(sheetElement({ template, open: false }));
      expect(mockUseTemplateAssignments).toHaveBeenLastCalledWith({
        templateId: undefined,
        pageSize: 100,
      });
    });
  });

  describe("D21: aviso en la versión destino", () => {
    it("con focus + returnTo explica qué hacer y ofrece volver a la versión de origen", () => {
      mockUseFocused.mockReturnValue(found());
      render(
        sheetElement({
          focusAssignmentId: fernando.id,
          returnTemplateId: origin.id,
          returnEffectiveFrom: "2026-09-01",
          onReturnToBatch: vi.fn(),
          onDismissFocus: vi.fn(),
        }),
      );

      expect(mockUseFocused).toHaveBeenLastCalledWith(destination.id, fernando.id);
      expect(mockUseCompensationTemplate).toHaveBeenLastCalledWith(origin.id);
      expect(within(notice()).getByText("Asignación de Fernando Ruiz")).toBeInTheDocument();
      expect(
        within(notice()).getByText(
          `Para que cobre con Foráneo versión 2 desde el ${formatDate("2026-09-01")}, desactiva esta asignación desde el menú ··· de su fila. Si tiene días ya liquidados, el sistema te dirá desde qué fecha puedes cerrarla.`,
        ),
      ).toBeInTheDocument();
      expect(
        within(notice()).getByRole("button", { name: "Volver a Foráneo versión 2" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("operators-panel")).toHaveAttribute("data-focus", fernando.id);
    });

    it("el aviso va antes del aviso de versión reemplazada", () => {
      mockUseFocused.mockReturnValue(found());
      render(
        sheetElement({
          template: makeTemplate({ isActive: false, status: "inactive", inactiveReason: "superseded" }),
          focusAssignmentId: fernando.id,
          returnTemplateId: origin.id,
        }),
      );

      const versionNotice = screen.getByTestId("operators-sheet-version-notice");
      expect(
        notice().compareDocumentPosition(versionNotice) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("«Volver a …» llama al callback de regreso", async () => {
      const user = userEvent.setup();
      const onReturnToBatch = vi.fn();
      mockUseFocused.mockReturnValue(found());
      render(
        sheetElement({
          focusAssignmentId: fernando.id,
          returnTemplateId: origin.id,
          onReturnToBatch,
          onDismissFocus: vi.fn(),
        }),
      );

      await user.click(within(notice()).getByRole("button", { name: "Volver a Foráneo versión 2" }));
      expect(onReturnToBatch).toHaveBeenCalledTimes(1);
    });

    it("«Listo» llama al callback que quita foco y regreso", async () => {
      const user = userEvent.setup();
      const onDismissFocus = vi.fn();
      const onReturnToBatch = vi.fn();
      mockUseFocused.mockReturnValue(found());
      render(
        sheetElement({
          focusAssignmentId: fernando.id,
          returnTemplateId: origin.id,
          onReturnToBatch,
          onDismissFocus,
        }),
      );

      await user.click(within(notice()).getByRole("button", { name: "Listo" }));
      expect(onDismissFocus).toHaveBeenCalledTimes(1);
      expect(onReturnToBatch).not.toHaveBeenCalled();
    });

    it("criterio 19: ya desactivada, el aviso dice «Listo: …» y sigue ofreciendo volver", () => {
      mockUseFocused.mockReturnValue(found({ ...fernando, isActive: false }));
      render(
        sheetElement({
          focusAssignmentId: fernando.id,
          returnTemplateId: origin.id,
          onReturnToBatch: vi.fn(),
        }),
      );

      expect(notice()).toHaveTextContent(
        "Listo: su asignación en esta versión quedó desactivada. Vuelve para asignarlo.",
      );
      expect(notice()).not.toHaveTextContent("desactiva esta asignación desde el menú");
      expect(
        within(notice()).getByRole("button", { name: "Volver a Foráneo versión 2" }),
      ).toBeInTheDocument();
    });

    it("«No encontramos…» si el focus no está en la versión", () => {
      mockUseFocused.mockReturnValue({ status: "missing" });
      render(
        sheetElement({
          focusAssignmentId: "asg-otra",
          returnTemplateId: origin.id,
          onReturnToBatch: vi.fn(),
          onDismissFocus: vi.fn(),
        }),
      );

      expect(notice()).toHaveTextContent(
        "No encontramos esa asignación en esta versión; pudo haber cambiado. Revisa la lista.",
      );
      expect(within(notice()).queryByText(/^Asignación de/)).not.toBeInTheDocument();
      expect(within(notice()).getByRole("button", { name: "Volver a Foráneo versión 2" })).toBeInTheDocument();
      expect(within(notice()).getByRole("button", { name: "Listo" })).toBeInTheDocument();
    });

    it("D5 (misma versión, sin returnTo): resalta sin aviso ni «Volver»", () => {
      mockUseFocused.mockReturnValue(found());
      render(
        sheetElement({
          focusAssignmentId: fernando.id,
          onReturnToBatch: vi.fn(),
          onDismissFocus: vi.fn(),
        }),
      );

      expect(screen.queryByTestId("operators-sheet-focus-notice")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Volver a/ })).not.toBeInTheDocument();
      expect(screen.getByTestId("operators-panel")).toHaveAttribute("data-focus", fernando.id);
    });
  });

  describe("T5: el lote se reinicia por plantilla", () => {
    function batchOpen() {
      return screen.getByTestId("operators-panel").getAttribute("data-batch-open");
    }

    it("cerrado a mano sigue cerrado en la misma plantilla y se reabre al cambiar de plantilla", async () => {
      const user = userEvent.setup();
      const ids = ["emp-fernando"];
      const { rerender } = render(sheetElement({ batchInitialEmployeeIds: ids }));
      expect(batchOpen()).toBe("true");

      await user.click(screen.getByRole("button", { name: "Cerrar lote" }));
      expect(batchOpen()).toBe("false");

      rerender(sheetElement({ batchInitialEmployeeIds: [...ids] }));
      expect(batchOpen()).toBe("false");

      rerender(sheetElement({ template: origin, batchInitialEmployeeIds: [...ids] }));
      expect(batchOpen()).toBe("true");
    });

    it("sin operadores iniciales (destino con focus) el lote queda cerrado", () => {
      const { rerender } = render(sheetElement({ batchInitialEmployeeIds: ["emp-fernando"] }));
      rerender(sheetElement({ template: origin, batchInitialEmployeeIds: undefined }));
      expect(batchOpen()).toBe("false");
    });

    it("al cerrar el sheet se olvida el lote; al reabrir con operadores vuelve a abrirlo", () => {
      const ids = ["emp-fernando"];
      const { rerender } = render(sheetElement({ batchInitialEmployeeIds: ids }));
      rerender(sheetElement({ open: false, batchInitialEmployeeIds: ids }));
      rerender(sheetElement({ open: true, batchInitialEmployeeIds: ids }));
      expect(batchOpen()).toBe("true");
    });
  });
});
