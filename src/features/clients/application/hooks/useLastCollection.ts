import { useQuery } from "@tanstack/react-query";
import { clientHistoryRepository } from "../../infrastructure";
import { clientQueryKeys, type LastCollection } from "../../domain";

export function useLastCollection(
  clientId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery<LastCollection | null, Error>({
    queryKey: clientQueryKeys.lastCollection(clientId ?? ""),
    queryFn: () => clientHistoryRepository.getLastCollection(clientId!),
    enabled: (options?.enabled ?? true) && !!clientId,
    staleTime: 30_000,
  });
}
