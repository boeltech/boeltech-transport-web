/**
 * Reparto sugerido por antigüedad (emisión) para facturas abiertas.
 * UX del form — no es regla fiscal del paquete.
 */

export interface InvoiceAllocationCandidate {
  id: string;
  issuedAt: string;
  balanceDue: number;
}

/** Greedy oldest-first hasta agotar el monto (2 decimales MXN). */
export function suggestInvoiceAllocation(
  amount: number,
  invoices: readonly InvoiceAllocationCandidate[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const inv of invoices) {
    result[inv.id] = 0;
  }
  if (!(amount > 0) || invoices.length === 0) return result;

  const sorted = [...invoices].sort((a, b) => {
    const byDate = a.issuedAt.localeCompare(b.issuedAt);
    if (byDate !== 0) return byDate;
    return a.id.localeCompare(b.id);
  });

  let remaining = Number(amount.toFixed(2));
  for (const inv of sorted) {
    if (remaining <= 0.009) break;
    const pending = Math.max(0, Number(inv.balanceDue.toFixed(2)));
    if (pending <= 0) continue;
    const take = Math.min(pending, remaining);
    result[inv.id] = Number(take.toFixed(2));
    remaining = Number((remaining - take).toFixed(2));
  }
  return result;
}
