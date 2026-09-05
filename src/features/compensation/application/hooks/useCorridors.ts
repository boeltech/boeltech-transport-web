import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { compensationApi } from "../../infrastructure/compensationApi";
import { compensationQueryKeys } from "../compensationQueryKeys";
import { fetchAllCorridorTariffs } from "../utils/fetchAllCorridorTariffs";
import type { CreateCorridorTariffPayload } from "../../domain/entities";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.corridors() });
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.corridorsDuplicateCatalog() });
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.corridors() });
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.corridorsDuplicateCatalog() });
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
    },
  });
}

export function useDeleteCorridorTariff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => compensationApi.deleteCorridor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.corridors() });
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.corridorsDuplicateCatalog() });
      queryClient.invalidateQueries({ queryKey: compensationQueryKeys.templates() });
    },
  });
}
