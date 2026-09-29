import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BRANCH_STATUS_LABELS, BranchStatus } from "../../domain";
import { branchesCopy } from "../copy/branchesCopy";
import { BranchListFilters } from "./BranchListFilters";

const filterCopy = branchesCopy.list.filter;

function renderFilters(
  overrides: Partial<ComponentProps<typeof BranchListFilters>> = {},
) {
  return render(
    <BranchListFilters
      status=""
      isMain=""
      createdFrom=""
      createdTo=""
      activePanelFilterCount={0}
      onStatusChange={vi.fn()}
      onTypeChange={vi.fn()}
      onCreatedFromChange={vi.fn()}
      onCreatedToChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("BranchListFilters", () => {
  it("muestra Filtros sin badge ni labels cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(filterCopy.statusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(filterCopy.createdHeading)).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay recortes", () => {
    renderFilters({
      status: BranchStatus.ACTIVE,
      isMain: "true",
      createdFrom: "2026-01-01",
      createdTo: "2026-01-31",
      activePanelFilterCount: 3,
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(filterCopy.statusLabel)).toBeInTheDocument();
    expect(screen.getByText(filterCopy.typeLabel)).toBeInTheDocument();
    expect(screen.getByText(filterCopy.createdHeading)).toBeInTheDocument();
    expect(
      screen.getByText(BRANCH_STATUS_LABELS[BranchStatus.ACTIVE]),
    ).toBeInTheDocument();
    expect(screen.getByText(filterCopy.typeMain)).toBeInTheDocument();
  });
});
