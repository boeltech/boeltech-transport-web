/**
 * useInvoiceableWorkbenchSummary — totales reales Por facturar (ADR-0090).
 * `GET /trips/invoiceable-summary` con PreStampV2 + classify en API.
 */

import { useQuery } from "@tanstack/react-query";
import { tripQueryKeys } from "@features/trips/domain";
import { tripRepository } from "@features/trips/infrastructure";

const STALE_TIME = 30_000;

export function useInvoiceableWorkbenchSummary(search?: string) {
  return useQuery({
    queryKey: tripQueryKeys.invoiceableSummary(search),
    queryFn: () => tripRepository.getInvoiceableSummary(search),
    staleTime: STALE_TIME,
  });
}
