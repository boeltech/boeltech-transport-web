import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import type { EmployeeListItem } from "../../domain/entities";
import { employeesCopy } from "../copy/employeesCopy";
import { EmployeeTable } from "./EmployeeTable";

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function listEmployee(
  overrides: Partial<EmployeeListItem> = {},
): EmployeeListItem {
  return {
    id: "e1",
    employeeNumber: "EMP-001",
    firstName: "Ana",
    lastName: "Pérez",
    secondLastName: null,
    fullName: "Ana Pérez",
    gender: null,
    email: "ana@example.com",
    phone: "5551234567",
    department: "Operaciones",
    position: "Despachador",
    employmentType: "permanent",
    hireDate: "2026-01-15",
    status: "active",
    isActive: true,
    ...overrides,
  };
}

const sort = { field: "hire_date", direction: "desc" as const };

describe("EmployeeTable", () => {
  it("retorna null cuando no hay filas (empty del shell)", () => {
    const { container } = renderWithProviders(
      <EmployeeTable
        employees={[]}
        isLoading={false}
        primaryTo={(row) => `/employees/${row.id}`}
        sort={sort}
        onSortChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza columnas y link primario en Empleado", () => {
    renderWithProviders(
      <EmployeeTable
        employees={[listEmployee()]}
        isLoading={false}
        primaryTo={(row) => `/employees/${row.id}`}
        sort={sort}
        onSortChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("columnheader", {
        name: employeesCopy.list.table.employee,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", {
        name: employeesCopy.list.table.status,
      }),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Ana Pérez" });
    expect(link).toHaveAttribute("href", "/employees/e1");
    expect(screen.getByText("EMP-001")).toBeInTheDocument();
  });
});
