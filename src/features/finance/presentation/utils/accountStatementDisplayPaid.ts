/**
 * Pagado mostrado en estado de cuenta por cliente.
 *
 * Identidad: SUM(effectiveTotalPaid) ≡ total_invoiced − balance_due cuando la API
 * ya aplica Gap #4A (PUE stamped → balance_due 0) en getAccountStatement.
 * `totalPaid` del DTO sigue siendo SUM(payments) (caja); no usarlo en la columna Pagado.
 */
export function getAccountStatementDisplayPaid(row: {
  totalInvoiced: number;
  balanceDue: number;
}): number {
  return Number(Math.max(0, row.totalInvoiced - row.balanceDue).toFixed(2));
}
