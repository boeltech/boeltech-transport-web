import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { clientContactRepository } from "../../infrastructure";
import { clientQueryKeys, type ClientContact } from "../../domain";

export function useClientContacts(
  clientId: string | undefined,
  options?: Omit<UseQueryOptions<ClientContact[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: clientQueryKeys.contacts(clientId ?? ""),
    queryFn: () => clientContactRepository.findByClientId(clientId!),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useClientContact(
  clientId: string | undefined,
  contactId: string | undefined,
  options?: Omit<UseQueryOptions<ClientContact | null, Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: clientQueryKeys.contact(clientId ?? "", contactId ?? ""),
    queryFn: () => clientContactRepository.findById(clientId!, contactId!),
    enabled: !!clientId && !!contactId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}
