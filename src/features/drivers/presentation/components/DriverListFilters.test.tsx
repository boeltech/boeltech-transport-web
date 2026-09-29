import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DRIVER_STATUS_LABELS, DriverStatus } from "../../domain";
import { driversCopy } from "../copy/driversCopy";
import { DriverListFilters } from "./DriverListFilters";

const filterCopy = driversCopy.list.filter;
const branchCopy = driversCopy.list.filters;

function renderFilters(
  overrides: Partial<ComponentProps<typeof DriverListFilters>> = {},
) {
  return render(
    <DriverListFilters
      status=""
      branchId=""
      branchOptions={[{ value: "b1", label: "SUC-N — Norte" }]}
      activePanelFilterCount={0}
      onStatusChange={vi.fn()}
      onBranchChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("DriverListFilters", () => {
  it("muestra Filtros sin badge ni labels cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(filterCopy.statusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(branchCopy.allBranches)).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay recortes de estado y sucursal", () => {
    renderFilters({
      status: DriverStatus.ON_TRIP,
      branchId: "b1",
      activePanelFilterCount: 2,
    });

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(filterCopy.statusLabel)).toBeInTheDocument();
    expect(screen.getByText(branchCopy.branch)).toBeInTheDocument();
    expect(
      screen.getByText(DRIVER_STATUS_LABELS[DriverStatus.ON_TRIP]),
    ).toBeInTheDocument();
    expect(screen.getByText("SUC-N — Norte")).toBeInTheDocument();
  });

  it("oculta sucursal cuando no hay sucursales activas", () => {
    renderFilters({
      status: DriverStatus.AVAILABLE,
      branchOptions: [],
      activePanelFilterCount: 1,
    });

    expect(screen.getByText(filterCopy.statusLabel)).toBeInTheDocument();
    expect(screen.queryByText(branchCopy.branch)).not.toBeInTheDocument();
  });
});
