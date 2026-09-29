import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripsListCopy } from "../copy/listCopy";
import {
  OPERATOR_COSTS_ORIENTATION_STORAGE_KEY,
  OperatorCostsOrientationAlert,
} from "./OperatorCostsOrientationAlert";

const copy = tripsListCopy.operatorOrientation;
const TEST_KEY = `${OPERATOR_COSTS_ORIENTATION_STORAGE_KEY}.test`;

describe("OperatorCostsOrientationAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña 2 tiempos hacia Costos y persiste collapsed=true", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <OperatorCostsOrientationAlert storageKey={TEST_KEY} />,
    );

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(copy.body).toMatch(/\bCostos\b/);
    expect(copy.body).toMatch(/Agregar de ruta/i);
    expect(copy.body).toMatch(/Agregar del operador/i);
    expect(copy.body).not.toMatch(/Reservar el viaje/i);
    expect(copy.body).not.toMatch(/Atención fiscal|Por facturar|SAT/i);
    expect(screen.queryByText(/Reservar el viaje/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Por facturar/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    render(<OperatorCostsOrientationAlert storageKey={TEST_KEY} />);
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
