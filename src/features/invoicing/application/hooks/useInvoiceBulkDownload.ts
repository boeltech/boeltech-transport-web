/**
 * Hooks — descarga masiva de CFDI (ADR-0104).
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type Query,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useDebounce } from "@shared/hooks/use-debounce";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { invalidateNotificationsQueries } from "@features/notifications/application/invalidateNotificationsQueries";
import { devRefetchIntervalFn } from "@/shared/config/devPolling";
import {
  invoiceBulkDownloadKeys,
  isInvoiceBulkDownloadActive,
  type InvoiceBulkDownloadCriteria,
  type InvoiceBulkDownloadJob,
  type InvoiceBulkDownloadPreview,
} from "@features/invoicing/domain";
import { invoiceBulkDownloadApi } from "../../infrastructure/invoiceBulkDownloadApi";

const PREVIEW_DEBOUNCE_MS = 350;
const STATUS_POLL_MS = 3_000;

function isValidCriteria(
  criteria: InvoiceBulkDownloadCriteria | null | undefined,
): criteria is InvoiceBulkDownloadCriteria {
  if (!criteria) return false;
  const periodRe = /^\d{4}-\d{2}$/;
  return (
    periodRe.test(criteria.periodFrom) &&
    periodRe.test(criteria.periodTo) &&
    criteria.periodTo >= criteria.periodFrom &&
    (criteria.content === "xml_pdf" || criteria.content === "xml")
  );
}

/**
 * Vista previa con debounce. Solo consulta si el form es válido y `enabled`.
 */
export function useInvoiceBulkDownloadPreview(
  criteria: InvoiceBulkDownloadCriteria | null,
  options?: { enabled?: boolean },
) {
  const debounced = useDebounce(criteria, PREVIEW_DEBOUNCE_MS);
  const enabled =
    (options?.enabled ?? true) && isValidCriteria(debounced);

  return useQuery({
    queryKey: enabled
      ? invoiceBulkDownloadKeys.preview(debounced)
      : invoiceBulkDownloadKeys.previews(),
    queryFn: () => invoiceBulkDownloadApi.preview(debounced!),
    enabled,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useCreateInvoiceBulkDownload(
  options?: Omit<
    UseMutationOptions<
      InvoiceBulkDownloadJob,
      Error,
      InvoiceBulkDownloadCriteria
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (criteria: InvoiceBulkDownloadCriteria) =>
      invoiceBulkDownloadApi.create(criteria),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({
        queryKey: invoiceBulkDownloadKeys.lists(),
      });
      queryClient.setQueryData(invoiceBulkDownloadKeys.detail(data.id), data);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

/** Extrae `active_id` del 409 BULK_DOWNLOAD_IN_PROGRESS. */
export function getBulkDownloadInProgressActiveId(
  error: unknown,
): string | null {
  if (!isApiError(error) || error.code !== "BULK_DOWNLOAD_IN_PROGRESS") {
    return null;
  }
  const activeId = error.details?.active_id;
  return typeof activeId === "string" && activeId.length > 0 ? activeId : null;
}

/**
 * Detalle del job. Polling cada 3 s mientras `queued|processing`.
 * Al terminar, el Sheet debe llamar `invalidateNotificationsQueries`.
 */
export function useInvoiceBulkDownload(
  id: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const enabled = (options?.enabled ?? true) && Boolean(id);

  return useQuery({
    queryKey: invoiceBulkDownloadKeys.detail(id ?? ""),
    queryFn: () => invoiceBulkDownloadApi.getById(id!),
    enabled,
    staleTime: 2_000,
    refetchInterval: enabled
      ? devRefetchIntervalFn(
          (query: Query<InvoiceBulkDownloadJob, Error>) => {
            const job = query.state.data;
            if (!job) return STATUS_POLL_MS;
            if (isInvoiceBulkDownloadActive(job.status)) return STATUS_POLL_MS;
            return false;
          },
        )
      : false,
  });
}

/** Invalida campana cuando el job deja de estar activo. */
export function invalidateNotificationsAfterBulkDownloadTerminal(
  queryClient: ReturnType<typeof useQueryClient>,
  previousStatus: string | undefined,
  next: InvoiceBulkDownloadJob | undefined,
): void {
  if (!next) return;
  const wasActive =
    previousStatus === "queued" || previousStatus === "processing";
  const isTerminal = !isInvoiceBulkDownloadActive(next.status);
  if (wasActive && isTerminal) {
    invalidateNotificationsQueries(queryClient);
  }
}

export function useMyInvoiceBulkDownloads(
  limit = 5,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: invoiceBulkDownloadKeys.list(limit),
    queryFn: () => invoiceBulkDownloadApi.listMine(limit),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}

export function useDownloadInvoiceBulkDownloadPart(
  options?: Omit<
    UseMutationOptions<
      void,
      Error,
      { id: string; part: number; fileName?: string }
    >,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({ id, part, fileName }) =>
      invoiceBulkDownloadApi.downloadPart(id, part, fileName),
    ...options,
  });
}

export type { InvoiceBulkDownloadPreview };
