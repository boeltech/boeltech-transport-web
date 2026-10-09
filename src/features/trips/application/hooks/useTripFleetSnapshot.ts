/**
 * Datos para Carta Porte del viaje: lectura y «Refrescar desde el catálogo».
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { invoiceQueryKeys } from "@features/invoicing/application";
import {
  tripQueryKeys,
  type RefreshTripFleetSnapshotInput,
  type RefreshTripFleetSnapshotResult,
  type TripFleetSnapshotView,
} from "@features/trips/domain";
import { tripFleetSnapshotApi } from "@features/trips/infrastructure/tripFleetSnapshotApi";

export type RefreshTripFleetSnapshotOutcome = RefreshTripFleetSnapshotResult & {
  /** GET re-consultado tras el refresco; `null` si no se pudo leer. */
  view: TripFleetSnapshotView | null;
};

export function useTripFleetSnapshot(
  tripId: string,
  options?: Omit<UseQueryOptions<TripFleetSnapshotView>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: tripQueryKeys.fleetSnapshot(tripId),
    queryFn: () => tripFleetSnapshotApi.get(tripId),
    staleTime: 30_000,
    ...options,
    enabled: Boolean(tripId) && (options?.enabled ?? true),
  });
}

export function useRefreshTripFleetSnapshot(
  tripId: string,
  options?: Omit<
    UseMutationOptions<
      RefreshTripFleetSnapshotOutcome,
      Error,
      RefreshTripFleetSnapshotInput
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RefreshTripFleetSnapshotInput) => {
      const result = await tripFleetSnapshotApi.refresh(tripId, input);
      const view = await tripFleetSnapshotApi.get(tripId).catch(() => null);
      return { ...result, view };
    },
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      const snapshotKey = tripQueryKeys.fleetSnapshot(tripId);
      if (data.view) {
        queryClient.setQueryData(snapshotKey, data.view);
      }
      await Promise.all([
        data.view
          ? Promise.resolve()
          : queryClient.invalidateQueries({ queryKey: snapshotKey }),
        queryClient.invalidateQueries({
          queryKey: tripQueryKeys.detail(tripId),
          exact: true,
        }),
        queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.details() }),
      ]);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
