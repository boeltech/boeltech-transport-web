import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { platformCopy } from "../copy/platformCopy";
import { PlatformGlobalCatalogsPage } from "./PlatformGlobalCatalogsPage";

const {
  mockUseCatalogTypes,
  mockUseCatalogStatistics,
  mockUsePlatformAuth,
} = vi.hoisted(() => ({
  mockUseCatalogTypes: vi.fn(),
  mockUseCatalogStatistics: vi.fn(),
  mockUsePlatformAuth: vi.fn(),
}));

vi.mock("@features/catalogs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/catalogs")>();
  return {
    ...actual,
    useCatalogTypes: (...args: unknown[]) => mockUseCatalogTypes(...args),
    useCatalogStatistics: (...args: unknown[]) =>
      mockUseCatalogStatistics(...args),
    CatalogImportWizard: () => null,
    isSatCatalog: () => true,
  };
});

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: (...args: unknown[]) => mockUsePlatformAuth(...args),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PlatformGlobalCatalogsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PlatformGlobalCatalogsPage F2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlatformAuth.mockReturnValue({
      user: {
        id: "u1",
        platformRole: "platform_owner",
        scope: "platform",
      },
    });
    mockUseCatalogStatistics.mockReturnValue({ data: [] });
  });

  it("is search-only without ListingFilterPanel and shows EmptyState", () => {
    mockUseCatalogTypes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(
      screen.getByPlaceholderText(platformCopy.catalogs.search.placeholder),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Filtros/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.catalogs.empty.title),
    ).toBeInTheDocument();
  });

  it("renders mobile catalog rows with EntityListCard", () => {
    mockUseCatalogTypes.mockReturnValue({
      data: [
        {
          code: "sat_clave_prod_serv_cp",
          name: "Productos y servicios CP",
          category: "sat",
        },
      ],
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(
      screen.getAllByText("Productos y servicios CP").length,
    ).toBeGreaterThan(0);
    // Mobile list uses EntityListCard without to/onClick (no `.group` hover chrome).
    expect(document.querySelector("ul.md\\:hidden")).toBeTruthy();
  });
});
