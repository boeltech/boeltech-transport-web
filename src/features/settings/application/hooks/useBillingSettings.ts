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
  type FinkokEmitter,
  type UpdateBillingSettingsDTO,
  type UploadCertificateDTO,
  type SettingsResult,
  type TestPacConnectionPayload,
  type TestPacConnectionResult,
  settingsQueryKeys,
} from "../../domain";
import { settingsRepository } from "../../infrastructure";
import { billingSettingsCopy } from "../../presentation/copy/billingSettingsCopy";

const copy = billingSettingsCopy.toast;

function mergeFinkokEmitterIntoBillingCache(
  queryClient: ReturnType<typeof useQueryClient>,
  emitter: FinkokEmitter,
) {
  queryClient.setQueryData<BillingSettings>(
    settingsQueryKeys.billing(),
    (prev) =>
      prev
        ? {
            ...prev,
            finkokRegistrationEnabled: emitter.registrationEnabled,
            finkokEmitter: emitter,
          }
        : prev,
  );
}

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
 * Verifica el RFC emisor ante Finkok (GET …/finkok-emitter → SOAP get).
 * Solo lectura / refresh de cache; no dispara add.
 */
export function useVerifyFinkokEmitter(
  options?: Omit<
    UseMutationOptions<FinkokEmitter, Error, void>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => settingsRepository.getFinkokEmitter(),
    onSuccess: (emitter) => {
      mergeFinkokEmitterIntoBillingCache(queryClient, emitter);
      if (emitter.status === "error") {
        toast({
          title: copy.finkokEmitterError,
          description: emitter.detail ?? copy.finkokEmitterErrorDescription,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: copy.finkokEmitterError,
        description: error.message ?? copy.finkokEmitterErrorDescription,
        variant: "destructive",
      });
    },
    ...options,
  });
}

/**
 * Registra / reintenta el RFC emisor (POST …/finkok-emitter → get→add A2).
 * Authz: admin (la página no monta el CTA para manager).
 */
export function useRegisterFinkokEmitter(
  options?: Omit<
    UseMutationOptions<SettingsResult<FinkokEmitter>, Error, void>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => settingsRepository.registerFinkokEmitter(),
    onSuccess: (result) => {
      mergeFinkokEmitterIntoBillingCache(queryClient, result.data);
      if (result.data.status === "error") {
        toast({
          title: copy.finkokEmitterError,
          description:
            result.data.detail ?? copy.finkokEmitterErrorDescription,
          variant: "destructive",
        });
      }
      // Éxito silencioso si la fila ya muestra ✓ (PRD preferencia).
    },
    onError: (error) => {
      toast({
        title: copy.finkokEmitterError,
        description: error.message ?? copy.finkokEmitterErrorDescription,
        variant: "destructive",
      });
    },
    ...options,
  });
}

