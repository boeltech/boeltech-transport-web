import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { usersCopy } from "../copy/usersCopy";
import {
  ADMIN_USERS_ORIENTATION_STORAGE_KEY,
  AdminUsersOrientationAlert,
} from "./AdminUsersOrientationAlert";

const copy = usersCopy.adminOrientation;
const TEST_KEY = `${ADMIN_USERS_ORIENTATION_STORAGE_KEY}.test`;

describe("AdminUsersOrientationAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña 3 tiempos y persiste collapsed=true; sin superusuario ni hermanos", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <AdminUsersOrientationAlert storageKey={TEST_KEY} />,
    );

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(copy.body).toMatch(/Invitar|Dar acceso ya/i);
    expect(copy.body).toMatch(/cliente/i);
    expect(copy.body).toMatch(/conductor/i);
    expect(copy.body).not.toMatch(
      /superusuario|puedes hacer de todo|Viajes|Por facturar|SAT/i,
    );

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    render(<AdminUsersOrientationAlert storageKey={TEST_KEY} />);
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
