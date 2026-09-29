import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { settlementsCopy } from "../copy/settlementsCopy";
import { SettlementListFilters } from "./SettlementListFilters";

const copy = settlementsCopy.workbench.filter;

describe("SettlementListFilters", () => {
  it("no renderiza el panel si no hay sucursales", () => {
    const { container } = render(
      <SettlementListFilters
        branchId=""
        branches={[]}
        activePanelFilterCount={0}
        onBranchChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("muestra Filtros y el recorte de sucursal cuando hay sucursales y recorte activo", () => {
    render(
      <SettlementListFilters
        branchId="b1"
        branches={[{ id: "b1", name: "Monterrey" }]}
        activePanelFilterCount={1}
        onBranchChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Filtros/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(copy.branchLabel)).toBeInTheDocument();
    expect(screen.queryByText("Todos los operadores")).not.toBeInTheDocument();
  });
});
