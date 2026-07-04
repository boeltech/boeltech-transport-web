import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { searchAddresses } from "./addressSearchApi";
import {
  addressSearchQueryKeys,
  type AddressSearchPage,
  type AddressSearchParams,
} from "./types";

const MIN_QUERY_LENGTH = 2;

export interface UseAddressSearchOptions
  extends Omit<
    UseQueryOptions<AddressSearchPage, Error>,
    "queryKey" | "queryFn"
  > {
  params: AddressSearchParams;
  /** When false, skips the fetch (e.g. popover closed). */
  enabled?: boolean;
}

export function isAddressSearchQueryReady(q: string | undefined): boolean {
  return (q?.trim().length ?? 0) >= MIN_QUERY_LENGTH;
}

export function useAddressSearch({
  params,
  enabled = true,
  staleTime = 30_000,
  ...options
}: UseAddressSearchOptions) {
  const queryReady = isAddressSearchQueryReady(params.q);

  return useQuery({
    queryKey: addressSearchQueryKeys.search(params),
    queryFn: () => searchAddresses(params),
    enabled: enabled && queryReady,
    staleTime,
    placeholderData: keepPreviousData,
    ...options,
  });
}
