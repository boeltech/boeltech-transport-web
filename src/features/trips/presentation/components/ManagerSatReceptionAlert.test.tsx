import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripsListCopy } from "../copy/listCopy";
import {
  MANAGER_SAT_RECEPTION_STORAGE_KEY,
  ManagerSatReceptionAlert,
} from "./ManagerSatReceptionAlert";

const copy = tripsListCopy.managerOrientation;
const TEST_KEY = `${MANAGER_SAT_RECEPTION_STORAGE_KEY}.test`;

describe("ManagerSatReceptionAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña recepción SAT sin copy de accountant y persiste collapsed=true", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ManagerSatReceptionAlert storageKey={TEST_KEY} />,
    );

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(copy.body).not.toMatch(/no sustituyes tú/i);
    expect(copy.body).not.toMatch(/pide a un gerente/i);
    expect(copy.body).not.toMatch(/dos colas/i);
    expect(screen.queryByText(/Reservar el viaje/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Por facturar/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    render(<ManagerSatReceptionAlert storageKey={TEST_KEY} />);
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
