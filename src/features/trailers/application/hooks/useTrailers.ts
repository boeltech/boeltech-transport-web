/**
 * Trailer React Query hooks (ADR-0077)
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { trailersApi } from "../../infrastructure";
import {
  TRAILER_STATUS_LABELS,
  TrailerStatus,
  trailerQueryKeys,
  type AssignableTrailerItem,
  type CreateTrailerPayload,
  type Trailer,
  type TrailerListItem,
  type TrailerQueryParams,
  type TrailerStatusType,
  type UpdateTrailerPayload,
} from "../../domain";

interface MutationCallbacks<TData = unknown, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export function classifyTrailerForAssignment(
  trailer: TrailerListItem,
): AssignableTrailerItem {
  if (!trailer.isActive) {
    return {
      ...trailer,
      canBeAssigned: false,
      blockReason: "Remolque inactivo",
    };
  }
  if (trailer.status === TrailerStatus.OUT_OF_SERVICE) {
    return {
      ...trailer,
      canBeAssigned: false,
      blockReason: "Fuera de servicio",
    };
  }
  if (
    trailer.status === TrailerStatus.ON_TRIP ||
    trailer.status === TrailerStatus.RESERVED
  ) {
    // Paridad con unidad/conductor: scheduled/in_progress deja el maestro en
    // reserved/on_trip. Soft overlap (ADR-0077) sigue en el API por fechas;
    // en UI no se ofrece como libre.
    return {
      ...trailer,
      canBeAssigned: false,
      blockReason: TRAILER_STATUS_LABELS[trailer.status],
    };
  }
  return { ...trailer, canBeAssigned: true };
}

export const useTrailers = (params?: TrailerQueryParams) => {
  return useQuery({
    queryKey: trailerQueryKeys.list(params),
    queryFn: () => trailersApi.getAll(params),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
};

export const useTrailer = (
  id: string,
  options?: Omit<
    UseQueryOptions<Trailer, Error, Trailer>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: trailerQueryKeys.detail(id),
    queryFn: async () => {
      const result = await trailersApi.getById(id);
      return result.data;
    },
    enabled: !!id && (options?.enabled ?? true),
    ...options,
  });
};

export const useAssignableTrailers = (options?: {
  refetchOnMount?: boolean | "always";
}) => {
  return useQuery({
    queryKey: trailerQueryKeys.assignable(),
    queryFn: async () => {
      const result = await trailersApi.getAll({
        page: 1,
        limit: 100,
        filters: { isActive: true },
        sort: { field: "license_plate", direction: "asc" },
      });
      return result.data.map(classifyTrailerForAssignment);
    },
    staleTime: 30_000,
    refetchOnMount: options?.refetchOnMount,
  });
};

export const useCreateTrailer = (
  callbacks?: MutationCallbacks<{ id: string; licensePlate: string }>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTrailerPayload) =>
      trailersApi.create(payload).then((r) => r.data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: trailerQueryKeys.all });
      callbacks?.onSuccess?.(data);
    },
    onError: callbacks?.onError,
  });
};

export const useUpdateTrailer = (
  callbacks?: MutationCallbacks<Trailer>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTrailerPayload;
    }) => trailersApi.update(id, data).then((r) => r.data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: trailerQueryKeys.all });
      callbacks?.onSuccess?.(data);
    },
    onError: callbacks?.onError,
  });
};

export const useUpdateTrailerStatus = (
  callbacks?: MutationCallbacks<Trailer>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: TrailerStatusType;
    }) => trailersApi.updateStatus(id, status).then((r) => r.data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: trailerQueryKeys.all });
      callbacks?.onSuccess?.(data);
    },
    onError: callbacks?.onError,
  });
};

export const useDeleteTrailer = (callbacks?: MutationCallbacks<null>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await trailersApi.delete(id);
      return null;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: trailerQueryKeys.all });
      callbacks?.onSuccess?.(data);
    },
    onError: callbacks?.onError,
  });
};
