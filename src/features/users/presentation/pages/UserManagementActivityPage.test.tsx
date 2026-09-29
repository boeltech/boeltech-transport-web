import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { UserManagementActivityPage } from "./UserManagementActivityPage";
import { userActivityPageCopy } from "../copy/userActivityPageCopy";

const copy = userActivityPageCopy;

const { mockUseUserManagementActivity, mockUseUserDirectory } = vi.hoisted(
  () => ({
    mockUseUserManagementActivity: vi.fn(),
    mockUseUserDirectory: vi.fn(),
  }),
);

vi.mock("../../application", () => ({
  useUserManagementActivity: (...args: unknown[]) =>
    mockUseUserManagementActivity(...args),
  useUserDirectory: (...args: unknown[]) => mockUseUserDirectory(...args),
}));

function renderPage(initialUrl = "/users/activity") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <UserManagementActivityPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("UserManagementActivityPage toolbar", () => {
  beforeEach(() => {
    mockUseUserManagementActivity.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 1, total: 0, limit: 25 },
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    mockUseUserDirectory.mockReturnValue({
      entries: [{ id: "u1", label: "Séneca Estoico" }],
      namesById: new Map([["u1", "Séneca Estoico"]]),
      isLoading: false,
    });
  });

  it("en reposo no muestra chips, Limpiar filtros ni labels del panel", () => {
    renderPage();

    expect(screen.getByRole("button", { name: /^Filtros$/ })).toBeInTheDocument();
    expect(screen.queryByText(copy.filters.actionLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.filters.personLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.filters.actorLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.filters.clearRecortes)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Quitar filtro (Cambio|Persona|Hecho por)/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(copy.empty.windowTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.filters.viewAllHistory)).toBeInTheDocument();
  });

  it("con ?action= muestra badge 1 y chip de recorte, no chip de periodo", () => {
    renderPage("/users/activity?action=user_created");

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.getByText(copy.filters.chip.action("Alta de usuario")),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Quitar filtro Periodo/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(copy.empty.recorteTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.filters.clearRecortes)).toBeInTheDocument();
  });

  it("con ?subjectUserId=&period=all muestra Filtros (1) sin chip de periodo", () => {
    renderPage("/users/activity?subjectUserId=u1&period=all");

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.getByText(copy.filters.chip.person("Séneca Estoico")),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Quitar filtro Periodo/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(copy.empty.recorteTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.filters.clearRecortes)).toBeInTheDocument();
  });

  it("con period=all y sin recortes muestra el vacío virgen", () => {
    renderPage("/users/activity?period=all");

    expect(screen.getByText(copy.empty.virginTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.empty.virginDescription)).toBeInTheDocument();
    expect(screen.queryByText(copy.filters.clearRecortes)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.filters.viewAllHistory)).not.toBeInTheDocument();
  });
});
