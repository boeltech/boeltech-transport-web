import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DriverForm } from "./DriverForm";
import { DRIVER_EDIT_SECTION_IDS } from "./driverEditSections";
import { driversCopy } from "../copy/driversCopy";
import type { Driver } from "../../domain";

vi.mock("@features/employees", () => ({
  useEmployeeBasic: () => ({ data: undefined }),
}));

function buildDriver(overrides: Partial<Driver> = {}): Driver {
  return {
    id: "d-edit",
    tenantId: "t-1",
    employeeId: "e-1",
    employee: {
      id: "e-1",
      firstName: "Juan",
      lastName: "Pérez",
      secondLastName: null,
      fullName: "Juan Pérez",
      employeeNumber: "EMP-001",
      email: "juan@example.com",
      phone: "5551234567",
      mobilePhone: null,
      curp: null,
      rfc: "XAXX010101000",
      branchId: null,
      branchName: null,
      branchCode: null,
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
    isLicenseExpired: false,
    medicalCertificateNumber: null,
    medicalCertificateExpiry: null,
    medicalCertificateIssuer: null,
    psychometricTestDate: null,
    psychometricTestResult: null,
    lastDrugTestDate: null,
    drugTestResult: null,
    assignedDeviceId: null,
    status: "available",
    isActive: true,
    yearsOfExperience: 5,
    bloodType: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
    notes: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: null,
    updatedBy: null,
    createdByName: null,
    updatedByName: null,
    branchId: null,
    branchName: null,
    branchCode: null,
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
        <DriverForm
          mode="edit"
          driver={buildDriver()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fc = driversCopy.form;

describe("DriverForm edit F2 (D8/D12)", () => {
  it("monta rail con las 8 secciones D8, pie sticky y banner sin dl", () => {
    const { container } = renderEditForm();

    expect(
      screen.getByRole("navigation", { name: fc.edit.sidebar.title }),
    ).toBeInTheDocument();

    for (const label of [
      fc.section.employee.nav,
      fc.section.licenseFederal.nav,
      fc.section.licenseState.nav,
      fc.section.medical.nav,
      fc.section.psychometric.nav,
      fc.section.drugTest.nav,
      fc.section.device.nav,
      fc.section.notes.nav,
    ]) {
      expect(
        screen.getByRole("button", { name: new RegExp(label, "i") }),
      ).toBeInTheDocument();
    }

    expect(
      document.getElementById(DRIVER_EDIT_SECTION_IDS.employee),
    ).toBeTruthy();
    expect(
      document.getElementById(DRIVER_EDIT_SECTION_IDS.licenseFederal),
    ).toBeTruthy();
    expect(document.getElementById(DRIVER_EDIT_SECTION_IDS.notes)).toBeTruthy();

    expect(container.querySelector(".sticky.bottom-0")).toBeTruthy();
    expect(screen.getByRole("button", { name: fc.action.save })).toBeDisabled();

    expect(
      screen.getByText(fc.edit.employeeBanner.title),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: fc.edit.employeeBanner.viewProfile }),
    ).toHaveAttribute("href", "/employees/e-1");
    expect(container.querySelector("dl")).toBeNull();
  });

  it("clic en rail hace scroll a la sección", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderEditForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(fc.section.notes.nav, "i"),
      }),
    );

    expect(scrollIntoView).toHaveBeenCalled();
  });
});
