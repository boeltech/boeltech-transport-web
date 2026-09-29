import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { financeCopy } from "../copy";
import {
  ACCOUNTANT_INVOICEABLE_QUEUES_STORAGE_KEY,
  AccountantInvoiceableQueuesAlert,
} from "./AccountantInvoiceableQueuesAlert";

const copy = financeCopy.invoiceable.queuesAlert;
const TEST_KEY = `${ACCOUNTANT_INVOICEABLE_QUEUES_STORAGE_KEY}.test`;

describe("AccountantInvoiceableQueuesAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("enseña las dos colas y persiste collapsed=true al cerrar", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MemoryRouter>
        <AccountantInvoiceableQueuesAlert storageKey={TEST_KEY} />
      </MemoryRouter>,
    );

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.fiscalAttentionLink }),
    ).toHaveAttribute("href", "/trips?fiscalAttention=1");

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    render(
      <MemoryRouter>
        <AccountantInvoiceableQueuesAlert storageKey={TEST_KEY} />
      </MemoryRouter>,
    );
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
