import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import { DEFAULT_VOBO_THRESHOLD_MXN } from "../../domain/enums";
import type { TenantSettlementSettings } from "../../domain/entities";

export function useSettlementSettings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: settlementsQueryKeys.settings(),
    // Sin fallback silencioso: un fallo debe llegar como isError para que las
    // acciones de dinero se bloqueen en vez de asumir el camino as-is.
    queryFn: () => settlementsApi.getSettings(),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    retry: false,
  });
}

export function useUpdateSettlementSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      voboThresholdMxn?: number;
      pagosOperadoresGreenfieldV1?: boolean;
    }) => settlementsApi.updateSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(settlementsQueryKeys.settings(), data);
    },
  });
}

/**
 * Tenant flag `pagos_operadores_greenfield_v1`.
 *
 * `enabled` solo describe la configuración ya cargada. Mientras `isReady` sea
 * false no se conoce la política del tenant, así que quien dispare dinero
 * (dispersar, pedir VoBo, crear anticipo) debe esperar en lugar de asumir OFF.
 */
export function usePagosOperadoresGreenfield() {
  const query = useSettlementSettings();
  const settings: TenantSettlementSettings | undefined = query.data;

  return {
    enabled: settings?.pagosOperadoresGreenfieldV1 === true,
    thresholdMxn: settings?.voboThresholdMxn ?? DEFAULT_VOBO_THRESHOLD_MXN,
    isReady: query.isSuccess,
    isLoading: query.isLoading,
    isError: query.isError,
    settings,
  };
}
