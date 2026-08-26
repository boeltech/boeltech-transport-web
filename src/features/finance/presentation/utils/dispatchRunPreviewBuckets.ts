import type {
  BillingDispatchClientReceipt,
  BillingDispatchRunItem,
  BillingDispatchRunSummary,
} from "../../domain/billingDispatchRun.types";

export function countDispatchPreviewBuckets(
  summary?: BillingDispatchRunSummary,
): {
  pendingStampCount: number;
  readyToSendCount: number;
  alreadySentSkipped: number;
} {
  return {
    pendingStampCount: summary?.pendingStampCount ?? 0,
    readyToSendCount: summary?.readyToSendCount ?? 0,
    alreadySentSkipped: summary?.alreadySentSkipped ?? 0,
  };
}

/**
 * Separa ítems de preview:
 * - pendingStamp: faltan por generar
 * - readyToSend: ready_to_send ≠ skipped (listed / post-send)
 * - alreadySent: ready_to_send ∧ skipped (omitidas; candidatas a force_resend)
 */
export function splitDispatchRunItems(items: BillingDispatchRunItem[] = []) {
  const pendingStamp = items.filter((i) => i.itemKind === "pending_stamp");
  const readyAll = items.filter((i) => i.itemKind === "ready_to_send");
  const readyToSend = readyAll.filter((i) => i.status !== "skipped");
  const alreadySent = readyAll.filter((i) => i.status === "skipped");
  return { pendingStamp, readyToSend, alreadySent };
}

