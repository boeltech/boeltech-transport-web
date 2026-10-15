import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeDetailPage } from "./EmployeeDetailPage";
import { employeesCopy } from "../copy/employeesCopy";
import type { Employee } from "../../domain/entities";
import { TooltipProvider } from "@shared/ui/tooltip";

const { mockUseEmployee, mockHasPermission } = vi.hoisted(() => ({
  mockUseEmployee: vi.fn(),
  mockHasPermission: vi.fn(),
}));

vi.mock("../../application/hooks/useEmployees", () => ({
  useEmployee: (...args: unknown[]) => mockUseEmployee(...args),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (...args: unknown[]) => mockHasPermission(...args),
  }),
}));

vi.mock("../components/EmployeeActions", () => ({
  EmployeeActions: () => null,
}));

vi.mock("../components/detail", () => ({
  EmployeePersonalTab: () => <div>Personal</div>,
  EmployeeContactTab: () => <div>Contacto</div>,
  EmployeeEmploymentTab: () => <div>Empleo</div>,
  EmployeeCompensationTab: () => <div>Compensación</div>,
}));

function buildEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    tenantId: "t-1",
    employeeNumber: "E-100",
    firstName: "Ana",
    lastName: "López",
    secondLastName: null,
    fullName: "Ana López",
    birthDate: null,
    gender: null,
    maritalStatus: null,
    nationality: null,
    birthPlace: null,
    curp: null,
    rfc: "LOXA800101ABC",
    nss: "12345678901",
    infonavitNumber: null,
    email: "ana@example.com",
    phone: null,
    mobilePhone: null,
    personalAddress: null,
    street: null,
    exteriorNumber: null,
    interiorNumber: null,
    neighborhood: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
    hireDate: "2024-01-15",
    terminationDate: null,
    terminationReason: null,
    employmentType: "permanent",
    department: "Operaciones",
    position: "Operador",
    jobTitle: null,
    reportsTo: null,
    workLocation: null,
    branchId: null,
    branchName: null,
    branchCode: null,
    baseSalary: null,
    salaryType: null,
    paymentMethod: null,
    bankName: null,
    bankAccountNumber: null,
    bankClabe: null,
    status: "active",
    isActive: true,
    bloodType: null,
    medicalNotes: null,
    photoUrl: null,
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: null,
    updatedBy: null,
    createdByName: null,
    updatedByName: null,
    driverRole: {
      driverId: "55555555-5555-4555-8555-555555555555",
      driverStatus: "available",
      activeTripCount: 0,
      activeTripCodes: [],
      blocksEmployeeTermination: false,
    },
    ...overrides,
  };
}

function renderDetail(
  state?: { from?: string },
  employee: Employee = buildEmployee(),
) {
  mockUseEmployee.mockReturnValue({
    data: { data: employee },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const path = `/employees/${employee.id}`;
  const router = createMemoryRouter(
    [
      {
        path: "/employees/:id",
        element: (
          <QueryClientProvider client={client}>
            <TooltipProvider>
              <EmployeeDetailPage />
            </TooltipProvider>
          </QueryClientProvider>
        ),
      },
    ],
    {
      initialEntries: [state ? { pathname: path, state } : path],
    },
  );
  return render(<RouterProvider router={router} />);
}

describe("EmployeeDetailPage wayfinding (W7-03 / W7-04 / O7-05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        (module === "employees" && action === "update") ||
        (module === "drivers" && action === "read"),
    );
  });

  it("CTA conductor lleva state.from del detalle", () => {
    renderDetail({ from: "/employees?status=active" });

    const link = screen.getByRole("link", {
      name: employeesCopy.detail.alert.goToDriver,
    });
    expect(link).toHaveAttribute(
      "href",
      "/drivers/55555555-5555-4555-8555-555555555555",
    );
  });

  it("oculta CTA conductor sin drivers.read", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "employees" && action === "update",
    );
    renderDetail();

    expect(
      screen.queryByRole("link", {
        name: employeesCopy.detail.alert.goToDriver,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(employeesCopy.detail.alert.driverRole.activeTitle),
    ).toBeInTheDocument();
  });
});
