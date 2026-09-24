import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
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
        {
          key: "contact:ana",
          kind: "contact",
          contactId: "ana",
          label: "Ana Contabilidad",
          email: "ana@demo.test",
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

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderDialog(
  props: Partial<ComponentProps<typeof SendInvoiceDialog>> = {},
) {
  return render(
    <MemoryRouter>
      <SendInvoiceDialog
        invoiceId="inv-1"
        open
        onOpenChange={vi.fn()}
        alreadySent={false}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("SendInvoiceDialog", () => {
  beforeEach(() => {
    mutate.mockClear();
  });

  it("muestra aviso de reenvío y CTA Reenviar cuando alreadySent", () => {
    renderDialog({ alreadySent: true });

    expect(
      screen.getByText(invoicingCopy.send.dialog.titleResend),
    ).toBeInTheDocument();
    expect(
      screen.getByText(invoicingCopy.send.dialog.resendWarning),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: invoicingCopy.send.dialog.submitResend,
      }),
    ).toBeInTheDocument();
  });

  it("lista destinatarios del mismo modelo que el wizard (default todos)", () => {
    renderDialog();

    expect(
      screen.getByText(invoicingCopy.send.dialog.recipientsHeading),
    ).toBeInTheDocument();
    expect(screen.getByText("Correo de facturación")).toBeInTheDocument();
    expect(screen.getByText("Ana Contabilidad")).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo de facturación/i)).toBeChecked();
    expect(screen.getByLabelText(/Ana Contabilidad/i)).toBeChecked();
    expect(
      screen.queryByText(/Destinatarios del correo/i),
    ).not.toBeInTheDocument();
  });

  it("confirma envío con destinatarios por defecto (body undefined = todos)", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(
      screen.getByRole("button", { name: invoicingCopy.send.dialog.submit }),
    );

    expect(mutate).toHaveBeenCalledWith({ recipientKeys: undefined });
  });

  it("envía subset cuando se desmarca un destinatario", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByLabelText(/Ana Contabilidad/i));
    await user.click(
      screen.getByRole("button", { name: invoicingCopy.send.dialog.submit }),
    );

    expect(mutate).toHaveBeenCalledWith({
      recipientKeys: ["billing_email"],
    });
  });

  it("muestra copy de enlace ZIP / encolado (P11/P13)", () => {
    renderDialog();

    expect(
      screen.getByText(invoicingCopy.send.dialog.description),
    ).toBeInTheDocument();
    expect(invoicingCopy.send.dialog.description).toMatch(/enlace/i);
    expect(invoicingCopy.send.dialog.description).toMatch(/ZIP/i);
    expect(invoicingCopy.send.dialog.successToast).toMatch(/encolado/i);
    expect(invoicingCopy.send.dialog.successToast).not.toMatch(/enviada/i);
  });
});
