/**
 * useBillingSettings Hook
 * Clean Architecture - Application Layer
 *
 * Hook para obtener y actualizar la configuración de facturación.
 *
 * Ubicación: src/features/settings/application/hooks/useBillingSettings.ts
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useToast } from "@shared/hooks/useToast";
import {
  type BillingSettings,
  type UpdateBillingSettingsDTO,
  type UploadCertificateDTO,
  type SettingsResult,
  settingsQueryKeys,
} from "../../domain";
import { settingsRepository } from "../../infrastructure";

// ============================================================================
// QUERY HOOK
// ============================================================================

/**
 * Hook para obtener la configuración de facturación
 */
export function useBillingSettings(
  options?: Omit<
    UseQueryOptions<BillingSettings, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: settingsQueryKeys.billing(),
    queryFn: () => settingsRepository.getBillingSettings(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook para actualizar la configuración de facturación
 */
export function useUpdateBillingSettings(
  options?: Omit<
    UseMutationOptions<
      SettingsResult<BillingSettings>,
      Error,
      UpdateBillingSettingsDTO
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateBillingSettingsDTO) =>
      settingsRepository.updateBillingSettings(data),
    onSuccess: (result) => {
      queryClient.setQueryData(settingsQueryKeys.billing(), result.data);

      toast({
        title: "Configuración de facturación actualizada",
        description:
          result.message ?? "Los cambios se guardaron correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al guardar",
        description: error.message ?? "No se pudo actualizar la configuración.",
        variant: "destructive",
      });
    },
    ...options,
  });
}

/**
 * Hook para subir certificado de sello digital
 */
export function useUploadCertificate(
  options?: Omit<
    UseMutationOptions<
      SettingsResult<BillingSettings>,
      Error,
      UploadCertificateDTO
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UploadCertificateDTO) =>
      settingsRepository.uploadCertificate(data),
    onSuccess: (result) => {
      queryClient.setQueryData(settingsQueryKeys.billing(), result.data);

      toast({
        title: "Certificado cargado",
        description:
          result.message ??
          "El certificado de sello digital se configuró correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al cargar certificado",
        description: error.message ?? "No se pudo cargar el certificado.",
        variant: "destructive",
      });
    },
    ...options,
  });
}

/**
 * Hook para probar conexión con el PAC
 */
export function useTestPacConnection(
  options?: Omit<
    UseMutationOptions<{ success: boolean; message: string }, Error, void>,
    "mutationFn"
  >,
) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => settingsRepository.testPacConnection(),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: "Conexión exitosa",
          description:
            result.message ?? "La conexión con el PAC funciona correctamente.",
        });
      } else {
        toast({
          title: "Conexión fallida",
          description: result.message ?? "No se pudo conectar con el PAC.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error de conexión",
        description: error.message ?? "No se pudo probar la conexión.",
        variant: "destructive",
      });
    },
    ...options,
  });
}
