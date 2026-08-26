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

/** Selección de folios a reenviar: invoice_id[]. */
export type InvoiceSelectionState = string[];

export function toggleInvoiceId(
  selection: InvoiceSelectionState,
  invoiceId: string,
  checked: boolean,
): InvoiceSelectionState {
  if (checked) {
    return selection.includes(invoiceId)
      ? selection
      : [...selection, invoiceId];
  }
  return selection.filter((id) => id !== invoiceId);
}

export function selectAllSkippedInvoiceIds(
  skippedItems: BillingDispatchRunItem[],
): InvoiceSelectionState {
  return skippedItems
    .map((item) => item.invoiceId)
    .filter((id): id is string => Boolean(id));
}

export function selectClientSkippedInvoiceIds(
  skippedItems: BillingDispatchRunItem[],
  clientId: string,
  current: InvoiceSelectionState,
): InvoiceSelectionState {
  const clientIds = skippedItems
    .filter((item) => item.clientId === clientId && item.invoiceId)
    .map((item) => item.invoiceId!);
  const set = new Set(current);
  for (const id of clientIds) set.add(id);
  return Array.from(set);
}

export function clearInvoiceSelection(): InvoiceSelectionState {
  return [];
}

export function skippedItemsForSelection(
  skippedItems: BillingDispatchRunItem[],
  selection: InvoiceSelectionState,
): BillingDispatchRunItem[] {
  const selected = new Set(selection);
  return skippedItems.filter(
    (item) => item.invoiceId != null && selected.has(item.invoiceId),
  );
}

/**
 * Payload de reenvío (D2–D4): forceResend + invoiceIds + overrides del set.
 * El envío normal no debe usar esta función.
 */
export function buildForceResendPayload(
  invoiceIds: InvoiceSelectionState,
  recipientsByClient: RecipientsByClient[] | undefined,
  selection: Record<string, string[]>,
  clientIdsInResendSet: string[],
): ConfirmSendDispatchRunPayload {
  const groups = filterRecipientGroupsByClientIds(
    recipientsByClient,
    clientIdsInResendSet,
  );
  const recipientOverrides: RecipientOverrideEntry[] | undefined =
    buildRecipientOverrides(groups, selection);

  return {
    forceResend: true,
    invoiceIds: [...invoiceIds],
    recipientOverrides,
  };
}
