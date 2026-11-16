import type { OperationalCashReceipt } from "@features/trips/domain";

export type OperationalCashBalanceRow = {
  readonly receipt: OperationalCashReceipt;
  /** Saldo tras aplicar abonos activos hasta esta fila; null si anulado. */
  readonly balanceAfter: number | null;
};

/**
 * Ordena por `collectedAt` asc y calcula saldo después = tarifa − suma de
 * abonos activos acumulados (Q11 puente). Anulados no mueven el saldo.
 */
export function buildOperationalCashBalanceRows(
  receipts: readonly OperationalCashReceipt[],
  baseRate: number,
): OperationalCashBalanceRow[] {
  const ordered = [...receipts].sort(
    (a, b) => a.collectedAt.getTime() - b.collectedAt.getTime(),
  );
  let running = baseRate;
  return ordered.map((receipt) => {
    if (receipt.voidedAt != null) {
      return { receipt, balanceAfter: null };
    }
    running = Math.max(0, running - receipt.amount);
    return { receipt, balanceAfter: running };
  });
}
