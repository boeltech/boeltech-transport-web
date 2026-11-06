import { useQuery } from "@tanstack/react-query";
import { financeApi } from "@features/finance/infrastructure";
import { financeQueryKeys } from "../financeQueryKeys";

/**
 * Conteo de la relación de pendientes de un RFC.
 * No se monta en la página: el sheet lo habilita al abrirse.
 */
export function usePendingRelationCount(clientRfc: string, enabled: boolean) {
  const rfc = clientRfc.trim().toUpperCase();
  return useQuery({
    queryKey: financeQueryKeys.pendingRelationCount(rfc),
    queryFn: () => financeApi.getPendingRelationCount(rfc),
    enabled: enabled && clientRfc.trim().length > 0,
  });
}
