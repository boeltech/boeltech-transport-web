/**
 * Parse / build query del formulario único `/finance/collections/new`.
 */

import {
  COLLECTION_CHANNEL_PARAM,
  COLLECTION_CLIENT_ID_PARAM,
  COLLECTION_FROM_PARAM,
  COLLECTION_INVOICE_ID_PARAM,
  COLLECTION_INVOICE_IDS_PARAM,
  COLLECTION_RECEIVER_RFC_PARAM,
  COLLECTION_TRIP_ID_PARAM,
  COLLECTION_TRIP_IDS_PARAM,
  type CollectionChannel,
} from "../../application/financeRoutes";

const CHANNELS = new Set<CollectionChannel>([
  "with_invoice",
  "without_invoice",
]);

function splitIds(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export interface RegisterCollectionQuery {
  channel: CollectionChannel | null;
  clientId: string | null;
  invoiceId: string | null;
  invoiceIds: string[];
  tripId: string | null;
  tripIds: string[];
  receiverRfc: string | null;
  from: string | null;
}

export function parseRegisterCollectionSearch(
  search: string | URLSearchParams,
): RegisterCollectionQuery {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const channelRaw = params.get(COLLECTION_CHANNEL_PARAM);
  const channel =
    channelRaw && CHANNELS.has(channelRaw as CollectionChannel)
      ? (channelRaw as CollectionChannel)
      : null;
  const invoiceId = params.get(COLLECTION_INVOICE_ID_PARAM)?.trim() || null;
  const invoiceIds = splitIds(params.get(COLLECTION_INVOICE_IDS_PARAM));
  if (invoiceId && !invoiceIds.includes(invoiceId)) {
    invoiceIds.unshift(invoiceId);
  }
  const tripId = params.get(COLLECTION_TRIP_ID_PARAM)?.trim() || null;
  const tripIds = splitIds(params.get(COLLECTION_TRIP_IDS_PARAM));
  if (tripId && !tripIds.includes(tripId)) {
    tripIds.unshift(tripId);
  }
  return {
    channel,
    clientId: params.get(COLLECTION_CLIENT_ID_PARAM)?.trim() || null,
    invoiceId,
    invoiceIds,
    tripId,
    tripIds,
    receiverRfc:
      params.get(COLLECTION_RECEIVER_RFC_PARAM)?.trim().toUpperCase() || null,
    from: params.get(COLLECTION_FROM_PARAM)?.trim() || null,
  };
}

/** IDs premarcados: query + selección de bandeja. */
export function resolvePremarkedIds(
  queryIds: readonly string[],
  fallbackAllIds: readonly string[],
): Set<string> {
  if (queryIds.length > 0) {
    return new Set(queryIds.filter((id) => fallbackAllIds.includes(id)));
  }
  return new Set(fallbackAllIds);
}
