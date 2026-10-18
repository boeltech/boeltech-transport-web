import type { QueryClient } from "@tanstack/react-query";
import { leftRepExceptionStatus } from "@features/finance/domain";
import { financeQueryKeys } from "./financeQueryKeys";

export type RepLiveStatusSnapshot = {
  readonly paymentId: string;
  readonly repStatus: string;
};

/**
 * Detecta si algún pago del poll salió de estados excepción vs el mapa previo.
 * Actualiza `previousById` in-place (ref del tray).
 */
export function consumeRepExceptionExits(
  previousById: Map<string, string>,
  liveItems: readonly RepLiveStatusSnapshot[],
): boolean {
  let leftException = false;
  for (const item of liveItems) {
    const previous = previousById.get(item.paymentId);
    previousById.set(item.paymentId, item.repStatus);
    if (leftRepExceptionStatus(previous, item.repStatus)) {
      leftException = true;
    }
  }
  return leftException;
}

/** Prefijos KPI summary + lista del tab Excepciones REP (no cada tick del poll). */
export function invalidateRepExceptionLiveQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({
    queryKey: financeQueryKeys.openPpdSummaryRoot(),
  });
  void queryClient.invalidateQueries({
    queryKey: financeQueryKeys.repExceptionsRoot(),
  });
}
