import type { InvoiceBulkDownloadCriteria } from "./invoiceBulkDownload.types";

export const invoiceBulkDownloadKeys = {
  all: ["invoice-bulk-downloads"] as const,
  lists: () => [...invoiceBulkDownloadKeys.all, "list"] as const,
  list: (limit: number) =>
    [...invoiceBulkDownloadKeys.lists(), { limit }] as const,
  details: () => [...invoiceBulkDownloadKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceBulkDownloadKeys.details(), id] as const,
  previews: () => [...invoiceBulkDownloadKeys.all, "preview"] as const,
  preview: (criteria: InvoiceBulkDownloadCriteria) =>
    [...invoiceBulkDownloadKeys.previews(), criteria] as const,
};
