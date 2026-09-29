import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { invoicingCopy } from "../copy/invoicingCopy";
import {
  getInvoiceFilesReadyStorageKey,
  InvoiceFilesReadyAlert,
} from "./InvoiceFilesReadyAlert";

const copy = invoicingCopy.detail.hint;
const INVOICE_ID = "inv-files-ready-1";
const TEST_KEY = `${getInvoiceFilesReadyStorageKey(INVOICE_ID)}.test`;

describe("InvoiceFilesReadyAlert", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("muestra el banner y persiste collapsed=true al pulsar Entendido", async () => {
    const user = userEvent.setup();
    const onDismissed = vi.fn();
    const { unmount } = render(
      <InvoiceFilesReadyAlert
        invoiceId={INVOICE_ID}
        storageKey={TEST_KEY}
        onDismissed={onDismissed}
      />,
    );

    expect(screen.getByText(copy.filesAlertTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.filesAlertDescription)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.filesAlertDismiss }),
    );

    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(onDismissed).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(copy.filesAlertTitle)).not.toBeInTheDocument();

    unmount();
    render(
      <InvoiceFilesReadyAlert invoiceId={INVOICE_ID} storageKey={TEST_KEY} />,
    );
    expect(screen.queryByText(copy.filesAlertTitle)).not.toBeInTheDocument();
  });

  it("getInvoiceFilesReadyStorageKey es por factura", () => {
    expect(getInvoiceFilesReadyStorageKey("a")).not.toBe(
      getInvoiceFilesReadyStorageKey("b"),
    );
  });
});
