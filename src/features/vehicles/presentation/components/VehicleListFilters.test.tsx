import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VEHICLE_STATUS_LABELS, VehicleStatus, VehicleType } from "../../domain";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import { VehicleListFilters } from "./VehicleListFilters";

const filterCopy = vehiclesCopy.list.filter;
const branchCopy = vehiclesCopy.list.filters;

function renderFilters(
  overrides: Partial<ComponentProps<typeof VehicleListFilters>> = {},
) {
  return render(
    <VehicleListFilters
      status=""
      type=""
      branchId=""
      branchOptions={[{ value: "b1", label: "SUC-N — Norte" }]}
      activePanelFilterCount={0}
      onStatusChange={vi.fn()}
      onTypeChange={vi.fn()}
      onBranchChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("VehicleListFilters", () => {
  it("muestra Filtros sin badge ni labels cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(filterCopy.statusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(branchCopy.allBranches)).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay recortes", () => {
    renderFilters({
      status: VehicleStatus.ON_TRIP,
      type: VehicleType.TRUCK,
      branchId: "b1",
      activePanelFilterCount: 3,
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(filterCopy.statusLabel)).toBeInTheDocument();
    expect(screen.getByText(filterCopy.typeLabel)).toBeInTheDocument();
    expect(screen.getByText(branchCopy.branch)).toBeInTheDocument();
    expect(
      screen.getByText(VEHICLE_STATUS_LABELS[VehicleStatus.ON_TRIP]),
    ).toBeInTheDocument();
    expect(screen.getByText("Tractocamión")).toBeInTheDocument();
    expect(screen.getByText("SUC-N — Norte")).toBeInTheDocument();
  });

  it("oculta sucursal cuando no hay sucursales activas", () => {
    renderFilters({
      status: VehicleStatus.AVAILABLE,
      branchOptions: [],
      activePanelFilterCount: 1,
    });

    expect(screen.getByText(filterCopy.statusLabel)).toBeInTheDocument();
    expect(screen.queryByText(branchCopy.branch)).not.toBeInTheDocument();
  });
});
