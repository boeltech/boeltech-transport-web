import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CorridorTariffsListPage } from "./CorridorTariffsListPage";

const {
  mockUseCorridorTariffs,
  mockUseCorridorDuplicateCatalog,
  mockUseBranches,
  mockUseCorridorBranchNameMap,
  mockHasPermission,
} = vi.hoisted(() => ({
  mockUseCorridorTariffs: vi.fn(),
  mockUseCorridorDuplicateCatalog: vi.fn(),
  mockUseBranches: vi.fn(),
  mockUseCorridorBranchNameMap: vi.fn(),
  mockHasPermission: vi.fn(() => true),
}));

vi.mock("../../application/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../application/hooks")>();
  return {
    ...actual,
    useCorridorTariffs: (...args: unknown[]) => mockUseCorridorTariffs(...args),
    useCorridorDuplicateCatalog: (...args: unknown[]) =>
      mockUseCorridorDuplicateCatalog(...args),
    useCorridorBranchNameMap: (...args: unknown[]) => mockUseCorridorBranchNameMap(...args),
    useCreateCorridorTariff: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useUpdateCorridorTariff: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: (...args: unknown[]) => mockUseBranches(...args),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (...args: unknown[]) => mockHasPermission(...args),
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CorridorTariffsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CorridorTariffsListPage", () => {
  const duplicateCatalog = [
    {
      id: "cor-1",
      name: "CDMX → MTY",
      originRefType: "city_label" as const,
      originRefValue: "Ciudad de México",
      destinationRefType: "city_label" as const,
      destinationRefValue: "Monterrey",
      fixedAmount: 1500,
      notes: null,
      isActive: true,
    },
    {
      id: "cor-2",
      name: "CDMX → MTY duplicado",
      originRefType: "city_label" as const,
      originRefValue: "ciudad de méxico",
      destinationRefType: "city_label" as const,
      destinationRefValue: "MONTERREY",
      fixedAmount: 1600,
      notes: null,
      isActive: true,
    },
  ];

  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
    mockUseBranches.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
    mockUseCorridorBranchNameMap.mockReturnValue(new Map());
    mockUseCorridorDuplicateCatalog.mockReturnValue({
      data: duplicateCatalog,
      isLoading: false,
    });
    mockUseCorridorTariffs.mockReturnValue({
      data: {
        data: duplicateCatalog,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
  });

  it("muestra la columna de ruta con origen y destino", () => {
    renderPage();

    expect(screen.getByText("Ciudad de México → Monterrey")).toBeInTheDocument();
  });

  it("muestra badge de duplicado cuando hay rutas equivalentes", () => {
    renderPage();

    expect(screen.getAllByText("Duplicado")).toHaveLength(2);
    expect(
      screen.getByText(/Hay rutas con el mismo origen y destino/i),
    ).toBeInTheDocument();
  });

  it("oculta la columna Acciones sin permisos de gestión", () => {
    mockHasPermission.mockReturnValue(false);
    renderPage();

    expect(screen.queryByText("Acciones")).not.toBeInTheDocument();
  });
});
