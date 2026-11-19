import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { invoicingCopy } from "../copy/invoicingCopy";
import {
  getInvoiceFollowThroughStorageKey,
  InvoiceFollowThroughAlert,
} from "./InvoiceFollowThroughAlert";

const hint = invoicingCopy.detail.hint;
const actions = invoicingCopy.detail.actions;
const INVOICE_ID = "inv-follow-through-1";
const TEST_KEY = `${getInvoiceFollowThroughStorageKey(INVOICE_ID)}.test`;

describe("InvoiceFollowThroughAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("muestra tip de correo con Enviar y persiste Entendido", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const onDismissed = vi.fn();
    const { unmount } = render(
      <InvoiceFollowThroughAlert
        invoiceId={INVOICE_ID}
        storageKey={TEST_KEY}
        onSend={onSend}
        onDismissed={onDismissed}
      />,
    );

    expect(screen.getByText(hint.followThroughTitle)).toBeInTheDocument();
    expect(screen.getByText(hint.followThroughSend)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: actions.registerPayment }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: actions.sendByEmail }),
    );
    expect(onSend).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole("button", { name: hint.followThroughDismiss }),
    );

    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(onDismissed).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText(hint.followThroughTitle),
    ).not.toBeInTheDocument();

    unmount();
    render(
      <InvoiceFollowThroughAlert
        invoiceId={INVOICE_ID}
        storageKey={TEST_KEY}
        onSend={onSend}
      />,
    );
    expect(
      screen.queryByText(hint.followThroughTitle),
    ).not.toBeInTheDocument();
  });

  it("getInvoiceFollowThroughStorageKey es por factura", () => {
    expect(getInvoiceFollowThroughStorageKey("a")).not.toBe(
      getInvoiceFollowThroughStorageKey("b"),
    );
    expect(getInvoiceFollowThroughStorageKey("a")).toBe(
      "invoicing.detail.follow-through.a.collapsed",
    );
  });
});
