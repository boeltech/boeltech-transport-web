import {
  resolveDetailQueryErrorState,
  type DetailQueryErrorState,
} from "@shared/utils/resolveQueryErrorState";

export type InvoiceEditPageGate =
  | { kind: "loading" }
  | { kind: "loadError"; errorState: DetailQueryErrorState }
  | { kind: "notEditable" }
  | { kind: "ready" };

type InvoiceEditGateInvoice = {
  status: string;
} | null | undefined;

/**
 * Edit-page gate for `/invoices/:id/edit`.
 * Order: loading → loadError → notEditable → ready.
 */
export function resolveInvoiceEditPageGate(input: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  invoice: InvoiceEditGateInvoice;
}): InvoiceEditPageGate {
  if (input.isLoading) {
    return { kind: "loading" };
  }

  const detailError = resolveDetailQueryErrorState({
    isError: input.isError,
    error: input.error,
    hasData: Boolean(input.invoice),
  });

  if (detailError !== "ready") {
    return { kind: "loadError", errorState: detailError };
  }

  if (!input.invoice || input.invoice.status !== "draft") {
    return { kind: "notEditable" };
  }

  return { kind: "ready" };
}
