import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TRAILER_STATUS_LABELS, TrailerStatus } from "../../domain";
import { trailersCopy } from "../copy/trailersCopy";
import { TrailerListFilters } from "./TrailerListFilters";

const filterCopy = trailersCopy.list.filter;

function renderFilters(
  overrides: Partial<ComponentProps<typeof TrailerListFilters>> = {},
) {
  return render(
    <TrailerListFilters
      status=""
      activePanelFilterCount={0}
      onStatusChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("TrailerListFilters", () => {
  it("muestra Filtros sin badge ni labels cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(filterCopy.statusLabel)).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay estado", () => {
    renderFilters({
      status: TrailerStatus.AVAILABLE,
      activePanelFilterCount: 1,
    });

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(filterCopy.statusLabel)).toBeInTheDocument();
    expect(
      screen.getByText(TRAILER_STATUS_LABELS[TrailerStatus.AVAILABLE]),
    ).toBeInTheDocument();
  });
});
