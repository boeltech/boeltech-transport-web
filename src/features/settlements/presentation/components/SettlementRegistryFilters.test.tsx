import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { settlementsCopy } from "../copy/settlementsCopy";
import { SettlementRegistryFilters } from "./SettlementRegistryFilters";

const copy = settlementsCopy.registry.filters;

vi.mock("@shared/ui/employee-async-combobox", () => ({
  EmployeeAsyncCombobox: ({
    id,
    placeholder,
  }: {
    id?: string;
    placeholder?: string;
  }) => <div data-testid={id ?? "employee-combobox"}>{placeholder}</div>,
}));

describe("SettlementRegistryFilters", () => {
  it("usa ListingFilterPanel con estado y operador", () => {
    render(
      <SettlementRegistryFilters
        status="approved"
        employeeId="emp-1"
        activePanelFilterCount={2}
        onStatusChange={vi.fn()}
        onEmployeeChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Filtros/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(copy.statusLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.operatorLabel)).toBeInTheDocument();
    expect(screen.getByText(copy.operatorAll)).toBeInTheDocument();
  });
});