function groupItemsByClient(items: BillingDispatchRunItem[]) {
  const map = new Map<string, BillingDispatchRunItem[]>();
  for (const item of items) {
    const key = item.clientId;
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export function groupReadyToSendByClient(items: BillingDispatchRunItem[]) {
  return groupItemsByClient(
    items.filter(
      (i) => i.itemKind === "ready_to_send" && i.status !== "skipped",
    ),
  );
}

export function groupAlreadySentByClient(items: BillingDispatchRunItem[]) {
  return groupItemsByClient(
    items.filter(
      (i) => i.itemKind === "ready_to_send" && i.status === "skipped",
    ),
  );
}

export function groupPendingStampByClient(items: BillingDispatchRunItem[]) {
  return groupItemsByClient(
    items.filter((i) => i.itemKind === "pending_stamp"),
  );
}

export function summarizeReadyToSend(items: BillingDispatchRunItem[]): {
  clientCount: number;
  folioCount: number;
} {
  const ready = items.filter(
    (i) => i.itemKind === "ready_to_send" && i.status !== "skipped",
  );
  return {
    clientCount: groupReadyToSendByClient(ready).size,
    folioCount: ready.length,
  };
}

export function summarizeAlreadySent(items: BillingDispatchRunItem[]): {
  clientCount: number;
  folioCount: number;
} {
  const skipped = items.filter(
    (i) => i.itemKind === "ready_to_send" && i.status === "skipped",
  );
  return {
    clientCount: groupAlreadySentByClient(skipped).size,
    folioCount: skipped.length,
  };
}

/** D10: badge de scope solo si el grupo del cliente mezcla más de un scope. */
export function clientGroupHasMultipleScopes(
  items: BillingDispatchRunItem[],
): boolean {
  return new Set(items.map((i) => i.billingScope ?? "")).size > 1;
}

export function shortId(value: string | null | undefined, len = 8): string {
  if (!value) return "";
  return value.length <= len ? value : value.slice(0, len);
}

export function clientDisplayName(
  item: BillingDispatchRunItem,
  fallback: (short: string) => string,
): string {
  const named = item.clientName?.trim();
  const rfc = item.clientRfc?.trim();
  if (named && rfc) return `${named} · ${rfc}`;
  if (named) return named;
  if (rfc) return rfc;
  return fallback(shortId(item.clientId) || "—");
}

export function buildPendingStampInvoicePath(item: BillingDispatchRunItem): string {
  const params = new URLSearchParams();
  if (item.tripId) params.set("trip_id", item.tripId);
  const scope = item.billingScope;
  if (scope === "false_trip") {
    params.set("scope", "false_trip");
  } else if (scope && scope !== "primary_transport") {
    params.set("scope", scope);
  }
  return `/invoices/new?${params.toString()}`;
}

export function canCancelDispatchRun(status: string): boolean {
  return ["draft", "previewed", "send_confirmed"].includes(status);
}

export function canRefreshPreview(status: string): boolean {
  // failed: allow re-preview to retry after mail/ops failure (API failed → previewed)
  return ["draft", "previewed", "failed"].includes(status);
}

export function canConfirmSend(status: string, readyCount: number): boolean {
  return status === "previewed" && readyCount >= 1;
}

/** D6: reenvío solo en previewed con ≥1 folio seleccionado. */
export function canConfirmForceResend(
  status: string,
  selectedInvoiceCount: number,
): boolean {
  return status === "previewed" && selectedInvoiceCount >= 1;
}

export function isDispatchRunTerminal(status: string): boolean {
  // failed is recoverable via refresh preview — not wizard-terminal
  return ["completed", "cancelled"].includes(status);
}

/** Client IDs presentes en un set de ítems (p. ej. listed o selección de reenvío). */
export function clientIdsFromItems(
  items: BillingDispatchRunItem[],
): string[] {
  return Array.from(new Set(items.map((i) => i.clientId)));
}

/** D2: colapsar grupos si la corrida es densa. */
export const DISPATCH_CLIENT_COLLAPSE_THRESHOLD = 5;
export const DISPATCH_READY_COLLAPSE_THRESHOLD = 20;
/** D4: folios visibles antes de «Ver N más». */
export const DISPATCH_FOLIO_PREVIEW_LIMIT = 5;
/**
 * D10: umbral de facturas promedio por cliente para aviso de enlaces
 * (alineado a MAX_ATTACHED_FOLIOS del API ≈ 4).
 */
export const DISPATCH_ATTACHMENTS_HINT_AVG_FOLIOS = 4;

export function shouldCollapseClientGroups(
  readyCount: number,
  clientCount: number,
): boolean {
  return (
    readyCount > DISPATCH_READY_COLLAPSE_THRESHOLD ||
    clientCount > DISPATCH_CLIENT_COLLAPSE_THRESHOLD
  );
}

/** D5: card de pendientes colapsada cuando hay más pending que ready. */
export function shouldCollapsePendingCard(
  pendingCount: number,
  readyCount: number,
): boolean {
  return pendingCount > readyCount;
}

export function shouldShowAttachmentsHint(
  readyCount: number,
  clientCount: number,
): boolean {
  if (clientCount <= 0 || readyCount <= 0) return false;
  return readyCount / clientCount > DISPATCH_ATTACHMENTS_HINT_AVG_FOLIOS;
}

export function isDispatchRunInFlight(status: string): boolean {
  return status === "send_confirmed" || status === "sending";
}

export type ClientSendResultStatus = "sent" | "failed" | "mixed";

export interface ClientSendResultRow {
  clientId: string;
  clientName: string;
  clientRfc: string | null;
  folioCount: number;
  sentCount: number;
  failedCount: number;
  status: ClientSendResultStatus;
  errorMessage: string | null;
  recipientCount: number;
  receiptStatus: "sent" | "failed" | null;
  folios: string[];
}

/**
 * D6: agrega ítems ready (post-send) + receipts por cliente.
 * Solo considera ítems que no están en skipped.
 */
export function buildClientSendResults(
  items: BillingDispatchRunItem[] = [],
  receipts: BillingDispatchClientReceipt[] | null | undefined,
): ClientSendResultRow[] {
  const ready = items.filter(
    (i) => i.itemKind === "ready_to_send" && i.status !== "skipped",
  );
  const byClient = groupItemsByClient(ready);
  const receiptMap = new Map(
    (receipts ?? []).map((r) => [r.clientId, r] as const),
  );

  const rows: ClientSendResultRow[] = [];
  for (const [clientId, clientItems] of byClient.entries()) {
    const receipt = receiptMap.get(clientId);
    const sentCount = clientItems.filter((i) => i.status === "sent").length;
    const failedCount = clientItems.filter((i) => i.status === "failed").length;
    let status: ClientSendResultStatus = "sent";
    if (receipt?.status === "failed" || (failedCount > 0 && sentCount === 0)) {
      status = "failed";
    } else if (failedCount > 0 && sentCount > 0) {
      status = "mixed";
    } else if (failedCount > 0) {
      status = "failed";
    }

    const first = clientItems[0]!;
    const named = first.clientName?.trim();
    const rfc = first.clientRfc?.trim() ?? null;
    rows.push({
      clientId,
      clientName: named || shortId(clientId) || clientId,
      clientRfc: rfc,
      folioCount: clientItems.length,
      sentCount,
      failedCount,
      status,
      errorMessage:
        receipt?.errorMessage ??
        clientItems.find((i) => i.errorMessage)?.errorMessage ??
        null,
      recipientCount: receipt?.recipients.length ?? 0,
      receiptStatus: receipt?.status ?? null,
      folios: clientItems
        .map((i) => i.folio?.trim())
        .filter((f): f is string => Boolean(f)),
    });
  }

  // Include receipt-only clients (edge) not present in items.
  for (const receipt of receipts ?? []) {
    if (byClient.has(receipt.clientId)) continue;
    rows.push({
      clientId: receipt.clientId,
      clientName: shortId(receipt.clientId) || receipt.clientId,
      clientRfc: null,
      folioCount: 0,
      sentCount: receipt.status === "sent" ? 1 : 0,
      failedCount: receipt.status === "failed" ? 1 : 0,
      status: receipt.status === "failed" ? "failed" : "sent",
      errorMessage: receipt.errorMessage,
      recipientCount: receipt.recipients.length,
      receiptStatus: receipt.status,
      folios: [],
    });
  }

  return rows.sort((a, b) => a.clientName.localeCompare(b.clientName, "es"));
}

export function countFailedClientResults(rows: ClientSendResultRow[]): number {
  return rows.filter((r) => r.status === "failed" || r.status === "mixed")
    .length;
}
