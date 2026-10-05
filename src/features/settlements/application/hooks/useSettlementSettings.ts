import { useQuery } from "@tanstack/react-query";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";

/**
 * Settings de liquidaciones (solo lectura): umbral VoBo de la regla vigente +
 * conteos live D3′ (F17a). El umbral se edita en Reglas de autorización.
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
