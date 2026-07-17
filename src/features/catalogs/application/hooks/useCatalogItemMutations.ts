import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useToast } from "@shared/hooks/useToast";
import { getErrorMessage } from "@shared/utils/errorMapper";
import {
  catalogQueryKeys,
  type CatalogItem,
  type CreateCatalogItemDTO,
  type UpdateCatalogItemDTO,
} from "../../domain";
import { catalogRepository } from "../../infrastructure";
import { catalogsCopy } from "../../presentation/copy/catalogsCopy";

function invalidateCatalogItemQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  typeCode: string,
) {
  queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
  queryClient.invalidateQueries({ queryKey: catalogQueryKeys.statistics() });
  queryClient.invalidateQueries({ queryKey: catalogQueryKeys.items(typeCode) });
  queryClient.invalidateQueries({ queryKey: catalogQueryKeys.search(typeCode) });
}

export function useCreateCatalogItem(
  options?: Omit<
    UseMutationOptions<
      { data: CatalogItem; message?: string },
      Error,
      { typeCode: string; data: CreateCatalogItemDTO }
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ typeCode, data }) => catalogRepository.create(typeCode, data),
    onSuccess: (result, variables) => {
      invalidateCatalogItemQueries(queryClient, variables.typeCode);
      toast({
        title: catalogsCopy.mutations.createSuccess,
        description: result.message,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: catalogsCopy.mutations.error,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
    ...options,
  });
}

export function useUpdateCatalogItem(
  options?: Omit<
    UseMutationOptions<
      { data: CatalogItem; message?: string },
      Error,
      { typeCode: string; code: string; data: UpdateCatalogItemDTO }
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ typeCode, code, data }) =>
      catalogRepository.update(typeCode, code, data),
    onSuccess: (result, variables) => {
      invalidateCatalogItemQueries(queryClient, variables.typeCode);
      toast({
        title: catalogsCopy.mutations.updateSuccess,
        description: result.message,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: catalogsCopy.mutations.error,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
    ...options,
  });
}

export function useDeleteCatalogItem(
  options?: Omit<
    UseMutationOptions<void, Error, { typeCode: string; code: string }>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ typeCode, code }) =>
      catalogRepository.delete(typeCode, code),
    onSuccess: (_data, variables) => {
      invalidateCatalogItemQueries(queryClient, variables.typeCode);
      toast({
        title: catalogsCopy.mutations.deleteSuccess,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: catalogsCopy.mutations.error,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
    ...options,
  });
}
