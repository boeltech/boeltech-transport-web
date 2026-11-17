/**
 * Pagado mostrado (legado) en estado de cuenta por cliente.
 *
 * Identidad: total_invoiced − saldo con factura.
 * Tras F0b, `balanceDue` puede incluir operativo → restar `operationalBalance`.
 * `totalPaid` del DTO de caja no se usa en la columna Pagado.
 */
export function getAccountStatementDisplayPaid(row: {
  totalInvoiced: number;
  balanceDue: number;
  operationalBalance?: number;
}): number {
  const invoicedDue = Math.max(
    0,
    row.balanceDue - (row.operationalBalance ?? 0),
  );
  return Number(Math.max(0, row.totalInvoiced - invoicedDue).toFixed(2));
}
