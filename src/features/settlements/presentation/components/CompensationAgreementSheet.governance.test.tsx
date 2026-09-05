import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompensationAgreementSheet } from "./CompensationAgreementSheet";

const mockFetchEmployees = vi.fn();
const mockFetchEmployee = vi.fn();
const mockListAgreements = vi.fn();
const mockUpdateAgreement = vi.fn();
const mockCreateAgreement = vi.fn();
const mockToast = vi.fn();

vi.mock("@features/employees/infrastructure/employeeRepository", () => ({
  fetchEmployees: (...args: unknown[]) => mockFetchEmployees(...args),
  fetchEmployee: (...args: unknown[]) => mockFetchEmployee(...args),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    listAgreements: (...args: unknown[]) => mockListAgreements(...args),
    updateAgreement: (...args: unknown[]) => mockUpdateAgreement(...args),
    createAgreement: (...args: unknown[]) => mockCreateAgreement(...args),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

const mockEmployee = {
  id: "emp-1",
  tenantId: "tenant-1",
  employeeNumber: "EMP-001",
  firstName: "Carlos",
  lastName: "López",
  role: "primary_driver",
  isActive: true,
  salaryType: "weekly",
  baseSalary: 3500,
};

describe("CompensationAgreementSheet governance (ADR-0087)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchEmployees.mockResolvedValue({
      data: [mockEmployee],
      pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
    mockFetchEmployee.mockResolvedValue(mockEmployee);
    mockListAgreements.mockResolvedValue([
      {
        id: "agr-existing",
        tenantId: "tenant-1",
        employeeId: "emp-1",
        employeeFullName: "Carlos López",
        hasFixedSalary: true,
        fixedSalaryAmount: 3000,
        fixedSalaryPeriod: "weekly",
        isSalaryGuaranteed: true,
        rules: [],
        currency: "MXN",
        effectiveFrom: "2026-08-01",
        effectiveTo: null,
        isActive: true,
        notes: null,
        createdAt: "2026-08-01T00:00:00Z",
        updatedAt: "2026-08-01T00:00:00Z",
      },
    ]);
    mockUpdateAgreement.mockResolvedValue({
      id: "agr-existing",
      employeeId: "emp-1",
      effectiveTo: "2026-08-31",
      isActive: true,
    });
    mockCreateAgreement.mockResolvedValue({
      id: "agr-new",
      employeeId: "emp-1",
      isActive: true,
    });
  });

  it("muestra aviso de solape y ejecuta PATCH cerrar anterior antes de POST", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <CompensationAgreementSheet
          open
          onOpenChange={onOpenChange}
          defaultEmployeeId="emp-1"
          lockEmployee
          onSuccess={onSuccess}
        />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Hay otra tarifa activa con vigencia traslapada/i),
      ).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole("button", { name: /Guardar tarifa de operador/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateAgreement).toHaveBeenCalledWith(
        "agr-existing",
        expect.objectContaining({ effectiveTo: expect.any(String) }),
      );
      expect(mockCreateAgreement).toHaveBeenCalled();
    });

    expect(mockUpdateAgreement.mock.invocationCallOrder[0]).toBeLessThan(
      mockCreateAgreement.mock.invocationCallOrder[0]!,
    );
    expect(onSuccess).toHaveBeenCalled();
  });
});
