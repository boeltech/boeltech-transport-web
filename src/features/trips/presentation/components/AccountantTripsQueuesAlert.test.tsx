import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { tripsListCopy } from "../copy/listCopy";
import {
  ACCOUNTANT_TRIPS_QUEUES_STORAGE_KEY,
  AccountantTripsQueuesAlert,
} from "./AccountantTripsQueuesAlert";

const copy = tripsListCopy.accountantOrientation;
const TEST_KEY = `${ACCOUNTANT_TRIPS_QUEUES_STORAGE_KEY}.test`;

describe("AccountantTripsQueuesAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña las dos colas sin strip de 4 pasos y persiste collapsed=true", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MemoryRouter>
        <AccountantTripsQueuesAlert storageKey={TEST_KEY} />
      </MemoryRouter>,
    );

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.invoiceableLink }),
    ).toHaveAttribute("href", "/finance/invoiceable");
    expect(screen.queryByText(/Reservar el viaje/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    render(
      <MemoryRouter>
        <AccountantTripsQueuesAlert storageKey={TEST_KEY} />
      </MemoryRouter>,
    );
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
