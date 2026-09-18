import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import type { TenantSettlementSettings } from "../../domain/entities";

/**
 * Settings de liquidaciones: umbral VoBo + conteos live D3′ (F17a).
 * Las acciones de dinero no esperan esta query para no-makers — el API es la autoridad.
 * Para makers, los conteos habilitan Autorizar / Registrar pago cuando === 1.
 */
export function useSettlementSettings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: settlementsQueryKeys.settings(),
    queryFn: () => settlementsApi.getSettings(),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    retry: false,
  });
}

export function useUpdateSettlementSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { voboThresholdMxn?: number }) =>
      settlementsApi.updateSettings(payload),
    onSuccess: (data: TenantSettlementSettings) => {
      queryClient.setQueryData(settlementsQueryKeys.settings(), data);
    },
  });
}
