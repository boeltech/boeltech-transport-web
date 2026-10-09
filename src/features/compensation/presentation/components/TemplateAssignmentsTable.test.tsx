import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { formatDate } from "@shared/utils/dateUtils";
import type { TemplateAssignment } from "../../domain/entities";
import { TemplateAssignmentsTable } from "./TemplateAssignmentsTable";

vi.mock("./TemplateAssignmentActions", () => ({
  TemplateAssignmentActions: ({ assignment }: { assignment: TemplateAssignment }) => (
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

  it("ordena Vigente, Programada, Concluida, Desactivada y «Desde» descendente en cada grupo", () => {
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
