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
import { isVehicleStartableStatus } from "@boeltech/cfdi-domain/reglas/trip-resource-sync";
import { validateVehicleForCartaPorteStamp } from "@boeltech/cfdi-domain";
import { invalidateNotificationsQueries } from "@features/notifications/application/invalidateNotificationsQueries";
import { vehiclesApi } from "../../infrastructure";
import {
  vehicleQueryKeys,
  VEHICLE_STATUS_LABELS,
  type VehicleQueryParams,
  type VehicleStatusType,
  type VehicleListItem,
  type Vehicle,
  type AssignableVehicleItem,
  type CreateVehiclePayload,
  type UpdateVehiclePayload,
} from "@features/vehicles/domain";
import { isExpired } from "@shared/utils/dateUtils";

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
 * asignables o bloqueados (documentación faltante/incompleta o vencida).
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
          isActive: true,
        },
        limit: 100,
      });
      return result.data.map(classifyVehicleForAssignment);
    },
    staleTime: 30_000,
    refetchOnMount: true,
    ...options,
  });
}

// ============================================================================
// ASSIGNABILITY CLASSIFIER
// ============================================================================

/**
 * Clasifica un vehículo como asignable o bloqueado.
 * Reglas en frontend (complemento al backend):
 * - Seguro / SCT sin registrar o incompleto → bloqueado
 * - Seguro / SCT vencido → bloqueado
 * Si el listado no trae póliza o número SCT pero sí vigencia, no se bloquea solo por ese campo
 * (compatibilidad con APIs que omiten esos campos en GET /vehicles).
 */
function hasDocText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function classifyVehicleForAssignment(
  vehicle: VehicleListItem,
): AssignableVehicleItem {
  if (!isVehicleStartableStatus(vehicle.status)) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: VEHICLE_STATUS_LABELS[vehicle.status] ?? "No disponible",
    };
  }

  const hasInsurancePolicy = hasDocText(vehicle.insurancePolicy);
  const hasInsuranceExpiry = hasDocText(vehicle.insuranceExpiry);
  const hasSctNumber = hasDocText(vehicle.sctPermitNumber);
  const hasSctExpiry = hasDocText(vehicle.sctPermitExpiry);

  // ── Seguro ─────────────────────────────────────────────────────────────
  if (!hasInsurancePolicy && !hasInsuranceExpiry) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Seguro no registrado",
    };
  }

  if (hasInsuranceExpiry && isExpired(vehicle.insuranceExpiry)) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Seguro vencido",
      expiredDocsOverridable: true,
    };
  }

  if (hasInsurancePolicy && !hasInsuranceExpiry) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Sin vigencia de seguro",
    };
  }

  // Vigencia sin póliza en listado: se permite (API puede omitir `insurance_policy`).

  // ── Permiso SCT ─────────────────────────────────────────────────────────
  if (!hasSctNumber && !hasSctExpiry) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Permiso SCT no registrado",
    };
  }

  if (hasSctExpiry && isExpired(vehicle.sctPermitExpiry)) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Permiso SCT vencido",
      expiredDocsOverridable: true,
    };
  }

  if (hasSctNumber && !hasSctExpiry) {
    return {
      ...vehicle,
      canBeAssigned: false,
      blockReason: "Sin vigencia de permiso SCT",
    };
  }

  // Vigencia sin número en listado: se permite (API puede omitir `sct_permit_number`).

  // ── Autotransporte CP stamp-ready (SoT paquete; remolques = viaje ADR-0077) ─
  const stampResult = validateVehicleForCartaPorteStamp({
    tripId: vehicle.id,
    sat_tipo_permiso_code: vehicle.satTipoPermisoCode,
    sct_permit_number: vehicle.sctPermitNumber,
    sat_config_autotransporte_code: vehicle.satConfigAutotransporteCode,
    license_plate: vehicle.licensePlate,
    insurance_company: vehicle.insuranceCompany,
    insurance_policy: vehicle.insurancePolicy,
    peso_bruto_vehicular: vehicle.pesoBrutoVehicular,
    year: vehicle.year,
    // Remolques se validan en la asignación al viaje, no en el maestro.
    remolques: [],
  });

  if (!stampResult.ok) {
    const REMOLQUE_CODES = new Set([
      "CP31_REMOLQUES_REQUIRED",
      "CP31_REMOLQUE_POSITION_INVALID",
      "CP31_REMOLQUE_SUBTIPO_REQUIRED",
      "CP31_REMOLQUE_PLATE_INVALID",
      "CP31_REMOLQUES_LIMIT_EXCEEDED",
      "CP31_REMOLQUES_POSITION_DUPLICATE",
    ]);
    const nonRemolqueErrors = stampResult.error.filter(
      (e) => !REMOLQUE_CODES.has(e.code),
    );
    if (nonRemolqueErrors.length > 0) {
      const first = nonRemolqueErrors[0];
      return {
        ...vehicle,
        canBeAssigned: false,
        blockReason:
          first?.message ??
          "Datos Autotransporte incompletos para Carta Porte 3.1",
      };
    }
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
      invalidateNotificationsQueries(queryClient);
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
