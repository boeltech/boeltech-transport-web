import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UsersListPage } from "./UsersListPage";
import { usersCopy } from "../copy/usersCopy";
import { ADMIN_USERS_ORIENTATION_STORAGE_KEY } from "../components/AdminUsersOrientationAlert";
import { USER_STATUS_LABELS, UserStatus } from "../../domain";
import { ROLE_LABELS } from "@shared/constants/roles";

const copy = usersCopy.list;

const { mockUseUsers, mockUseUpdateUserStatus } = vi.hoisted(() => ({
  mockUseUsers: vi.fn(),
  mockUseUpdateUserStatus: vi.fn(),
}));

vi.mock("../../application", () => ({
  useUsers: (...args: unknown[]) => mockUseUsers(...args),
  useUpdateUserStatus: (...args: unknown[]) => mockUseUpdateUserStatus(...args),
}));

vi.mock("../components/PendingInvitationsPanel", () => ({
  PendingInvitationsPanel: () => null,
}));

vi.mock("../components/AddUserSheet", () => ({
  AddUserSheet: () => null,
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function renderPage(initialUrl = "/users") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <UsersListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("UsersListPage toolbar", () => {
  beforeEach(() => {
    window.localStorage.removeItem(ADMIN_USERS_ORIENTATION_STORAGE_KEY);
    mockUseUsers.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseUpdateUserStatus.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("pasa status y role desde la URL y muestra chips", () => {
    renderPage("/users?status=active&role=accountant");

    expect(mockUseUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          status: UserStatus.ACTIVE,
          role: "accountant",
        }),
      }),
    );
    expect(
      screen.getByText(copy.chip.status(USER_STATUS_LABELS[UserStatus.ACTIVE])),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.chip.role(ROLE_LABELS.accountant))).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(copy.empty.descriptionFiltered)).toBeInTheDocument();
  });

  it("sin recortes no pone estado, rol ni fechas en el riel", () => {
    renderPage();

    expect(mockUseUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          status: undefined,
          role: undefined,
        }),
      }),
    );
    expect(screen.getByRole("button", { name: /^Filtros$/ })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(copy.filter.searchPlaceholder),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.filter.statusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.filter.createdHeading)).not.toBeInTheDocument();
    expect(screen.getByText(copy.empty.descriptionClear)).toBeInTheDocument();
  });

  it("un rango de alta cuenta 1 y muestra chip Alta", () => {
    renderPage("/users?created_from=2026-01-01");

    expect(mockUseUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          createdFrom: "2026-01-01",
        }),
      }),
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/Alta:/)).toBeInTheDocument();
    expect(screen.queryByText(/Fechas:/)).not.toBeInTheDocument();
  });

  it("muestra la orientación admin de 3 tiempos", () => {
    renderPage();

    expect(
      screen.getByText(usersCopy.adminOrientation.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(usersCopy.adminOrientation.body),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
  });
});
