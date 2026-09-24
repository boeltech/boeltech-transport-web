/**
 * Envío batch digest async (F4′): 1 POST /invoices/send-batch → 202 + batch_id.
 * Toast inmediato = encolado (ConfirmSheet); poll GET send-batches para toast diferido.
 */

import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";
import { invoicingApi } from "@features/invoicing/infrastructure";
import type {
  SendBatchPollResult,
  SendInvoiceBatchGroupStatus,
} from "@features/invoicing/domain";
import { invoicingCopy } from "@features/invoicing/presentation/copy/invoicingCopy";
import { invoiceQueryKeys } from "./useInvoices";
import {
  invalidateDispatchLists,
  pollSendBatchUntilSettled,
} from "./sendBatchPoll";

export type SendInvoiceBatchGroupItem = {
  groupKey: string;
  clientLabel: string;
  invoiceIds: string[];
  folioLabels: string[];
  /** Keys del cliente. undefined = todos los elegibles (contrato API). */
  recipientKeys?: string[];
};

export type SendInvoiceBatchResultItem = {
  groupKey: string;
  clientLabel: string;
  invoiceIds: string[];
  folioLabels: string[];
  /** true = grupo aceptado en cola (`queued`). */
  ok: boolean;
  status: SendInvoiceBatchGroupStatus;
  errorMessage?: string;
};

export {
  pollSendBatchUntilSettled,
  SEND_BATCH_POLL_INTERVAL_MS,
  SEND_BATCH_POLL_MAX_MS,
} from "./sendBatchPoll";

const pollCopy = invoicingCopy.send.batchPoll;

function toastForSettledBatch(
  toast: ReturnType<typeof useToast>["toast"],
  poll: SendBatchPollResult,
): void {
  const sent = poll.groups.filter((g) => g.status === "sent");
  const failed = poll.groups.filter((g) => g.status === "failed");
  const sentInvoices = sent.reduce((n, g) => n + g.invoiceIds.length, 0);

  if (failed.length === 0 && sent.length > 0) {
    toast({
      variant: "success",
      title: pollCopy.toastCompleted(sentInvoices, sent.length),
    });
    return;
  }

  if (sent.length === 0 && failed.length > 0) {
    const firstError = failed.find((g) => g.errorMessage)?.errorMessage;
    toast({
      variant: "error",
      title: pollCopy.toastJobAllFailed,
      description: firstError ?? undefined,
    });
    return;
  }

  if (sent.length > 0 && failed.length > 0) {
    toast({
      variant: "warning",
      title: pollCopy.toastJobPartial(sent.length, failed.length),
    });
  }
}

export function useSendInvoicesBatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const pollGenerationRef = useRef(0);

  const sendBatch = useCallback(
    async (
      groups: SendInvoiceBatchGroupItem[],
    ): Promise<SendInvoiceBatchResultItem[]> => {
      if (groups.length === 0) return [];

      setIsPending(true);
      setProgress({ current: 1, total: 1 });

      try {
        const response = await invoicingApi.sendInvoicesBatch({
          groups: groups.map((group) => ({
            invoiceIds: group.invoiceIds,
            recipientKeys: group.recipientKeys,
          })),
        });

        const byKey = new Map(
          response.groups.map((g) => [g.groupKey, g] as const),
        );
        const byFirstInvoice = new Map(
          response.groups.map((g) => [g.invoiceIds[0] ?? "", g] as const),
        );

        const results: SendInvoiceBatchResultItem[] = groups.map((group) => {
          const apiGroup =
            byKey.get(group.groupKey) ??
            byFirstInvoice.get(group.invoiceIds[0] ?? "") ??
            response.groups.find(
              (g) =>
                g.invoiceIds.length === group.invoiceIds.length &&
                group.invoiceIds.every((id) => g.invoiceIds.includes(id)),
            );

          if (!apiGroup) {
            return {
              groupKey: group.groupKey,
              clientLabel: group.clientLabel,
              invoiceIds: group.invoiceIds,
              folioLabels: group.folioLabels,
              ok: false,
              status: "failed" as const,
              errorMessage: "Respuesta de envío incompleta",
            };
          }

          const ok = apiGroup.status === "queued";
          return {
            groupKey: group.groupKey,
            clientLabel: group.clientLabel,
            invoiceIds: apiGroup.invoiceIds.length
              ? apiGroup.invoiceIds
              : group.invoiceIds,
            folioLabels: group.folioLabels,
            ok,
            status: apiGroup.status,
            errorMessage: apiGroup.errorMessage ?? undefined,
          };
        });

        await invalidateDispatchLists(queryClient);
        for (const group of groups) {
          for (const invoiceId of group.invoiceIds) {
            await queryClient.invalidateQueries({
              queryKey: invoiceQueryKeys.detail(invoiceId),
            });
          }
        }

        const hasQueued = results.some((r) => r.ok);
        if (hasQueued && response.batchId) {
          const generation = ++pollGenerationRef.current;
          void (async () => {
            const settled = await pollSendBatchUntilSettled(
              response.batchId,
              queryClient,
            );
            if (generation !== pollGenerationRef.current) return;
            if (settled) {
              toastForSettledBatch(toast, settled);
            }
          })();
        }

        return results;
      } catch (error) {
        const message = getErrorMessage(error);
        return groups.map((group) => ({
          groupKey: group.groupKey,
          clientLabel: group.clientLabel,
          invoiceIds: group.invoiceIds,
          folioLabels: group.folioLabels,
          ok: false,
          status: "failed" as const,
          errorMessage: message,
        }));
      } finally {
        setIsPending(false);
        setProgress(null);
      }
    },
    [queryClient, toast],
  );

  return { sendBatch, isPending, progress };
}
