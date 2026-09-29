import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { approvalsCopy } from "../copy/approvalsCopy";
import { ApprovalFilters } from "./ApprovalFilters";

const copy = approvalsCopy.inbox.filters;

function renderFilters(
  overrides: Partial<ComponentProps<typeof ApprovalFilters>> = {},
) {
  return render(
    <ApprovalFilters
      status="pending"
      category=""
      fromDate=""
      toDate=""
      showCategory
      activePanelFilterCount={0}
      onStatusChange={vi.fn()}
      onCategoryChange={vi.fn()}
      onApplyDateRange={vi.fn()}
      onClearDateRange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("ApprovalFilters", () => {
  it("muestra Filtros sin badge cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(copy.status)).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay recortes activos", () => {
    renderFilters({
      status: "approved",
      category: "fuel",
      fromDate: "2026-09-01",
      toDate: "2026-09-30",
      activePanelFilterCount: 3,
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(copy.status)).toBeInTheDocument();
    expect(screen.getByText(copy.category)).toBeInTheDocument();
    expect(screen.getByText(copy.dateLabel)).toBeInTheDocument();
  });

  it("oculta categoría cuando el tipo no es gasto de viaje", () => {
    renderFilters({
      status: "approved",
      showCategory: false,
      activePanelFilterCount: 1,
    });

    expect(screen.getByText(copy.status)).toBeInTheDocument();
    expect(screen.queryByText(copy.category)).not.toBeInTheDocument();
    expect(screen.getByText(copy.dateLabel)).toBeInTheDocument();
  });
});
