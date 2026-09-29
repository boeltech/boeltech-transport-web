import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { USER_STATUS_LABELS, UserStatus } from "../../domain";
import { usersCopy } from "../copy/usersCopy";
import { UserListFilters } from "./UserListFilters";

const filterCopy = usersCopy.list.filter;

function renderFilters(
  overrides: Partial<ComponentProps<typeof UserListFilters>> = {},
) {
  return render(
    <UserListFilters
      status=""
      role=""
      createdFrom=""
      createdTo=""
      lastLoginFrom=""
      lastLoginTo=""
      activePanelFilterCount={0}
      onStatusChange={vi.fn()}
      onRoleChange={vi.fn()}
      onCreatedFromChange={vi.fn()}
      onCreatedToChange={vi.fn()}
      onLastLoginFromChange={vi.fn()}
      onLastLoginToChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("UserListFilters", () => {
  it("muestra Filtros sin badge ni labels cuando no hay recortes", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText(filterCopy.statusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(filterCopy.createdHeading)).not.toBeInTheDocument();
  });

  it("abre el panel con badge cuando hay recortes", () => {
    renderFilters({
      status: UserStatus.ACTIVE,
      role: "accountant",
      createdFrom: "2026-01-01",
      lastLoginTo: "2026-09-13",
      activePanelFilterCount: 4,
    });

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText(filterCopy.statusLabel)).toBeInTheDocument();
    expect(screen.getByText(filterCopy.roleLabel)).toBeInTheDocument();
    expect(screen.getByText(filterCopy.createdHeading)).toBeInTheDocument();
    expect(screen.getByText(filterCopy.lastLoginHeading)).toBeInTheDocument();
    expect(
      screen.getByText(USER_STATUS_LABELS[UserStatus.ACTIVE]),
    ).toBeInTheDocument();
    expect(screen.getByText("Contador")).toBeInTheDocument();
  });
});
