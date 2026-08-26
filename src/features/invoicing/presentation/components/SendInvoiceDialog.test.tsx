import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SendInvoiceDialog } from "./SendInvoiceDialog";
import { invoicingCopy } from "../copy/invoicingCopy";

const mutate = vi.fn();

vi.mock("@features/invoicing/application", () => ({
  useInvoiceSendRecipients: () => ({
    data: {
      clientId: "client-1",
      clientName: "Cliente Demo",
      recipients: [
        {
          key: "billing_email",
          kind: "billing_email",
          label: "Correo de facturación",
          email: "billing@demo.test",
        },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useSendInvoice: () => ({
    mutate,
    isPending: false,
  }),
}));

describe("SendInvoiceDialog", () => {
  beforeEach(() => {
    mutate.mockClear();
  });

  it("muestra aviso de reenvío cuando alreadySent", () => {
    render(
      <SendInvoiceDialog
        invoiceId="inv-1"
        open
        onOpenChange={vi.fn()}
        alreadySent
      />,
    );

    expect(
      screen.getByText(invoicingCopy.send.dialog.titleResend),
    ).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.send.dialog.resendWarning),
    ).toBeInTheDocument();
  });

  it("confirma envío con destinatarios por defecto", async () => {
    const user = userEvent.setup();
    render(
      <SendInvoiceDialog
        invoiceId="inv-1"
        open
        onOpenChange={vi.fn()}
        alreadySent={false}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: invoicingCopy.send.dialog.submit }),
    );

    expect(mutate).toHaveBeenCalledWith({ recipientKeys: undefined });
  });
});
