import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FinanceDispatchPeriodFilters } from "./FinanceDispatchPeriodFilters";

const copy = dispatchRunsCopy.tab.filters;

function renderFilters(
  overrides: Partial<ComponentProps<typeof FinanceDispatchPeriodFilters>> = {},
) {
  return render(
    <FinanceDispatchPeriodFilters
      status=""
      billingSchemeId=""
      schemes={[{ id: "scheme-weekly", name: "Corte semanal viernes" }]}
      activePanelFilterCount={0}
      onStatusChange={vi.fn()}
      onSchemeChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("FinanceDispatchPeriodFilters", () => {
  it("muestra Filtros sin badge ni labels cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(copy.statusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.schemeLabel)).not.toBeInTheDocument();
  });

  it("abre el panel con badge y labels cuando hay recortes", () => {
    renderFilters({
      status: "cancelled",
      billingSchemeId: "scheme-weekly",
      activePanelFilterCount: 2,
    });

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(copy.statusLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.schemeLabel)).toBeInTheDocument();
    expect(screen.getByText(dispatchRunsCopy.status.cancelled)).toBeInTheDocument();
    expect(screen.getByText("Corte semanal viernes")).toBeInTheDocument();
  });
});
