import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import { DEFAULT_VOBO_THRESHOLD_MXN } from "../../domain/enums";
import type { TenantSettlementSettings } from "../../domain/entities";

const SETTINGS_OFF: TenantSettlementSettings = {
  pagosOperadoresGreenfieldV1: false,
  voboThresholdMxn: DEFAULT_VOBO_THRESHOLD_MXN,
};

export function useSettlementSettings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: settlementsQueryKeys.settings(),
    queryFn: async () => {
      try {
        return await settlementsApi.getSettings();
      } catch {
        return SETTINGS_OFF;
      }
    },
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
 * Tenant flag `pagos_operadores_greenfield_v1`. Missing/error = OFF (as-is ADR-0085–0089).
 */
export function usePagosOperadoresGreenfield() {
  const query = useSettlementSettings();
  const enabled = query.data?.pagosOperadoresGreenfieldV1 === true;
  const thresholdMxn = query.data?.voboThresholdMxn ?? DEFAULT_VOBO_THRESHOLD_MXN;

  return {
    enabled,
    thresholdMxn,
    isLoading: query.isLoading,
    isError: query.isError,
    settings: query.data,
  };
}
