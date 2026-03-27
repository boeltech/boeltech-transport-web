/**
 * useNotificationSettings Hook
 * Clean Architecture - Application Layer
 *
 * Hook para obtener y actualizar las preferencias de notificaciones.
 *
 * Ubicación: src/features/settings/application/hooks/useNotificationSettings.ts
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
  type NotificationSettings,
  type UpdateNotificationSettingsDTO,
  type SettingsResult,
  settingsQueryKeys,
} from "../../domain";
import { settingsRepository } from "../../infrastructure";

// ============================================================================
// QUERY HOOK
// ============================================================================

/**
 * Hook para obtener las preferencias de notificaciones
 */
export function useNotificationSettings(
  options?: Omit<
    UseQueryOptions<NotificationSettings, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: settingsQueryKeys.notifications(),
    queryFn: () => settingsRepository.getNotificationSettings(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook para actualizar las preferencias de notificaciones
 */
export function useUpdateNotificationSettings(
  options?: Omit<
    UseMutationOptions<
      SettingsResult<NotificationSettings>,
      Error,
      UpdateNotificationSettingsDTO
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: UpdateNotificationSettingsDTO) =>
      settingsRepository.updateNotificationSettings(data),
    onSuccess: (result) => {
      queryClient.setQueryData(settingsQueryKeys.notifications(), result.data);

      toast({
        title: "Preferencias actualizadas",
        description:
          result.message ??
          "Las preferencias de notificaciones se guardaron correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error al guardar",
        description:
          error.message ?? "No se pudieron actualizar las preferencias.",
        variant: "destructive",
      });
    },
    ...options,
  });
}
