/**
 * Orden de viaje operativa: estado, generar/regenerar y descarga PDF.
 * No acoplar a useTripFleetSnapshot.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type GenerateTripOrderResult,
  type TripOrderStatus,
} from "@features/trips/domain";
import { tripOrderApi } from "@features/trips/infrastructure/tripOrderApi";

export function useTripOrder(
  tripId: string,
  options?: Omit<UseQueryOptions<TripOrderStatus>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: tripQueryKeys.tripOrder(tripId),
    queryFn: () => tripOrderApi.getStatus(tripId),
    staleTime: 30_000,
    ...options,
    enabled: Boolean(tripId) && (options?.enabled ?? true),
  });
}

export function useGenerateTripOrder(
  tripId: string,
  options?: Omit<
    UseMutationOptions<GenerateTripOrderResult, Error, void>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tripOrderApi.generate(tripId),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.tripOrder(tripId),
      });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useDownloadTripOrder(
  tripId: string,
  options?: Omit<
    UseMutationOptions<void, Error, string | undefined>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: (fallbackFileName?: string) =>
      tripOrderApi.downloadFile(tripId, fallbackFileName),
    ...options,
  });
}
