/**
 * useCompanySettings Hook
 * Clean Architecture - Application Layer
 *
 * Hook para obtener y actualizar la configuración de la empresa.
 *
 * Ubicación: src/features/settings/application/hooks/useCompanySettings.ts
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
  type CompanySettings,
  type UpdateCompanySettingsDTO,
  type SettingsResult,
  type UploadLogoResult,
  settingsQueryKeys,
} from "../../domain";
import { settingsRepository } from "../../infrastructure";

// ============================================================================
// QUERY HOOK
// ============================================================================

/**
 * Hook para obtener la configuración de la empresa
 */
export function useCompanySettings(
  options?: Omit<
    UseQueryOptions<CompanySettings, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: settingsQueryKeys.company(),
    queryFn: () => settingsRepository.getCompanySettings(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos en cache
    ...options,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook para actualizar la configuración de la empresa
 */
export function useUpdateCompanySettings(
  options?: Omit<
    UseMutationOptions<
      SettingsResult<CompanySettings>,
      Error,
      UpdateCompanySettingsDTO
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateCompanySettingsDTO) =>
      settingsRepository.updateCompanySettings(data),
    onSuccess: (result) => {
      // Actualizar cache inmediatamente
      queryClient.setQueryData(settingsQueryKeys.company(), result.data);

      toast({
        title: "Configuración actualizada",
        description:
          result.message ??
          "Los datos de la empresa y el domicilio fiscal se guardaron correctamente.",
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
 * Hook para subir el logo de la empresa
 */
export function useUploadLogo(
  options?: Omit<
    UseMutationOptions<UploadLogoResult, Error, File>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (file: File) => settingsRepository.uploadLogo(file),
    onSuccess: (result) => {
      // Invalidar para recargar con el nuevo logo
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.company() });

      toast({
        title: "Logo actualizado",
        description: result.message ?? "El logo se subió correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al subir logo",
        description: error.message ?? "No se pudo subir el logo.",
        variant: "destructive",
      });
    },
    ...options,
  });
}

/**
 * Hook para eliminar el logo de la empresa
 */
export function useDeleteLogo(
  options?: Omit<UseMutationOptions<void, Error, void>, "mutationFn">,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => settingsRepository.deleteLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.company() });

      toast({
        title: "Logo eliminado",
        description: "El logo se eliminó correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar logo",
        description: error.message ?? "No se pudo eliminar el logo.",
        variant: "destructive",
      });
    },
    ...options,
  });
}
