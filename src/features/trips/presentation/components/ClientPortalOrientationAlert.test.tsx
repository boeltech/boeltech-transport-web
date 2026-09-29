import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripsListCopy } from "../copy/listCopy";
import {
  CLIENT_PORTAL_ORIENTATION_STORAGE_KEY,
  ClientPortalOrientationAlert,
} from "./ClientPortalOrientationAlert";

const copy = tripsListCopy.clientOrientation;
const TEST_KEY = `${CLIENT_PORTAL_ORIENTATION_STORAGE_KEY}.test`;

describe("ClientPortalOrientationAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña 2 tiempos y persiste collapsed=true; patio y conductor fuera", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ClientPortalOrientationAlert storageKey={TEST_KEY} />,
    );

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(copy.body).toMatch(/envíos/i);
    expect(copy.body).toMatch(/Mis facturas/i);
    expect(copy.body).not.toMatch(
      /Iniciar|paradas|Completar|Reservar|falso|Dinero del viaje|\bCostos\b/i,
    );
    expect(screen.queryByText(/Reservar el viaje/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Iniciar viaje/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    render(<ClientPortalOrientationAlert storageKey={TEST_KEY} />);
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
