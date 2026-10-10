import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatDate } from "@shared/utils/dateUtils";
import type { TemplateAssignment } from "../../domain/entities";
import { TemplateAssignmentsTable } from "./TemplateAssignmentsTable";

vi.mock("./TemplateAssignmentActions", () => ({
  TemplateAssignmentActions: ({ assignment }: { assignment: TemplateAssignment }) =>
    assignment.isUsedInSettlement === true ? (
      <span data-testid="actions-in-use">{String(assignment.isUsedInSettlement)}</span>
    ) : (
      <button type="button" data-assignment-menu-trigger>
        Acciones de {assignment.employeeFullName}
      </button>
    ),
}));

vi.mock("./FixedAllowanceOverridePanel", () => ({
  FixedAllowanceOverridePanel: () => null,
}));

function makeAssignment(overrides: Partial<TemplateAssignment>): TemplateAssignment {
  return {
    id: "assign",
    employeeId: "emp",
    employeeFullName: "Operador",
    templateId: "tpl-1",
    templateName: "Esquema demo",
    effectiveFrom: "2026-08-01",
    effectiveTo: null,
    isActive: true,
    assignedBy: null,
    reason: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderTable(assignments: TemplateAssignment[], focusedAssignmentId?: string) {
  render(
    <TemplateAssignmentsTable
      assignments={assignments}
      fixedAllowances={[]}
      isLoading={false}
      focusedAssignmentId={focusedAssignmentId}
    />,
  );
}

function bodyRows() {
  const [, ...rows] = screen.getAllByRole("row");
  return rows;
}

describe("TemplateAssignmentsTable", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 2026-10-01 01:00 UTC = 2026-09-30 19:00 en CDMX: «hoy» es el 30 de septiembre.
    vi.setSystemTime(new Date("2026-10-01T01:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("criterio 10: con fin antes de hoy (CDMX) es «Concluida», nunca «Vigente»", () => {
    renderTable([
      makeAssignment({
        id: "ended",
        employeeFullName: "Ana Ruiz",
        effectiveTo: "2026-09-29",
        isActive: true,
      }),
    ]);

    const [row] = bodyRows();
    expect(within(row).getByText("Concluida")).toBeInTheDocument();
    expect(within(row).queryByText("Vigente")).not.toBeInTheDocument();
  });

  it("termina hoy (CDMX) sigue «Vigente» aunque en UTC ya sea mañana", () => {
    renderTable([makeAssignment({ id: "today", effectiveTo: "2026-09-30" })]);

    const [row] = bodyRows();
    expect(within(row).getByText("Vigente")).toBeInTheDocument();
  });

  it("ordena Vigente, Programada, Concluida, Desactivada y «Desde» descendente en cada grupo", async () => {
    const user = userEvent.setup();
    renderTable([
      makeAssignment({ id: "d", employeeFullName: "Desactivada", isActive: false }),
      makeAssignment({
        id: "c",
        employeeFullName: "Concluida",
        effectiveFrom: "2026-07-01",
        effectiveTo: "2026-08-31",
      }),
      makeAssignment({ id: "v-old", employeeFullName: "Vigente antigua", effectiveFrom: "2026-06-01" }),
      makeAssignment({ id: "p", employeeFullName: "Programada", effectiveFrom: "2026-11-01" }),
      makeAssignment({ id: "v-new", employeeFullName: "Vigente reciente", effectiveFrom: "2026-09-01" }),
    ]);
    await user.click(screen.getByRole("button", { name: "Mostrar desactivadas (1)" }));

    const names = bodyRows().map((row) => within(row).getAllByRole("cell")[0].textContent);
    expect(names).toEqual([
      "Vigente reciente",
      "Vigente antigua",
      "Programada",
      "Concluida",
      "Desactivada",
    ]);
  });

  it("muestra las fechas con formatDate, sin saltos de línea", () => {
    renderTable([
      makeAssignment({ id: "c", effectiveFrom: "2026-07-01", effectiveTo: "2026-08-31" }),
    ]);

    const [row] = bodyRows();
    const from = within(row).getByText(formatDate("2026-07-01"));
    const to = within(row).getByText(formatDate("2026-08-31"));
    expect(from).toHaveClass("whitespace-nowrap");
    expect(to).toHaveClass("whitespace-nowrap");
    expect(within(row).queryByText("2026-07-01")).not.toBeInTheDocument();
  });

  it("la insignia explica el estado con tooltip enfocable con teclado", async () => {
    renderTable([makeAssignment({ id: "p", effectiveFrom: "2026-11-01" })]);
    const user = userEvent.setup();

    const trigger = screen.getByTestId("assignment-display-status-trigger");
    expect(trigger).not.toHaveAttribute("title");
    await user.tab();
    expect(trigger).toHaveFocus();
    expect(
      await screen.findByRole("tooltip", {
        name: `Empieza a cobrar con esta versión el ${formatDate("2026-11-01")}.`,
      }),
    ).toBeInTheDocument();
  });

  describe("desactivada y usada en una liquidación (PRD D2)", () => {
    const deactivatedTooltip = "No se usa para calcular pagos. Los pagos ya registrados no cambian.";
    const inUseTooltip =
      "No se usa para calcular pagos. Formó parte de una liquidación (aunque esté cancelada), así que se conserva como historial y no se puede eliminar.";

    it.each([
      ["en uso", true, inUseTooltip],
      ["sin uso", false, deactivatedTooltip],
      ["sin el campo (API anterior)", undefined, deactivatedTooltip],
    ])("CA2: tooltip de «Desactivada» %s", async (_label, isUsedInSettlement, tooltip) => {
      renderTable([makeAssignment({ id: "d", isActive: false, isUsedInSettlement })]);
      const user = userEvent.setup();

      await user.tab();
      expect(screen.getByTestId("assignment-display-status-trigger")).toHaveFocus();
      expect(await screen.findByRole("tooltip", { name: tooltip })).toBeInTheDocument();
    });

    it("la tabla pasa la asignación completa a las acciones y conserva la celda", () => {
      renderTable([makeAssignment({ id: "d", isActive: false, isUsedInSettlement: true })]);

      const [row] = bodyRows();
      expect(within(row).getAllByRole("cell")).toHaveLength(5);
      expect(screen.getByTestId("actions-in-use")).toHaveTextContent("true");
    });
  });

  describe("desactivadas colapsadas (PRD D6)", () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;

    beforeEach(() => {
      scrollIntoView.mockClear();
      Element.prototype.scrollIntoView = scrollIntoView;
    });

    afterEach(() => {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    const mixed = [
      makeAssignment({ id: "d1", employeeFullName: "Desactivada uno", isActive: false }),
      makeAssignment({ id: "v1", employeeFullName: "Vigente uno", effectiveFrom: "2026-09-01" }),
      makeAssignment({
        id: "d2",
        employeeFullName: "Desactivada dos",
        isActive: false,
        effectiveFrom: "2026-07-01",
      }),
      makeAssignment({ id: "v2", employeeFullName: "Vigente dos", effectiveFrom: "2026-06-01" }),
      makeAssignment({
        id: "d3",
        employeeFullName: "Desactivada tres",
        isActive: false,
        effectiveFrom: "2026-06-01",
      }),
    ];

    function rowNames() {
      return bodyRows().map((row) => within(row).getAllByRole("cell")[0].textContent);
    }

    it("CA9: 2 vigentes + 3 desactivadas → 2 filas y «Mostrar desactivadas (3)»; al pulsar aparecen al final", async () => {
      const user = userEvent.setup();
      renderTable(mixed);

      expect(rowNames()).toEqual(["Vigente uno", "Vigente dos"]);
      const toggle = screen.getByRole("button", { name: "Mostrar desactivadas (3)" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      await user.click(toggle);

      expect(rowNames()).toEqual([
        "Vigente uno",
        "Vigente dos",
        "Desactivada uno",
        "Desactivada dos",
        "Desactivada tres",
      ]);
      const hide = screen.getByRole("button", { name: "Ocultar desactivadas" });
      expect(hide).toHaveAttribute("aria-expanded", "true");

      await user.click(hide);

      expect(rowNames()).toEqual(["Vigente uno", "Vigente dos"]);
      expect(screen.getByRole("button", { name: "Mostrar desactivadas (3)" })).toBeInTheDocument();
    });

    it("CA10: todas desactivadas → se ven todas, sin botón", () => {
      renderTable(mixed.filter((assignment) => assignment.isActive === false));

      expect(rowNames()).toEqual(["Desactivada uno", "Desactivada dos", "Desactivada tres"]);
      expect(screen.queryByRole("button", { name: /desactivadas/i })).not.toBeInTheDocument();
    });

    it("sin desactivadas no hay botón", () => {
      renderTable(mixed.filter((assignment) => assignment.isActive !== false));

      expect(rowNames()).toEqual(["Vigente uno", "Vigente dos"]);
      expect(screen.queryByRole("button", { name: /desactivadas/i })).not.toBeInTheDocument();
    });

    it("CA11: foco en una desactivada → sección abierta, fila resaltada y con foco", () => {
      renderTable(mixed, "d2");

      expect(rowNames()).toHaveLength(5);
      expect(screen.getByRole("button", { name: "Ocultar desactivadas" })).toBeInTheDocument();
      const focused = bodyRows().filter((row) => row.getAttribute("data-focused") === "true");
      expect(focused).toHaveLength(1);
      expect(focused[0]).toHaveTextContent("Desactivada dos");
      expect(focused[0]).toHaveClass("bg-accent");
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(
        within(focused[0]).getByRole("button", { name: "Acciones de Desactivada dos" }),
      ).toHaveFocus();
    });

    it("CA11: foco en una desactivada en uso (sin «···») → la fila misma recibe el foco", () => {
      renderTable(
        mixed.map((assignment) =>
          assignment.id === "d3" ? { ...assignment, isUsedInSettlement: true } : assignment,
        ),
        "d3",
      );

      const focused = bodyRows().find((row) => row.getAttribute("data-focused") === "true");
      expect(focused).toHaveTextContent("Desactivada tres");
      expect(focused).toHaveFocus();
    });

    it("foco en una vigente → las desactivadas siguen ocultas", () => {
      renderTable(mixed, "v2");

      expect(rowNames()).toEqual(["Vigente uno", "Vigente dos"]);
      expect(screen.getByRole("button", { name: "Mostrar desactivadas (3)" })).toBeInTheDocument();
    });

    it("tras abrir por foco, el usuario puede volver a ocultarlas", async () => {
      const user = userEvent.setup();
      renderTable(mixed, "d1");

      await user.click(screen.getByRole("button", { name: "Ocultar desactivadas" }));

      expect(rowNames()).toEqual(["Vigente uno", "Vigente dos"]);
    });
  });

  describe("D20: asignación enfocada", () => {
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = Element.prototype.scrollIntoView;

    beforeEach(() => {
      scrollIntoView.mockClear();
      Element.prototype.scrollIntoView = scrollIntoView;
    });

    afterEach(() => {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    const assignments = [
      makeAssignment({ id: "a", employeeFullName: "Ana Ruiz" }),
      makeAssignment({ id: "b", employeeFullName: "Beto Díaz", effectiveFrom: "2026-07-01" }),
    ];

    it("resalta la fila, la lleva a la vista y pone el foco en su «···»", () => {
      renderTable(assignments, "b");

      const focused = bodyRows().filter((row) => row.getAttribute("data-focused") === "true");
      expect(focused).toHaveLength(1);
      expect(focused[0]).toHaveTextContent("Beto Díaz");
      expect(focused[0]).toHaveClass("bg-accent");
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView.mock.contexts[0]).toBe(focused[0]);
      expect(within(focused[0]).getByRole("button", { name: "Acciones de Beto Díaz" })).toHaveFocus();
    });

    it("sin foco en la URL no resalta ni mueve el foco", () => {
      renderTable(assignments);

      expect(bodyRows().some((row) => row.hasAttribute("data-focused"))).toBe(false);
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(document.body).toHaveFocus();
    });
  });
});
