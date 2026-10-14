import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeeFormInner } from "./EmployeeFormInner";
import { employeesCopy } from "../copy/employeesCopy";
import type { Employee } from "../../domain/entities";

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [], meta: undefined } }),
}));

vi.mock("../../application/hooks/useEmployees", () => ({
  useCreateEmployee: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateEmployee: () => ({ mutateAsync: vi.fn(), isPending: false }),
  employeeQueryKeys: { detail: (id: string) => ["employees", id] },
}));

vi.mock("@shared/ui/address-input", () => ({
  AddressInput: () => <div data-testid="address-input-stub" />,
  EntityAddressForm: () => null,
  buildGeocodingEntityFormSection: () => null,
  setFormCoordinates: vi.fn(),
}));

function buildEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "emp-edit-1",
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

function renderEditForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <EmployeeFormInner
          id="emp-edit-1"
          isEditing
          existing={buildEmployee()}
          onCancel={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fc = employeesCopy.form;

describe("EmployeeFormInner edit F2 (D7/D11)", () => {
  it("monta rail, pie sticky y banner sin dl", () => {
    const { container } = renderEditForm();

    expect(
      screen.getByRole("navigation", { name: fc.sidebar.title }),
    ).toBeInTheDocument();

    for (const label of [
      fc.section.personal.nav,
      fc.section.contact.nav,
      fc.section.employment.nav,
      fc.section.compensation.nav,
    ]) {
      expect(
        screen.getByRole("button", { name: new RegExp(label, "i") }),
      ).toBeInTheDocument();
    }

    expect(document.getElementById("employee-edit-personal")).toBeTruthy();
    expect(document.getElementById("employee-edit-contact")).toBeTruthy();
    expect(document.getElementById("employee-edit-employment")).toBeTruthy();
    expect(document.getElementById("employee-edit-compensation")).toBeTruthy();

    expect(container.querySelector(".sticky.bottom-0")).toBeTruthy();
    expect(screen.getByRole("button", { name: fc.action.save })).toBeDisabled();

    expect(screen.getByText(fc.edit.identityBanner.title)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: fc.edit.identityBanner.viewDetail }),
    ).toHaveAttribute("href", "/employees/emp-edit-1");
    expect(container.querySelector("dl")).toBeNull();
  });

  it("clic en rail hace scroll a la sección", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderEditForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(fc.section.compensation.nav, "i"),
      }),
    );

    expect(scrollIntoView).toHaveBeenCalled();
  });
});
