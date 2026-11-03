import type {
  BillingDispatchRunItem,
  ConfirmSendDispatchRunPayload,
  RecipientsByClient,
  RecipientOverrideEntry,
} from "../../domain/billingDispatchRun.types";
import {
  buildRecipientOverrides,
  filterRecipientGroupsByClientIds,
} from "./dispatchRunRecipientSelection";

function isRepDocument(item: BillingDispatchRunItem): boolean {
  return item.documentKind === "rep";
}

/** Selección tipada de reenvío: invoice_ids ∪ payment_ids (addendum 0082 D10). */
export type ResendSelectionState = {
  invoiceIds: string[];
  paymentIds: string[];
};

export function clearResendSelection(): ResendSelectionState {
  return { invoiceIds: [], paymentIds: [] };
}

export function resendSelectionCount(selection: ResendSelectionState): number {
  return selection.invoiceIds.length + selection.paymentIds.length;
}

export function toggleInvoiceId(
  selection: ResendSelectionState,
  invoiceId: string,
  checked: boolean,
): ResendSelectionState {
  if (checked) {
    return selection.invoiceIds.includes(invoiceId)
      ? selection
      : { ...selection, invoiceIds: [...selection.invoiceIds, invoiceId] };
  }
  return {
    ...selection,
    invoiceIds: selection.invoiceIds.filter((id) => id !== invoiceId),
  };
}

export function togglePaymentId(
  selection: ResendSelectionState,
  paymentId: string,
  checked: boolean,
): ResendSelectionState {
  if (checked) {
    return selection.paymentIds.includes(paymentId)
      ? selection
      : { ...selection, paymentIds: [...selection.paymentIds, paymentId] };
  }
  return {
    ...selection,
    paymentIds: selection.paymentIds.filter((id) => id !== paymentId),
  };
}

export function selectAllSkippedDocuments(
  skippedItems: BillingDispatchRunItem[],
): ResendSelectionState {
  const invoiceIds: string[] = [];
  const paymentIds: string[] = [];
  for (const item of skippedItems) {
    if (isRepDocument(item)) {
      if (item.paymentId) paymentIds.push(item.paymentId);
    } else if (item.invoiceId) {
      invoiceIds.push(item.invoiceId);
    }
  }
  return { invoiceIds, paymentIds };
}

export function selectClientSkippedDocuments(
  skippedItems: BillingDispatchRunItem[],
  clientId: string,
  current: ResendSelectionState,
): ResendSelectionState {
  const invoiceSet = new Set(current.invoiceIds);
  const paymentSet = new Set(current.paymentIds);
  for (const item of skippedItems) {
    if (item.clientId !== clientId) continue;
    if (isRepDocument(item)) {
      if (item.paymentId) paymentSet.add(item.paymentId);
    } else if (item.invoiceId) {
      invoiceSet.add(item.invoiceId);
    }
  }
  return {
    invoiceIds: Array.from(invoiceSet),
    paymentIds: Array.from(paymentSet),
  };
}

export function skippedItemsForSelection(
  skippedItems: BillingDispatchRunItem[],
  selection: ResendSelectionState,
): BillingDispatchRunItem[] {
  const invoices = new Set(selection.invoiceIds);
  const payments = new Set(selection.paymentIds);
  return skippedItems.filter((item) => {
    if (isRepDocument(item)) {
      return item.paymentId != null && payments.has(item.paymentId);
    }
    return item.invoiceId != null && invoices.has(item.invoiceId);
  });
}

/**
 * Payload de reenvío tipado (addendum 0082 D10):
 * forceResend + invoiceIds ∪ paymentIds + overrides del set.
 */
export function buildForceResendPayload(
  selection: ResendSelectionState,
  recipientsByClient: RecipientsByClient[] | undefined,
  recipientSelection: Record<string, string[]>,
  clientIdsInResendSet: string[],
): ConfirmSendDispatchRunPayload {
  const groups = filterRecipientGroupsByClientIds(
    recipientsByClient,
    clientIdsInResendSet,
  );
  const recipientOverrides: RecipientOverrideEntry[] | undefined =
    buildRecipientOverrides(groups, recipientSelection);

  return {
    forceResend: true,
    ...(selection.invoiceIds.length
      ? { invoiceIds: [...selection.invoiceIds] }
      : {}),
    ...(selection.paymentIds.length
      ? { paymentIds: [...selection.paymentIds] }
      : {}),
    recipientOverrides,
  };
}
