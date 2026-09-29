import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EMPLOYEE_STATUS_LABELS } from "../config/employeeConfig";
import { employeesCopy } from "../copy/employeesCopy";
import { EmployeeListFilters } from "./EmployeeListFilters";

const copy = employeesCopy.list.filter;

function renderFilters(
  overrides: Partial<ComponentProps<typeof EmployeeListFilters>> = {},
) {
  return render(
    <EmployeeListFilters
      status=""
      type=""
      position=""
      activePanelFilterCount={0}
      onStatusChange={vi.fn()}
      onTypeChange={vi.fn()}
      onPositionChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("EmployeeListFilters", () => {
  it("muestra Filtros sin badge cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(copy.statusLabel)).not.toBeInTheDocument();
  });

  it("abre el panel con badge y labels cuando hay recortes", () => {
    renderFilters({
      status: "on_vacation",
      type: "permanent",
      position: "Conductor",
      activePanelFilterCount: 3,
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(copy.statusLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.typeLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.positionLabel)).toBeInTheDocument();
    expect(screen.getByText(EMPLOYEE_STATUS_LABELS.on_vacation)).toBeInTheDocument();
    expect(screen.getByText("Planta")).toBeInTheDocument();
    expect(screen.getByText("Conductor")).toBeInTheDocument();
    expect(screen.queryByText(/Activos|Inactivos/)).not.toBeInTheDocument();
  });
});
