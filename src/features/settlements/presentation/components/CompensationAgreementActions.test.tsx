import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompensationAgreementActions } from "./CompensationAgreementActions";
import type { CompensationAgreement } from "../../domain/entities";
import { ApiError } from "@shared/api/interceptors/error-handler";

const mockUsePermissions = vi.fn();
const mockToast = vi.fn();
const mockUpdateAgreement = vi.fn();
const mockDeleteAgreement = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    updateAgreement: (...args: unknown[]) => mockUpdateAgreement(...args),
    deleteAgreement: (...args: unknown[]) => mockDeleteAgreement(...args),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

const sampleAgreement: CompensationAgreement = {
  id: "agr-gov-1",
  tenantId: "tenant-1",
  employeeId: "emp-1",
  employeeFullName: "Carlos López",
  hasFixedSalary: true,
  fixedSalaryAmount: 3500,
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
};

describe("CompensationAgreementActions (ADR-0087)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((resource: string, action: string) => {
        if (resource === "employees" && action === "read") return true;
        if (resource === "settlements" && action === "create") return true;
        if (resource === "settlements" && action === "update") return true;
        if (resource === "settlements" && action === "delete") return true;
        return false;
      }),
    });
    mockUpdateAgreement.mockResolvedValue({ ...sampleAgreement, isActive: false });
    mockDeleteAgreement.mockResolvedValue(undefined);
  });

  async function openActionsMenu(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: /Abrir menú de acciones/i }));
  }

  it("desactiva tarifa vía PATCH isActive=false", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CompensationAgreementActions agreement={sampleAgreement} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await openActionsMenu(user);
    await user.click(screen.getByText("Desactivar tarifa"));
    await user.click(screen.getByRole("button", { name: /Desactivar tarifa/i }));

    await waitFor(() => {
      expect(mockUpdateAgreement).toHaveBeenCalledWith("agr-gov-1", {
        isActive: false,
      });
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Tarifa desactivada", variant: "success" }),
    );
  });

  it("cierra vigencia vía PATCH effectiveTo", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockUpdateAgreement.mockResolvedValue({
      ...sampleAgreement,
      effectiveTo: "2026-08-31",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CompensationAgreementActions agreement={sampleAgreement} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await openActionsMenu(user);
    await user.click(screen.getByText(/Cerrar vigencia/i));
    await user.click(screen.getByRole("button", { name: /^Cerrar vigencia$/i }));

    await waitFor(() => {
      expect(mockUpdateAgreement).toHaveBeenCalledWith(
        "agr-gov-1",
        expect.objectContaining({ effectiveTo: expect.any(String) }),
      );
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Vigencia cerrada", variant: "success" }),
    );
  });

  it("elimina tarifa vía DELETE", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CompensationAgreementActions agreement={sampleAgreement} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await openActionsMenu(user);
    await user.click(screen.getByText("Eliminar tarifa"));
    await user.click(screen.getByRole("button", { name: /Eliminar tarifa/i }));

    await waitFor(() => {
      expect(mockDeleteAgreement).toHaveBeenCalledWith("agr-gov-1");
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Tarifa eliminada", variant: "success" }),
    );
  });

  it("muestra toast destructivo ante 409 AGREEMENT_IN_USE al eliminar", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockDeleteAgreement.mockRejectedValue(
      new ApiError(
        "No se puede eliminar una tarifa usada en una liquidación",
        409,
        "AGREEMENT_IN_USE",
      ),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CompensationAgreementActions agreement={sampleAgreement} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await openActionsMenu(user);
    await user.click(screen.getByText("Eliminar tarifa"));
    await user.click(screen.getByRole("button", { name: /Eliminar tarifa/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error al eliminar tarifa",
          variant: "destructive",
          description: expect.stringContaining("liquidación"),
        }),
      );
    });
  });

  it("oculta eliminar cuando accountant no tiene settlements.delete", async () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((resource: string, action: string) => {
        if (resource === "settlements" && action === "update") return true;
        return false;
      }),
    });

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CompensationAgreementActions agreement={sampleAgreement} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await openActionsMenu(user);
    expect(screen.getByText("Desactivar tarifa")).toBeInTheDocument();
    expect(screen.queryByText("Eliminar tarifa")).not.toBeInTheDocument();
  });
});
