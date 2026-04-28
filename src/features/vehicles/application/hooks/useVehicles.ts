/**
 * Vehicle React Query Hooks
 * Clean Architecture - Application Layer
 *
 * Hooks de React Query para el módulo de vehículos.
 * Conecta la UI con la infraestructura (vehiclesApi).
 *
 * Ubicación: src/features/vehicles/application/hooks/useVehicles.ts
 *
 * REGLA: Los hooks solo orquestan queries/mutations.
 *        La lógica de negocio vive en el dominio.
 *        La comunicación HTTP vive en infraestructura.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { vehiclesApi } from "../../infrastructure";
import {
  vehicleQueryKeys,
  VehicleStatus,
  type VehicleQueryParams,
  type VehicleStatusType,
  type VehicleListItem,
  type Vehicle,
  type AssignableVehicleItem,
  type CreateVehiclePayload,
  type UpdateVehiclePayload,
} from "@features/vehicles/domain";

// ============================================================================
// MUTATION CALLBACKS
// ============================================================================

interface MutationCallbacks<TData = unknown, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook para obtener lista de vehículos con filtros y paginación
 */
export const useVehicles = (params?: VehicleQueryParams) => {
  return useQuery({
    queryKey: vehicleQueryKeys.list(params),
    queryFn: () => vehiclesApi.getAll(params),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook para obtener el detalle de un vehículo
 *
 * @param id - ID del vehículo
 * @param options - Opciones adicionales de React Query (ej: enabled)
 *
 * @example
 * // Uso básico
 * const { data: vehicle } = useVehicle(vehicleId);
 *
 * @example
 * // Con enabled condicional (útil en formularios)
 * const { data: vehicleDetail, isLoading } = useVehicle(selectedVehicleId, {
 *   enabled: !!selectedVehicleId,
 * });
 */
export const useVehicle = (
  id: string,
  options?: Omit<UseQueryOptions<Vehicle, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: vehicleQueryKeys.detail(id),
    queryFn: async () => {
      const result = await vehiclesApi.getById(id);
      if (!result.data) {
        throw new Error(result.message ?? "No se encontró el vehículo");
      }
      return result.data;
    },
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 30_000,
    ...options,
  });
};

/**
 * Hook para obtener vehículos clasificados por asignabilidad.
 * Retorna TODOS los vehículos activos + disponibles, clasificados como
 * asignables o bloqueados (seguro vencido, permiso SCT vencido).
 *
 * Los bloqueados se muestran en el select pero deshabilitados con la razón.
 *
 * Consumido por: TripForm (select de vehículo al crear/editar viaje)
 */
export function useAssignableVehicles(
  options?: Omit<
    UseQueryOptions<AssignableVehicleItem[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: vehicleQueryKeys.assignable(),
    queryFn: async (): Promise<AssignableVehicleItem[]> => {
      // Reutiliza GET /vehicles con filtros
      const result = await vehiclesApi.getAll({
        filters: {
          status: VehicleStatus.AVAILABLE,
          isActive: true,
        },
        limit: 100, // Traer todos los disponibles
      });
      return result.data.map(classifyVehicleForAssignment);
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
    ...options,
  });
}

// ============================================================================
// ASSIGNABILITY CLASSIFIER
// ============================================================================

/**
 * Clasifica un vehículo como asignable o bloqueado.
 * Reglas de negocio evaluadas en frontend (complemento al backend):
 * - Seguro vencido → bloqueado
 * - Permiso SCT vencido → bloqueado
 */
function classifyVehicleForAssignment(
  vehicle: VehicleListItem,
): AssignableVehicleItem {
  // Seguro vencido
  if (
    vehicle.insuranceExpiry &&
    new Date(vehicle.insuranceExpiry) < new Date()
  ) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Seguro vencido",
    };
  }

  // Permiso SCT vencido
  if (
    vehicle.sctPermitExpiry &&
    new Date(vehicle.sctPermitExpiry) < new Date()
  ) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Permiso SCT vencido",
    };
  }

  return { ...vehicle, canBeAssigned: true };
}

// ============================================================================
// MUTATIONS
// ============================================================================

export const useCreateVehicle = (
  callbacks?: MutationCallbacks<{ id: string; unitNumber: string }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVehiclePayload) => vehiclesApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vehicleQueryKeys.assignable(),
      });
      callbacks?.onSuccess?.(data.data);
    },
    onError: (error: Error) => {
      callbacks?.onError?.(error);
    },
  });
};

export const useUpdateVehicle = (callbacks?: MutationCallbacks) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVehiclePayload }) =>
      vehiclesApi.update(id, data),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vehicleQueryKeys.detail(vehicle.data.id),
      });
      queryClient.invalidateQueries({
        queryKey: vehicleQueryKeys.assignable(),
      });
      callbacks?.onSuccess?.(vehicle);
    },
    onError: (error: Error) => {
      callbacks?.onError?.(error);
    },
  });
};

export const useUpdateVehicleStatus = (callbacks?: MutationCallbacks) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: VehicleStatusType }) =>
      vehiclesApi.updateStatus(id, status),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vehicleQueryKeys.detail(vehicle.data.id),
      });
      queryClient.invalidateQueries({
        queryKey: vehicleQueryKeys.assignable(),
      });
      callbacks?.onSuccess?.(vehicle);
    },
    onError: (error: Error) => {
      callbacks?.onError?.(error);
    },
  });
};

export const useDeleteVehicle = (callbacks?: MutationCallbacks<void>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vehiclesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vehicleQueryKeys.assignable(),
      });
      callbacks?.onSuccess?.(undefined);
    },
    onError: (error: Error) => {
      callbacks?.onError?.(error);
    },
  });
};
