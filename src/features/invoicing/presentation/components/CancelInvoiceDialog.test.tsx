import type { ComponentProps } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { Invoice } from "@features/invoicing/domain";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { invoicingCopy } from "../copy/invoicingCopy";

const mutateMock = vi.fn();
const toastMock = vi.fn();
const copy = invoicingCopy.detail.cancelDialog;

type CancelOpts = {
  onSuccess?: (invoice: Invoice) => void;
  onError?: (err: unknown) => void;
};

let cancelOpts: CancelOpts | undefined;

vi.mock("@features/invoicing/application", () => ({
  useCancelInvoice: (opts?: CancelOpts) => {
    cancelOpts = opts;
    return {
      mutate: mutateMock,
      isPending: false,
    };
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: toastMock }),
  };
});

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
    cancelOpts = undefined;
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

  it("shows motive 01 hint and prefer-Sustituir warning", () => {
    renderDialog({ defaultCancellationCode: "01" });

    expect(screen.getByText(copy.motiveHints["01"])).toBeInTheDocument();
    expect(
      screen.getByText(copy.motive01PreferSubstituteTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(copy.motive01PreferSubstituteBody),
    ).toBeInTheDocument();
  });

  it("shows next-step Alert for 409 cancellation in progress", () => {
    renderDialog();

    act(() => {
      cancelOpts?.onError?.(
        new ApiError("en curso", 409, "CANCELLATION_IN_PROGRESS"),
      );
    });

    expect(
      screen.getByText(copy.errorInProgressTitle),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.errorInProgressBody)).toBeInTheDocument();
    expect(screen.queryByText(/PAC_|Finkok|SOAP|lease/i)).not.toBeInTheDocument();
  });

  it("toasts with canonical vocabulary on pending acceptance", () => {
    renderDialog();

    act(() => {
      cancelOpts?.onSuccess?.({
        status: "cancellation_pending",
      } as Invoice);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: copy.toastPendingTitle,
        description: copy.toastPendingDescription,
      }),
    );
  });

  it("toasts Cancelada ante el SAT when fully cancelled", () => {
    renderDialog();

    act(() => {
      cancelOpts?.onSuccess?.({
        status: "cancelled",
      } as Invoice);
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: copy.toastCancelledTitle,
      }),
    );
  });
});
