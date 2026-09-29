import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { tripsListCopy } from "../copy/listCopy";
import { TripListFilters } from "./TripListFilters";

const copy = tripsListCopy.filter;

function renderFleet(
  overrides: Partial<ComponentProps<typeof TripListFilters>> = {},
) {
  return render(
    <TripListFilters
      invoiceStatusFilter={undefined}
      dateFrom=""
      dateTo=""
      originBranchId=""
      originBranchOptions={[{ value: "b1", label: "MTY — Monterrey" }]}
      activePanelFilterCount={0}
      onInvoiceStatusChange={vi.fn()}
      onApplyDateRange={vi.fn()}
      onClearDateRange={vi.fn()}
      onOriginBranchChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("TripListFilters", () => {
  it("muestra Filtros en flota sin select de atención fiscal", () => {
    renderFleet();

    expect(
      screen.getByRole("button", { name: copy.showFilters }),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.fiscalLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(tripsListCopy.actions.viewDrafts)).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay recortes activos", () => {
    renderFleet({
      invoiceStatusFilter: "stamped",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      activePanelFilterCount: 2,
    });

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(copy.invoiceLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.dateLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.originBranchLabel)).toBeInTheDocument();
  });

  it("en lean solo deja la fecha, sin panel de factura ni sucursal", () => {
    renderFleet({ variant: "lean" });

    expect(
      screen.queryByRole("button", { name: copy.showFilters }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(copy.invoiceLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.originBranchLabel)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.datePlaceholder }),
    ).toBeInTheDocument();
  });
});
