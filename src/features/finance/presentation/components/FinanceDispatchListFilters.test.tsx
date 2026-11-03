import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FinanceDispatchListFilters } from "./FinanceDispatchListFilters";

function renderFilters(
  overrides: Partial<ComponentProps<typeof FinanceDispatchListFilters>> = {},
) {
  return render(
    <FinanceDispatchListFilters
      documentKind="all"
      activePanelFilterCount={0}
      onDocumentKindChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("FinanceDispatchListFilters", () => {
  it("shows Filtros trigger without panel fields when idle", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("Tipo")).not.toBeInTheDocument();
  });

  it("opens panel with visible Tipo label and closed value without Tipo: prefix", () => {
    renderFilters({ documentKind: "invoice", activePanelFilterCount: 1 });

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByLabelText("Tipo")).toBeInTheDocument();
    const typeSelect = screen.getByRole("combobox", {
      name: /Filtrar por tipo de documento/i,
    });
    expect(typeSelect).toHaveTextContent("Facturas");
    expect(typeSelect).not.toHaveTextContent("Tipo:");
  });

  it("keeps emission period inside the panel when showDateRange", () => {
    renderFilters({
      documentKind: "all",
      activePanelFilterCount: 1,
      showDateRange: true,
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
      onApplyDateRange: vi.fn(),
      onClearDateRange: vi.fn(),
    });

    expect(screen.getByText("Periodo de emisión")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Quitar filtro de fechas/i }),
    ).toBeInTheDocument();
  });
});

