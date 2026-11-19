/**
 * Listado trip-scoped de CFDI ingreso (GET /trips/:tripId/invoices).
 */
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  tripQueryKeys,
  type TripLinkedInvoice,
} from "@features/trips/domain";
import { tripLinkedInvoicesApi } from "@features/trips/infrastructure/tripLinkedInvoicesApi";

export function useTripLinkedInvoices(
  tripId: string,
  options?: Omit<
    UseQueryOptions<TripLinkedInvoice[]>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: tripQueryKeys.linkedInvoices(tripId),
    queryFn: () => tripLinkedInvoicesApi.list(tripId),
    staleTime: 30_000,
    ...options,
    enabled: Boolean(tripId) && (options?.enabled ?? true),
  });
}
