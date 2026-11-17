import type { AccountStatementItem } from "@features/finance/domain";

/** Saldo con factura = total por cobrar − sin factura (merge F0b). */
export function getAccountStatementInvoicedBalance(
  row: Pick<AccountStatementItem, "balanceDue" | "operationalBalance">,
): number {
  return Number(
    Math.max(0, row.balanceDue - (row.operationalBalance ?? 0)).toFixed(2),
  );
}

export function getAccountStatementOperationalBalance(
  row: Pick<AccountStatementItem, "operationalBalance">,
): number {
  return Number(Math.max(0, row.operationalBalance ?? 0).toFixed(2));
}

export function accountStatementHasInvoiceChannel(
  row: Pick<
    AccountStatementItem,
    "balanceDue" | "operationalBalance" | "openInvoiceCount"
  >,
): boolean {
  return (
    getAccountStatementInvoicedBalance(row) > 0.009 || row.openInvoiceCount > 0
  );
}

export function accountStatementHasOperationalChannel(
  row: Pick<AccountStatementItem, "operationalBalance" | "operationalTripCount">,
): boolean {
  return (
    getAccountStatementOperationalBalance(row) > 0.009 ||
    (row.operationalTripCount ?? 0) > 0
  );
}
