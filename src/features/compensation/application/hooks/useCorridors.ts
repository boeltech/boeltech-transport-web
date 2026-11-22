import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { compensationApi } from "../../infrastructure/compensationApi";
import { compensationQueryKeys } from "../../domain";
import { fetchAllCorridorTariffs } from "../utils/fetchAllCorridorTariffs";
import type { CreateCorridorTariffPayload } from "../../domain/entities";

/** Prefijos settlements (evitar import circular del barrel). */
const SETTLEMENTS_PREVIEW_KEY = ["settlements", "preview"] as const;
const SETTLEMENTS_CUT_PREVIEW_KEY = ["settlements", "cut-preview"] as const;
const SETTLEMENTS_WORKBENCH_KEY = ["settlements", "workbench"] as const;

function invalidateAfterCorridorChange(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: compensationQueryKeys.corridors() });
  queryClient.invalidateQueries({
    queryKey: compensationQueryKeys.corridorsDuplicateCatalog(),
  });
  queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
  // Comp→Set: montos corridor_match afectan preview, cut-preview y workbench
  queryClient.invalidateQueries({ queryKey: SETTLEMENTS_PREVIEW_KEY });
  queryClient.invalidateQueries({ queryKey: SETTLEMENTS_CUT_PREVIEW_KEY });
  queryClient.invalidateQueries({ queryKey: SETTLEMENTS_WORKBENCH_KEY });
}

export function useCorridorTariffs(params?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: compensationQueryKeys.corridorsList(params),
    queryFn: () => compensationApi.listCorridors(params),
  });
}

export function useCorridorDuplicateCatalog() {
  return useQuery({
    queryKey: compensationQueryKeys.corridorsDuplicateCatalog(),
    queryFn: () => fetchAllCorridorTariffs(),
    staleTime: 60_000,
  });
}

export function useCreateCorridorTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCorridorTariffPayload) =>
      compensationApi.createCorridor(payload),
    onSuccess: () => invalidateAfterCorridorChange(queryClient),
  });
}

export function useUpdateCorridorTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CreateCorridorTariffPayload>;
    }) => compensationApi.updateCorridor(id, payload),
    onSuccess: () => invalidateAfterCorridorChange(queryClient),
  });
}

export function useDeleteCorridorTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => compensationApi.deleteCorridor(id),
    onSuccess: () => invalidateAfterCorridorChange(queryClient),
  });
}
