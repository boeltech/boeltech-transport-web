import { useQuery } from "@tanstack/react-query";
import { clientHistoryRepository } from "../../infrastructure";
import { clientQueryKeys, type ClientByChannel } from "../../domain";

export function useClientByChannel(
  clientId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery<ClientByChannel, Error>({
    queryKey: clientQueryKeys.byChannel(clientId ?? ""),
    queryFn: () => clientHistoryRepository.getByChannel(clientId!),
    enabled: (options?.enabled ?? true) && !!clientId,
    staleTime: 30_000,
  });
}
