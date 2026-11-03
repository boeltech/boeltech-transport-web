/**
 * Listado tipado del workbench Envíos (GET /invoices/dispatch-documents).
 */

import { useQuery } from "@tanstack/react-query";
import type { DispatchDocumentsFilters } from "@features/invoicing/domain";
import { invoicingApi } from "@features/invoicing/infrastructure";
import { invoiceQueryKeys } from "../invoiceQueryKeys";

export function useDispatchDocuments(
  filters: DispatchDocumentsFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: invoiceQueryKeys.dispatchDocumentsList(filters),
    queryFn: () => invoicingApi.listDispatchDocuments(filters),
    enabled,
    placeholderData: (previous) => previous,
  });
}
