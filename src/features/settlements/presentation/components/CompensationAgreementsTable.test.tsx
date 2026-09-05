import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CompensationAgreementsTable } from "./CompensationAgreementsTable";
import type { CompensationAgreement } from "../../domain/entities";

const mockUsePermissions = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock("../../application/hooks/useAgreements", () => ({
  useUpdateCompensationAgreement: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteCompensationAgreement: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

const sampleCompositeAgreement: CompensationAgreement = {
  id: "agr-1",
  tenantId: "tenant-1",
  employeeId: "emp-1",
  employeeFullName: "Carlos López",
  hasFixedSalary: true,
  fixedSalaryAmount: 3500,
  fixedSalaryPeriod: "weekly",
  isSalaryGuaranteed: true,
  rules: [
    {
      id: "rule-1",
      agreementId: "agr-1",
      routeType: "long_haul",
      commissionType: "rate_per_km",
      rateValue: 3.5,
      minimumGuaranteedAmount: 400,
    },
    {
      id: "rule-2",
      agreementId: "agr-1",
      routeType: "local",
      commissionType: "none",
      rateValue: 0,
      minimumGuaranteedAmount: 0,
    },
  ],
  currency: "MXN",
  effectiveFrom: "2026-08-01",
  effectiveTo: null,
  isActive: true,
  notes: "Acuerdo compuesto activo",
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

const sampleLegacyAgreement: CompensationAgreement = {
  id: "agr-2",
  tenantId: "tenant-1",
  employeeId: "emp-2",
  employeeFullName: "Mario Mendoza",
  calculationType: "rate_per_km",
  ratePerKm: 2.8,
  currency: "MXN",
  effectiveFrom: "2026-07-01",
  effectiveTo: "2026-12-31",
  isActive: false,
  notes: "Acuerdo legacy inactivo",
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
};

describe("CompensationAgreementsTable", () => {
  beforeEach(() => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((resource: string, action: string) => {
        if (resource === "employees" && action === "read") return true;
        if (resource === "settlements" && action === "create") return true;
        if (resource === "settlements" && action === "update") return true;
        if (resource === "settlements" && action === "delete") return true;
        return false;
      }),
    });
  });

  it("renderiza esqueleto de carga cuando isLoading es true", () => {
    render(
      <MemoryRouter>
        <CompensationAgreementsTable agreements={[]} isLoading={true} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("table", { name: /tarifas de operadores/i })).toBeInTheDocument();
  });

  it("renderiza mensaje de estado vacío cuando no hay convenios", () => {
    render(
      <MemoryRouter>
        <CompensationAgreementsTable agreements={[]} isLoading={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ningún operador tiene un esquema de compensación asignado/i)).toBeInTheDocument();
  });

  it("renderiza correctamente un esquema compuesto con sueldo semanal y reglas", () => {
    render(
      <MemoryRouter>
        <CompensationAgreementsTable
          agreements={[sampleCompositeAgreement]}
          isLoading={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Carlos López")).toBeInTheDocument();
    expect(screen.getByText("Sueldo + pago por viajes")).toBeInTheDocument();
    expect(screen.getByText(/Foráneo/i)).toBeInTheDocument();
    expect(screen.getByText(/Local/i)).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renderiza correctamente un esquema plano legacy", () => {
    render(
      <MemoryRouter>
        <CompensationAgreementsTable
          agreements={[sampleLegacyAgreement]}
          isLoading={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Mario Mendoza")).toBeInTheDocument();
    expect(screen.getByText(/km/i)).toBeInTheDocument();
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("muestra badge de conflicto cuando hay tarifas activas traslapadas", () => {
    const overlappingAgreement: CompensationAgreement = {
      ...sampleCompositeAgreement,
      id: "agr-3",
      effectiveFrom: "2026-08-15",
      createdAt: "2026-08-15T00:00:00Z",
    };

    render(
      <MemoryRouter>
        <CompensationAgreementsTable
          agreements={[sampleCompositeAgreement, overlappingAgreement]}
          isLoading={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Conflicto de vigencia")).toHaveLength(2);
  });
});
