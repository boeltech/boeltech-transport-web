import { useQuery } from "@tanstack/react-query";
import { fleetDocumentsApi } from "../../infrastructure";
import {
  fleetDocumentsQueryKeys,
  type DocumentExpiryQueryParams,
} from "../../domain";

export function useDocumentExpiries(params?: DocumentExpiryQueryParams) {
  return useQuery({
    queryKey: fleetDocumentsQueryKeys.list(params),
    queryFn: () => fleetDocumentsApi.list(params),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
