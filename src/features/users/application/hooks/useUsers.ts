import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userQueryKeys, type UserQueryParams } from "../../domain";
import type {
  CreateUserDTO,
  UpdateUserDTO,
  UpdateUserStatusDTO,
} from "../../domain";
import { usersApi } from "../../infrastructure";

interface MutationCallbacks<TData = unknown, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export const useUsers = (params?: UserQueryParams) =>
  useQuery({
    queryKey: userQueryKeys.list(params),
    queryFn: () => usersApi.getAll(params),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

export const useUser = (id: string) =>
  useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: async () => {
      const response = await usersApi.getById(id);
      if (!response.data) {
        throw new Error("No se encontró el usuario");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

export const useCreateUser = (
  callbacks?: MutationCallbacks<{ id: string; fullName: string }>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserDTO) => usersApi.create(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.activityRoot(result.data.id) });
      callbacks?.onSuccess?.({
        id: result.data.id,
        fullName: `${result.data.firstName} ${result.data.lastName}`.trim(),
      });
    },
    onError: (error: Error) => callbacks?.onError?.(error),
  });
};

export const useUpdateUser = (callbacks?: MutationCallbacks) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDTO }) =>
      usersApi.update(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(result.data.id) });
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.activityRoot(variables.id) });
      callbacks?.onSuccess?.(result);
    },
    onError: (error: Error) => callbacks?.onError?.(error),
  });
};

export const useUpdateUserStatus = (callbacks?: MutationCallbacks) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserStatusDTO }) =>
      usersApi.updateStatus(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.detail(result.data.id) });
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.activityRoot(variables.id) });
      callbacks?.onSuccess?.(result);
    },
    onError: (error: Error) => callbacks?.onError?.(error),
  });
};
