import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TrailerListPage } from "./TrailerListPage";
import { trailersCopy } from "../copy/trailersCopy";
import { TRAILER_STATUS_LABELS, TrailerStatus } from "../../domain";
import {
  TRAILER_CATALOG_CREATE_PARAM,
  TRAILER_CATALOG_EDIT_PARAM,
} from "../trailerCatalogSheetParams";

const copy = trailersCopy.list;
const EDIT_ID = "11111111-1111-4111-8111-111111111111";

const { mockUseTrailers, mockUseTrailer, mockHasPermission, mockUseRole } =
  vi.hoisted(() => ({
    mockUseTrailers: vi.fn(),
    mockUseTrailer: vi.fn(),
    mockHasPermission: vi.fn(() => true),
    mockUseRole: vi.fn(() => "admin"),
  }));

vi.mock("../../application", () => ({
  useTrailers: (...args: unknown[]) => mockUseTrailers(...args),
  useTrailer: (...args: unknown[]) => mockUseTrailer(...args),
}));

vi.mock("../hooks/useTrailerTypeLabels", () => ({
  useTrailerTypeLabels: () => ({
    labelFor: () => "Caja Seca",
    isLoading: false,
  }),
}));

vi.mock("../components", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../components")>();
  return {
    ...mod,
    TrailerCatalogSheet: () => null,
  };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
  useRole: () => mockUseRole(),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function SearchParamsProbe() {
  const [params] = useSearchParams();
  return <div data-testid="qs">{params.toString()}</div>;
}

function renderPage(initialUrl = "/trailers") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <TrailerListPage />
        <SearchParamsProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TrailerListPage toolbar", () => {
  beforeEach(() => {
    mockUseTrailers.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseTrailer.mockReturnValue({ data: undefined });
    mockHasPermission.mockImplementation(() => true);
    mockUseRole.mockReturnValue("admin");
  });

  it("pasa status desde la URL, muestra chip y no cuenta search en el badge", () => {
    renderPage(`/trailers?status=${TrailerStatus.AVAILABLE}&search=ABC`);

    expect(mockUseTrailers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          status: TrailerStatus.AVAILABLE,
          search: "ABC",
          isActive: true,
        }),
      }),
    );
    expect(
      screen.getByText(
        copy.chip.status(TRAILER_STATUS_LABELS[TrailerStatus.AVAILABLE]),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(copy.empty.descriptionFiltered)).toBeInTheDocument();
  });

  it("sin recortes no pone estado en el riel", () => {
    renderPage();

    expect(mockUseTrailers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          status: undefined,
          isActive: true,
        }),
      }),
    );
    expect(screen.getByRole("button", { name: /^Filtros$/ })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(copy.filter.searchPlaceholder),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.filter.statusLabel)).not.toBeInTheDocument();
    expect(screen.getByText(copy.empty.descriptionClear)).toBeInTheDocument();
  });

  it("manager canCreate usa empty de recepción de patio", () => {
    mockUseRole.mockReturnValue("manager");
    renderPage();
    expect(
      screen.getByText(copy.empty.descriptionClearManager),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.descriptionManager)).toBeInTheDocument();
    expect(
      screen.queryByText(copy.empty.descriptionClear),
    ).not.toBeInTheDocument();
  });

  it("empty RO pide el alta a administración si !trailers.create", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        !(module === "trailers" && action === "create"),
    );
    renderPage();
    expect(screen.getByText(copy.empty.descriptionReadonly)).toBeInTheDocument();
    expect(
      screen.queryByText(copy.empty.descriptionClear),
    ).not.toBeInTheDocument();
  });

  it("limpiar filtros conserva el deep-link del sheet", async () => {
    const user = userEvent.setup();
    renderPage(
      `/trailers?status=${TrailerStatus.AVAILABLE}&${TRAILER_CATALOG_CREATE_PARAM}=true&${TRAILER_CATALOG_EDIT_PARAM}=${EDIT_ID}`,
    );

    await user.click(
      screen.getAllByRole("button", { name: copy.actions.clearFilters })[0],
    );

    const qs = screen.getByTestId("qs").textContent ?? "";
    expect(qs).toContain(`${TRAILER_CATALOG_CREATE_PARAM}=true`);
    expect(qs).toContain(`${TRAILER_CATALOG_EDIT_PARAM}=${EDIT_ID}`);
    expect(qs).not.toContain("status=");
  });
});
