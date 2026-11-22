import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { tripsListCopy } from "../copy/listCopy";
import {
  CLIENT_PORTAL_ORIENTATION_STORAGE_KEY,
  ClientPortalOrientationAlert,
} from "./ClientPortalOrientationAlert";

const copy = tripsListCopy.clientOrientation;
const TEST_KEY = `${CLIENT_PORTAL_ORIENTATION_STORAGE_KEY}.test`;

function renderAlert() {
  return render(
    <MemoryRouter>
      <ClientPortalOrientationAlert storageKey={TEST_KEY} />
    </MemoryRouter>,
  );
}

describe("ClientPortalOrientationAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña 2 tiempos, puente a Mis facturas y persiste collapsed=true; patio y conductor fuera", async () => {
    const user = userEvent.setup();
    const { unmount } = renderAlert();

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(copy.body).toMatch(/envíos/i);
    expect(copy.body).toMatch(/Mis facturas/i);
    expect(copy.body).not.toMatch(
      /Iniciar|paradas|Completar|Reservar|falso|Dinero del viaje|\bCostos\b/i,
    );
    expect(screen.queryByText(/Reservar el viaje/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Iniciar viaje/i)).not.toBeInTheDocument();

    const invoicesLink = screen.getByRole("link", { name: copy.invoicesLink });
    expect(invoicesLink).toHaveAttribute("href", "/finance/invoices");

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    renderAlert();
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
