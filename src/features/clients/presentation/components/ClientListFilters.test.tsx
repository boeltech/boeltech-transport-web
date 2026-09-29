import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { clientsCopy } from "../copy/clientsCopy";
import { ClientListFilters } from "./ClientListFilters";

const copy = clientsCopy.filter;

function renderFilters(
  overrides: Partial<ComponentProps<typeof ClientListFilters>> = {},
) {
  return render(
    <ClientListFilters
      type=""
      paymentTerms=""
      status=""
      activePanelFilterCount={0}
      onTypeChange={vi.fn()}
      onPaymentTermsChange={vi.fn()}
      onStatusChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("ClientListFilters", () => {
  it("muestra Filtros sin badge cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(copy.typeLabel)).not.toBeInTheDocument();
  });

  it("abre el panel con badge y labels cuando hay recortes", () => {
    renderFilters({
      type: "company",
      paymentTerms: "credit",
      status: "active",
      activePanelFilterCount: 3,
    });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(copy.typeLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.paymentLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.statusLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.typeMoral)).toBeInTheDocument();
    expect(screen.getByText(copy.paymentCredit)).toBeInTheDocument();
    expect(screen.getByText(copy.statusActive)).toBeInTheDocument();
  });
});
