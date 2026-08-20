import { useQuery } from "@tanstack/react-query";
import { tripQueryKeys, type ClientCorridor } from "@features/trips/domain";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";

export function useClientCorridors(clientId: string | undefined) {
  const enabled = Boolean(clientId && clientId !== "no-client");

  return useQuery<ClientCorridor[]>({
    queryKey: tripQueryKeys.corridors(clientId ?? ""),
    queryFn: () => tripsApi.getCorridors(clientId!),
    enabled,
    staleTime: 30_000,
  });
}
