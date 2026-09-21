/**
 * Pagado mostrado en estado de cuenta por cliente.
 *
 * Identidad: total_invoiced − balance_due (API aging / aplicaciones reales).
 * `totalPaid` del DTO de caja no se usa en la columna Pagado.
 */
export function getAccountStatementDisplayPaid(row: {
  totalInvoiced: number;
  balanceDue: number;
}): number {
  return Number(Math.max(0, row.totalInvoiced - row.balanceDue).toFixed(2));
}
