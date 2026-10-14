import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { UserStatus } from "../../domain";
import { usersCopy } from "../copy/usersCopy";
import { UserActions } from "./UserActions";

const { mockHasPermission } = vi.hoisted(() => ({
  mockHasPermission: vi.fn(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
  }),
}));

function renderActions(
  props: Partial<ComponentProps<typeof UserActions>> = {},
) {
  return render(
    <MemoryRouter>
      <UserActions
        userId="u-1"
        userName="Ana López"
        status={UserStatus.ACTIVE}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("UserActions (D1/D6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "users" && (action === "update" || action === "delete"),
    );
  });

  it("dropdown de listado ofrece Activar/Desactivar (D1 excepción)", async () => {
    const user = userEvent.setup();
    renderActions({ variant: "dropdown" });

    await user.click(
      screen.getByRole("button", { name: usersCopy.list.card.actionsAria }),
    );

    expect(
      screen.getByRole("menuitem", { name: "Ver detalle" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Editar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Desactivar usuario" }),
    ).toBeInTheDocument();
  });

  it("header: Editar primary; Activar/Desactivar outline (D6)", () => {
    renderActions({ variant: "buttons" });

    const edit = screen.getByRole("button", { name: /Editar/ });
    const status = screen.getByRole("button", { name: /Desactivar usuario/ });

    expect(edit.className).toMatch(/bg-primary|default/);
    expect(status.className).toMatch(/border|outline/);
    expect(status.className).not.toMatch(/bg-primary(?!\/)/);
  });
});
