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
  type TestPacConnectionPayload,
  type TestPacConnectionResult,
  type RegisterPacEmitterResult,
  settingsQueryKeys,
} from "../../domain";
import { settingsRepository } from "../../infrastructure";
import { billingSettingsCopy } from "../../presentation/copy/billingSettingsCopy";

const copy = billingSettingsCopy.toast;

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
        title: copy.saved,
        description: result.message ?? copy.savedDescription,
      });
    },
    onError: (error) => {
      toast({
        title: copy.saveError,
        description: error.message ?? copy.saveErrorDescription,
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
        title: copy.certificateUploaded,
        description: result.message ?? copy.certificateUploadedDescription,
      });
    },
    onError: (error) => {
      toast({
        title: copy.certificateError,
        description: error.message ?? copy.certificateErrorDescription,
        variant: "destructive",
      });
    },
    ...options,
  });
}

/**
 * Hook para probar conexión con el PAC — stateless.
 *
 * Acepta un payload opcional con el provider del formulario (sin persistir).
 * Ramifica el toast según `errorType` para mensajes contextuales.
 */
export function useTestPacConnection(
  options?: Omit<
    UseMutationOptions<
      TestPacConnectionResult,
      Error,
      TestPacConnectionPayload | undefined
    >,
    "mutationFn"
  >,
) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload?: TestPacConnectionPayload) =>
      settingsRepository.testPacConnection(payload),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: copy.connectionOk,
          description: result.message ?? copy.connectionOkDescription,
        });
      } else if (result.errorType === "not_implemented") {
        toast({
          title: copy.connectionUnavailable,
          description: result.message,
        });
      } else {
        toast({
          title: copy.connectionFailed,
          description: result.message ?? copy.connectionFailedDescription,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: copy.connectionError,
        description: error.message ?? copy.connectionFailedDescription,
        variant: "destructive",
      });
    },
    ...options,
  });
}

/**
 * Hook para reintentar registro de emisor en ProFact con la configuración
 * persistida del tenant (RFC + CSD + PAC).
 */
export function useRegisterPacEmitter(
  options?: Omit<
    UseMutationOptions<RegisterPacEmitterResult, Error, void>,
    "mutationFn"
  >,
) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => settingsRepository.registerPacEmitter(),
    onSuccess: (result) => {
      if (result.success) {
        toast({ title: copy.emitterOk, description: result.message });
        return;
      }

      toast({
        title: copy.emitterFailed,
        // El detalle de lo que falta se enumera en la pantalla, junto a la acción.
        description: result.message,
        variant: result.attempted ? "destructive" : "default",
      });
    },
    onError: (error) => {
      toast({
        title: copy.emitterError,
        description: error.message ?? copy.emitterErrorDescription,
        variant: "destructive",
      });
    },
    ...options,
  });
}
