import { isGenericRfc } from "@boeltech/cfdi-domain";
import type {
  AccountStatementItem,
  AccountStatementTarget,
} from "@features/finance/domain";

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

/**
 * Cómo pedir el documento de un renglón de Cartera. Un RFC genérico lo
 * comparten clientes distintos, así que se pide por cliente; sin cliente no
 * hay documento (`null`).
 */
export function getAccountStatementTarget(
  row: Pick<AccountStatementItem, "clientId" | "clientRfc" | "clientName">,
): AccountStatementTarget | null {
  const rfc = row.clientRfc.trim().toUpperCase();
  if (rfc && !isGenericRfc(rfc)) return { clientRfc: rfc };
  return row.clientId
    ? { clientId: row.clientId, clientName: row.clientName }
    : null;
}
