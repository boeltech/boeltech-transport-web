import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { dashboardQueryKeys } from "@features/dashboard/domain";
import { branchQueryKeys, type BranchQueryParams } from "../../domain";
import type { CreateBranchDTO, UpdateBranchDTO } from "../../domain";
import { branchesApi } from "../../infrastructure";

/** H-U01-Q01 — KPIs de sucursal en Inicio tras mutaciones de branches. */
function invalidateDashboardBranchKpis(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({
    queryKey: [...dashboardQueryKeys.all, "branch-kpis"],
  });
  void queryClient.invalidateQueries({
    queryKey: [...dashboardQueryKeys.all, "branch-kpis-trend"],
  });
}

interface MutationCallbacks<TData = unknown, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export const useBranches = (
  params?: BranchQueryParams,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: branchQueryKeys.list(params),
    queryFn: () => branchesApi.getAll(params),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled ?? true,
  });

export const useBranch = (id: string) =>
  useQuery({
    queryKey: branchQueryKeys.detail(id),
    queryFn: async () => {
      const response = await branchesApi.getById(id);
      if (!response.data) {
        throw new Error("No se encontró la sucursal");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

export const useCreateBranch = (
  callbacks?: MutationCallbacks<{ id: string; code: string; name: string }>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBranchDTO) => branchesApi.create(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.lists() });
      invalidateDashboardBranchKpis(queryClient);
      callbacks?.onSuccess?.({
        id: result.data.id,
        code: result.data.code,
        name: result.data.name,
      });
    },
    onError: (error: Error) => callbacks?.onError?.(error),
  });
};

export const useUpdateBranch = (callbacks?: MutationCallbacks) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBranchDTO }) =>
      branchesApi.update(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: branchQueryKeys.detail(result.data.id),
      });
      invalidateDashboardBranchKpis(queryClient);
      callbacks?.onSuccess?.(result);
    },
    onError: (error: Error) => callbacks?.onError?.(error),
  });
};

export const useDeleteBranch = (callbacks?: MutationCallbacks<void>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.lists() });
      invalidateDashboardBranchKpis(queryClient);
      callbacks?.onSuccess?.(undefined);
    },
    onError: (error: Error) => callbacks?.onError?.(error),
  });
};

export const useRestoreBranch = (callbacks?: MutationCallbacks<{ id: string }>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchesApi.restore(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: branchQueryKeys.detail(result.data.id),
      });
      invalidateDashboardBranchKpis(queryClient);
      callbacks?.onSuccess?.({ id: result.data.id });
    },
    onError: (error: Error) => callbacks?.onError?.(error),
  });
};
