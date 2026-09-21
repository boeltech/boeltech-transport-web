import type { ComponentProps } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { invoicingCopy } from "../copy/invoicingCopy";

const mutateMock = vi.fn();
const copy = invoicingCopy.detail.cancelDialog;

vi.mock("@features/invoicing/application", () => ({
  useCancelInvoice: () => ({
    mutate: mutateMock,
    isPending: false,
  }),
}));

function renderDialog(
  props: Partial<ComponentProps<typeof CancelInvoiceDialog>> = {},
) {
  return render(
    <CancelInvoiceDialog
      invoiceId="inv-1"
      open
      onOpenChange={vi.fn()}
      {...props}
    />,
  );
}

describe("CancelInvoiceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps scrollable body and sticky footer buttons visible", () => {
    renderDialog();

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.back }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.confirm }),
    ).toBeInTheDocument();

    // Dialog portaliza a document.body — no buscar en container de render.
    const scrollBody = document.querySelector(
      "[data-slot='cancel-invoice-body']",
    );
    expect(scrollBody).not.toBeNull();
    expect(scrollBody).toHaveClass("overflow-y-auto");

    const dialogContent = document.querySelector('[role="dialog"]');
    expect(dialogContent).toHaveClass("max-h-[90vh]");
  });

  it("shows residual payments notice only when prop is forced (hard-block lives in InvoiceActions)", () => {
    renderDialog({ hasRegisteredPayments: true });

    expect(
      screen.getByText(copy.paymentsNoticeTitle),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.paymentsNotice)).toBeInTheDocument();
    // Dialog still allows confirm if opened — Actions must not open this path with cobros.
    expect(
      screen.getByRole("button", { name: copy.confirm }),
    ).toBeInTheDocument();
  });

  it("shows replacement UUID field for motivo 01 and hides it for 02", () => {
    const { rerender } = renderDialog({ defaultCancellationCode: "01" });

    expect(
      screen.getByLabelText(new RegExp(copy.replacementUuid, "i")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.confirm }),
    ).toBeInTheDocument();

    rerender(
      <CancelInvoiceDialog
        invoiceId="inv-1"
        open
        onOpenChange={vi.fn()}
        defaultCancellationCode="02"
      />,
    );

    expect(
      screen.queryByLabelText(new RegExp(copy.replacementUuid, "i")),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.confirm }),
    ).toBeInTheDocument();
  });
});
