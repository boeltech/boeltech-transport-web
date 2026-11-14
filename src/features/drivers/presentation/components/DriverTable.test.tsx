import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import type { DriverListItem } from "../../domain";
import { driversCopy } from "../copy";
import { DriverTable } from "./DriverTable";

vi.mock("./DriverActions", () => ({
  DriverActions: () => <button type="button">acciones</button>,
}));

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

function listDriver(
  overrides: Partial<DriverListItem> = {},
): DriverListItem {
  return {
    id: "d1",
    tenantId: "t-1",
    employeeId: "e1",
    employee: {
      id: "e1",
      firstName: "Luis",
      lastName: "García",
      secondLastName: null,
      fullName: "Luis García",
      employeeNumber: "EMP-010",
      email: "luis@example.com",
      phone: "5550001111",
      mobilePhone: null,
      curp: null,
      rfc: "GACL800101AAA",
      branchId: null,
      branchName: "Centro",
      branchCode: "CEN",
    },
    federalLicenseNumber: "SICT-1",
    federalLicenseCategory: "B",
    federalLicenseExpiry: "2027-01-01",
    stateLicenseNumber: null,
    stateLicenseExpiry: null,
    stateIssuingState: null,
    hasFederalLicense: true,
    hasStateLicense: false,
    isFederalLicenseExpired: false,
    isStateLicenseExpired: false,
    status: "available",
    yearsOfExperience: 5,
    totalTrips: 3,
    isLicenseExpired: false,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    branchId: null,
    branchName: "Centro",
    branchCode: "CEN",
    ...overrides,
  };
}

const sort = { field: "employee_name", direction: "asc" as const };

describe("DriverTable", () => {
  it("retorna null cuando no hay filas (empty del shell)", () => {
    const { container } = renderWithProviders(
      <DriverTable
        drivers={[]}
        isLoading={false}
        primaryTo={(row) => `/drivers/${row.id}`}
        sort={sort}
        onSortChange={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza columnas y link primario en Conductor", () => {
    renderWithProviders(
      <DriverTable
        drivers={[listDriver()]}
        isLoading={false}
        primaryTo={(row) => `/drivers/${row.id}`}
        sort={sort}
        onSortChange={vi.fn()}
        onView={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("columnheader", {
        name: driversCopy.list.table.name,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", {
        name: driversCopy.list.table.status,
      }),
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: "Luis García" });
    expect(link).toHaveAttribute("href", "/drivers/d1");
  });
});
