import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { UserListItem } from "../../domain";
import { formatDateTime } from "@shared/utils/dateUtils";
import { usersCopy } from "../copy/usersCopy";
import { UserTable } from "./UserTable";

vi.mock("./UserActions", () => ({
  UserActions: () => <button type="button">acciones</button>,
}));

const sort = { field: "created_at", direction: "desc" as const };

const user: UserListItem = {
  id: "u1",
  email: "ana@example.com",
  firstName: "Ana",
  lastName: "Pérez",
  role: "admin",
  status: "active",
  lastLogin: "2026-11-01T18:00:00.000Z",
  createdAt: "2026-01-15T18:00:00.000Z",
};

function renderTable(users: UserListItem[] = [user]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UserTable
          users={users}
          isLoading={false}
          primaryTo={(row) => `/users/${row.id}`}
          sort={sort}
          onSortChange={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("UserTable", () => {
  it("retorna null cuando no hay filas", () => {
    const { container } = renderTable([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza link primario en nombre", () => {
    renderTable();
    expect(
      screen.getByRole("columnheader", {
        name: usersCopy.list.columns.name,
      }),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Ana Pérez" });
    expect(link).toHaveAttribute("href", "/users/u1");
  });

  it("formatea Alta con el mismo estilo datetime que Último acceso", () => {
    renderTable();
    expect(screen.queryByText(/GMT/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hora estándar/i)).not.toBeInTheDocument();
    const expectedAlta = formatDateTime(user.createdAt);
    const expectedLogin = formatDateTime(user.lastLogin);
    expect(expectedAlta).not.toEqual("—");
    expect(screen.getByText(expectedAlta)).toBeInTheDocument();
    expect(screen.getByText(expectedLogin)).toBeInTheDocument();
  });
});
