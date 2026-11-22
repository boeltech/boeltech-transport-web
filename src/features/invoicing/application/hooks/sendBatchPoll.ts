/**
 * Poll GET /invoices/send-batches/:batchId (TEC T4′ / F4′).
 * Intervalo 2–5s × ≤60s; invalida listados finance/invoices en cada tick.
 */

import type { QueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "@features/finance/domain";
import { invoiceQueryKeys } from "@features/invoicing/domain";
import { invoicingApi } from "@features/invoicing/infrastructure";
import type { SendBatchPollResult } from "@features/invoicing/domain";

export const SEND_BATCH_POLL_INTERVAL_MS = 3_000;
export const SEND_BATCH_POLL_MAX_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function invalidateDispatchLists(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
  await queryClient.invalidateQueries({
    queryKey: invoiceQueryKeys.dispatchDocuments(),
  });
  await queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
}

async function invalidateInvoiceDetailIfPresent(
  queryClient: QueryClient,
  invoiceId: string | undefined,
): Promise<void> {
  if (!invoiceId) return;
  await queryClient.invalidateQueries({
    queryKey: invoiceQueryKeys.detail(invoiceId),
  });
}

/**
 * Poll hasta completed* o timeout. Exportado para tests.
 * Al terminal (o timeout) invalida detalle de factura si se pasa `invoiceId` (H-U05-Q05).
 */
export async function pollSendBatchUntilSettled(
  batchId: string,
  queryClient: QueryClient,
  opts?: {
    intervalMs?: number;
    maxMs?: number;
    getStatus?: (id: string) => Promise<SendBatchPollResult>;
    /** Factura origen del envío — refresca `dispatch_sent_at` en detalle. */
    invoiceId?: string;
  },
): Promise<SendBatchPollResult | null> {
  const intervalMs = opts?.intervalMs ?? SEND_BATCH_POLL_INTERVAL_MS;
  const maxMs = opts?.maxMs ?? SEND_BATCH_POLL_MAX_MS;
  const getStatus = opts?.getStatus ?? invoicingApi.getSendBatchStatus;
  const deadline = Date.now() + maxMs;

  while (Date.now() < deadline) {
    await sleep(intervalMs);
    try {
      const status = await getStatus(batchId);
      await invalidateDispatchLists(queryClient);
      if (
        status.status === "completed" ||
        status.status === "completed_with_errors"
      ) {
        await invalidateInvoiceDetailIfPresent(queryClient, opts?.invoiceId);
        return status;
      }
    } catch {
      try {
        await invalidateDispatchLists(queryClient);
      } catch {
        /* ignore */
      }
    }
  }

  await invalidateDispatchLists(queryClient);
  await invalidateInvoiceDetailIfPresent(queryClient, opts?.invoiceId);
  return null;
}
