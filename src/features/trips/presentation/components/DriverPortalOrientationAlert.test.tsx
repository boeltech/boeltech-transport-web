import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripsListCopy } from "../copy/listCopy";
import {
  DRIVER_PORTAL_ORIENTATION_STORAGE_KEY,
  DriverPortalOrientationAlert,
} from "./DriverPortalOrientationAlert";

const copy = tripsListCopy.driverOrientation;
const TEST_KEY = `${DRIVER_PORTAL_ORIENTATION_STORAGE_KEY}.test`;

describe("DriverPortalOrientationAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña 3 tiempos y persiste collapsed=true; falso y patio fuera", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <DriverPortalOrientationAlert storageKey={TEST_KEY} />,
    );

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(copy.body).toMatch(/Iniciar/i);
    expect(copy.body).toMatch(/paradas/i);
    expect(copy.body).toMatch(/Completar/i);
    expect(copy.body).not.toMatch(/Reservar|Confirmar|falso|Dinero del viaje|\bCostos\b/i);
    expect(screen.queryByText(/Reservar el viaje/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/viaje en falso/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    render(<DriverPortalOrientationAlert storageKey={TEST_KEY} />);
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
