/**
 * ADR-0081: defensa UI — no abrir alta split_share para porción ya facturada.
 */

export type SplitShareLegInvoiceRef = {
  readonly id: string;
  readonly invoiceId: string | null;
};

export function findSplitShareLegAlreadyInvoiced(
  legs: readonly SplitShareLegInvoiceRef[] | undefined,
  legId: string | null | undefined,
): SplitShareLegInvoiceRef | null {
  const id = legId?.trim();
  if (!id || !legs?.length) return null;
  const leg = legs.find((l) => l.id === id);
  if (!leg?.invoiceId) return null;
  return leg;
}
