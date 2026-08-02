/**
 * Smoke — catálogos tenant: lista sin import SAT, banner global, CRUD internos.
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CatalogsPage } from "@features/catalogs/presentation/pages/CatalogsPage";
import { CatalogDetailPage } from "@features/catalogs/presentation/pages/CatalogDetailPage";
import { catalogsCopy } from "@features/catalogs/presentation/copy/catalogsCopy";
import type { CatalogItem, CatalogStatistics, CatalogType } from "@features/catalogs/domain";

const mockFindTypes = vi.fn();
const mockGetStatistics = vi.fn();
const mockFindAll = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSearch = vi.fn();

vi.mock("@features/catalogs/infrastructure/catalogRepository", () => ({
  catalogRepository: {
    findTypes: (...args: unknown[]) => mockFindTypes(...args),
    getStatistics: (...args: unknown[]) => mockGetStatistics(...args),
    findAll: (...args: unknown[]) => mockFindAll(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    search: (...args: unknown[]) => mockSearch(...args),
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (_module: string, action: string) =>
      ["read", "create", "update", "delete"].includes(action),
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const NOW = new Date("2026-07-01T12:00:00.000Z");

const GLOBAL_TYPE: CatalogType = {
  id: "type-sat-estado",
  code: "sat_estado",
  name: "Estados",
  description: "Catálogo SAT de estados",
  source: "SAT",
  parentTypeCode: null,
  isHierarchical: false,
  isGlobal: true,
  metadataSchema: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const INTERNAL_TYPE: CatalogType = {
  id: "type-vehicle",
  code: "vehicle_type",
  name: "Tipos de vehículo",
  description: "Catálogo interno del tenant",
  source: "INTERNAL",
  parentTypeCode: null,
  isHierarchical: false,
  isGlobal: false,
  metadataSchema: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const INTERNAL_ITEM: CatalogItem = {
  id: "item-1",
  tenantId: "tenant-1",
  catalogTypeId: INTERNAL_TYPE.id,
  code: "tracto",
  name: "Tractocamión",
  description: null,
  parentCode: null,
  sortOrder: 0,
  isActive: true,
  validFrom: null,
  validTo: null,
  metadata: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const STATS: CatalogStatistics[] = [
  {
    typeCode: "sat_estado",
    typeName: "Estados",
    itemCount: 32,
    currentVersion: "2026.1",
    source: "SAT",
  },
  {
    typeCode: "vehicle_type",
    typeName: "Tipos de vehículo",
    itemCount: 1,
    currentVersion: null,
    source: "INTERNAL",
  },
];

function seedCatalogMocks() {
  mockFindTypes.mockResolvedValue([GLOBAL_TYPE, INTERNAL_TYPE]);
  mockGetStatistics.mockResolvedValue(STATS);
  mockFindAll.mockImplementation(async (typeCode: string) => {
    if (typeCode === "vehicle_type") return [INTERNAL_ITEM];
    return [];
  });
  mockCreate.mockResolvedValue({
    data: {
      ...INTERNAL_ITEM,
      id: "item-new",
      code: "caja",
      name: "Caja seca",
    },
    message: "Registro creado",
  });
  mockSearch.mockResolvedValue({ items: [], total: 0 });
}

function renderCatalogs(initialEntry = "/settings/catalogs") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/settings/catalogs" element={<CatalogsPage />} />
          <Route
            path="/settings/catalogs/:typeCode"
            element={<CatalogDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("catalogs tenant workflow smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedCatalogMocks();
  });

  it("lista sin botón importar, todos los catálogos visibles y un solo aviso de solo lectura", async () => {
    renderCatalogs();

    await waitFor(() => {
      expect(screen.getByText(INTERNAL_TYPE.name)).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /importar/i })).toBeNull();

    // Sin pestañas: oficiales e internos conviven en la misma vista.
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByText(GLOBAL_TYPE.name)).toBeInTheDocument();

    expect(
      screen.getAllByText(catalogsCopy.readOnlyNotice.listTitle),
    ).toHaveLength(1);
  });

  it("la búsqueda del listado enruta por ejemplos de contenido", async () => {
    renderCatalogs();

    await waitFor(() => {
      expect(screen.getByText(GLOBAL_TYPE.name)).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText(catalogsCopy.page.searchPlaceholder),
      "tractocamion",
    );

    await waitFor(() => {
      expect(screen.queryByText(GLOBAL_TYPE.name)).not.toBeInTheDocument();
    });
    expect(screen.getByText(INTERNAL_TYPE.name)).toBeInTheDocument();
  });

  it("detalle SAT es solo lectura sin acciones de fila", async () => {
    renderCatalogs("/settings/catalogs/sat_estado");

    await waitFor(() => {
      expect(
        screen.getByText(catalogsCopy.readOnlyNotice.detailTitle),
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /importar/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: catalogsCopy.detail.addRecord }),
    ).toBeNull();
    expect(screen.queryByText(catalogsCopy.table.actions)).toBeNull();

    // La versión vigente se lee en la línea de ficha, sin abrir nada más.
    expect(screen.getByText(/versión 2026\.1/)).toBeInTheDocument();
  });

  it("detalle interno es solo lectura sin acciones de fila", async () => {
    renderCatalogs("/settings/catalogs/vehicle_type");

    await waitFor(() => {
      expect(
        screen.getByText(catalogsCopy.readOnlyNotice.detailTitle),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: catalogsCopy.detail.addRecord }),
    ).toBeNull();
    expect(screen.queryByText(catalogsCopy.table.actions)).toBeNull();

    await waitFor(() => {
      expect(screen.getByText(INTERNAL_ITEM.name)).toBeInTheDocument();
    });
  });

  it("no expone identificadores técnicos de catálogo en el listado ni en el detalle", async () => {
    const { unmount } = renderCatalogs();

    await waitFor(() => {
      expect(screen.getByText(GLOBAL_TYPE.name)).toBeInTheDocument();
    });
    expect(screen.queryByText("sat_estado")).toBeNull();
    expect(screen.queryByText("vehicle_type")).toBeNull();

    unmount();

    renderCatalogs("/settings/catalogs/sat_estado");

    await waitFor(() => {
      expect(
        screen.getByText(catalogsCopy.readOnlyNotice.detailTitle),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("sat_estado")).toBeNull();
  });
});
