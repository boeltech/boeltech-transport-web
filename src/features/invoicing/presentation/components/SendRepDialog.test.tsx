import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import { SendRepDialog } from "./SendRepDialog";
import { invoicingCopy } from "../copy/invoicingCopy";

const sendBatch = vi.fn();

vi.mock("@features/invoicing/application", () => ({
  usePaymentSendRecipients: () => ({
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
  useSendInvoicesBatch: () => ({
    sendBatch,
    isPending: false,
    progress: null,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderDialog(
  props: Partial<ComponentProps<typeof SendRepDialog>> = {},
) {
  return render(
    <MemoryRouter>
      <SendRepDialog
        paymentId="pay-1"
        open
        onOpenChange={vi.fn()}
        alreadySent={false}
        {...props}
      />
    </MemoryRouter>,
  );
}

const copy = invoicingCopy.send.repDialog;

describe("SendRepDialog", () => {
  beforeEach(() => {
    sendBatch.mockReset();
    sendBatch.mockResolvedValue([
      {
        groupKey: "payment:pay-1",
        clientLabel: "Cliente Demo",
        invoiceIds: [],
        paymentIds: ["pay-1"],
        folioLabels: [copy.documentLabel],
        ok: true,
        status: "queued",
      },
    ]);
  });

  it("muestra aviso de reenvío y CTA Reenviar cuando alreadySent", () => {
    renderDialog({ alreadySent: true });

    expect(screen.getByText(copy.titleResend)).toBeInTheDocument();
    expect(screen.getByText(copy.resendWarning)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.submitResend }),
    ).toBeInTheDocument();
  });

  it("lista destinatarios del payment send-recipients (default todos)", () => {
    renderDialog();

    expect(screen.getByText(copy.recipientsHeading)).toBeInTheDocument();
    expect(screen.getByText("Correo de facturación")).toBeInTheDocument();
    expect(screen.getByText("Ana Contabilidad")).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo de facturación/i)).toBeChecked();
    expect(screen.getByLabelText(/Ana Contabilidad/i)).toBeChecked();
  });

  it("confirma envío con payment_ids N=1 y recipientKeys undefined = todos", async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    const onOpenChange = vi.fn();
    renderDialog({ onSent, onOpenChange });

    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(sendBatch).toHaveBeenCalledWith([
      {
        groupKey: "payment:pay-1",
        clientLabel: "Cliente Demo",
        invoiceIds: [],
        paymentIds: ["pay-1"],
        folioLabels: [copy.documentLabel],
        recipientKeys: undefined,
      },
    ]);
    expect(onSent).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("envía subset cuando se desmarca un destinatario", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByLabelText(/Ana Contabilidad/i));
    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(sendBatch).toHaveBeenCalledWith([
      expect.objectContaining({
        paymentIds: ["pay-1"],
        recipientKeys: ["billing_email"],
      }),
    ]);
  });

  it("muestra error inline cuando el batch no encola", async () => {
    sendBatch.mockResolvedValueOnce([
      {
        groupKey: "payment:pay-1",
        clientLabel: "Cliente Demo",
        invoiceIds: [],
        paymentIds: ["pay-1"],
        folioLabels: [copy.documentLabel],
        ok: false,
        status: "failed",
        errorMessage: "Solo REP timbrados pueden enviarse por correo",
      },
    ]);
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: copy.submit }));

    expect(
      screen.getByText("Solo REP timbrados pueden enviarse por correo"),
    ).toBeInTheDocument();
  });
});
