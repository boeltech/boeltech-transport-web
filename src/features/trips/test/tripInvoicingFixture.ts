import type { TripInvoicing } from "@features/trips/domain";

/** Fixture mínimo de `TripInvoicing` (ADR-0068) para tests. */
export function tripInvoicingFixture(
  overrides: Partial<TripInvoicing> = {},
): TripInvoicing {
  const hasActiveInvoice = overrides.hasActiveInvoice ?? false;
  return {
    hasActiveInvoice,
    hasActivePrimaryInvoice: overrides.hasActivePrimaryInvoice ?? hasActiveInvoice,
    hasActivePrincipalInvoice:
      overrides.hasActivePrincipalInvoice ??
      (overrides.hasActivePrimaryInvoice ?? hasActiveInvoice),
    canGenerateInvoice: overrides.canGenerateInvoice ?? false,
    canGenerateAccessoryInvoice: overrides.canGenerateAccessoryInvoice ?? false,
    canGenerateFalseTripInvoice: overrides.canGenerateFalseTripInvoice ?? false,
    hasActiveSplit: overrides.hasActiveSplit ?? false,
    splitLegsInvoiced: overrides.splitLegsInvoiced ?? 0,
    splitLegsTotal: overrides.splitLegsTotal ?? 0,
    canGenerateSplitShareInvoice: overrides.canGenerateSplitShareInvoice ?? false,
    cartaPorteAttached: overrides.cartaPorteAttached ?? false,
    invoiceId: overrides.invoiceId ?? null,
    invoiceFolio: overrides.invoiceFolio ?? null,
    invoiceCfdiUuid: overrides.invoiceCfdiUuid ?? null,
    invoiceStatus: overrides.invoiceStatus ?? null,
    accessoryInvoices: overrides.accessoryInvoices ?? [],
    blockReason: overrides.blockReason ?? null,
  };
}
