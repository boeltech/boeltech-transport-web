import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeEditPage } from "./EmployeeEditPage";
import { employeesCopy } from "../copy/employeesCopy";
import type { Employee } from "../../domain/entities";
import { TooltipProvider } from "@shared/ui/tooltip";

const { mockUseEmployee } = vi.hoisted(() => ({
  mockUseEmployee: vi.fn(),
}));

vi.mock("../../application/hooks/useEmployees", () => ({
  useEmployee: (...args: unknown[]) => mockUseEmployee(...args),
  useCreateEmployee: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateEmployee: () => ({ mutateAsync: vi.fn(), isPending: false }),
  employeeQueryKeys: { detail: (id: string) => ["employees", id] },
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [], meta: undefined } }),
}));

vi.mock("@shared/ui/address-input", () => ({
  AddressInput: () => <div data-testid="address-input-stub" />,
  EntityAddressForm: () => null,
  buildGeocodingEntityFormSection: () => null,
  setFormCoordinates: vi.fn(),
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
    rfc: null,
    nss: null,
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
    position: "Administrativo",
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
    driverRole: null,
    ...overrides,
  };
}

// Data router required: EmployeeEditPage uses useUnsavedChangesGuard → useBlocker.
function renderEditPage(
  path = "/employees/22222222-2222-4222-8222-222222222222/edit",
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/employees/:id/edit",
        element: (
          <QueryClientProvider client={client}>
            <TooltipProvider>
              <EmployeeEditPage />
            </TooltipProvider>
          </QueryClientProvider>
        ),
      },
      {
        path: "/employees/:id",
        element: <div>Detalle</div>,
      },
    ],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe("EmployeeEditPage F2 (D7/D8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEmployee.mockReturnValue({
      data: { data: buildEmployee() },
      isLoading: false,
      isError: false,
    });
  });

  it("monta form con rail canónico, pie sticky y shell de edición", () => {
    const { container } = renderEditPage();
    const fc = employeesCopy.form;

    expect(screen.getByText(fc.edit.title)).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: fc.sidebar.title }),
    ).toBeInTheDocument();
    expect(container.querySelector(".sticky.bottom-0")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: fc.action.save }),
    ).toBeDisabled();
  });
});
