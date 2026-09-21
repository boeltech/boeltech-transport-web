/**
 * Resuelve copy/CTA del banner «atención fiscal» (ADR-0093 + ADR-0081).
 * Con prorrateo activo no usa `invoicing.invoiceId` (lateral prin = primary/false_trip).
 */

export type FiscalAttentionSplitLegInput = {
  readonly invoiceId: string | null;
  readonly clientLegalName: string | null;
  readonly clientId: string;
  readonly sortOrder: number;
};

export type FiscalAttentionInvoicedLeg = {
  readonly invoiceId: string;
  readonly label: string;
};

export type FiscalAttentionCta =
  | { readonly kind: "none" }
  | {
      readonly kind: "primary";
      readonly bodyKey: "withInvoice" | "noInvoice";
      readonly invoiceId: string | null;
    }
  | {
      readonly kind: "split";
      readonly bodyKey: "withInvoices" | "noInvoicesYet" | "pending";
      readonly invoicedLegs: readonly FiscalAttentionInvoicedLeg[];
    };

function legLabel(leg: FiscalAttentionSplitLegInput): string {
  const name = leg.clientLegalName?.trim();
  if (name) return name;
  return leg.clientId.slice(0, 8);
}

/**
 * Piernas con factura activa, ordenadas por `sortOrder` (primera = CTA mínimo).
 */
export function collectInvoicedSplitLegs(
  legs: readonly FiscalAttentionSplitLegInput[],
): FiscalAttentionInvoicedLeg[] {
  return [...legs]
    .filter((leg): leg is FiscalAttentionSplitLegInput & { invoiceId: string } =>
      Boolean(leg.invoiceId),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((leg) => ({
      invoiceId: leg.invoiceId,
      label: legLabel(leg),
    }));
}

export function resolveFiscalAttentionCta(input: {
  requiresFiscalAttention: boolean;
  hasActiveSplit: boolean;
  /** Lateral `prin` — solo primary / false_trip; en split suele ser null. */
  principalInvoiceId: string | null;
  /**
   * `false` mientras `useTripRevenueSplit` no ha resuelto (evita CTA roto
   * o copy «sin factura» prematuro).
   */
  splitLegsReady: boolean;
  splitLegs: readonly FiscalAttentionSplitLegInput[];
}): FiscalAttentionCta {
  if (!input.requiresFiscalAttention) {
    return { kind: "none" };
  }

  if (input.hasActiveSplit) {
    if (!input.splitLegsReady) {
      return { kind: "split", bodyKey: "pending", invoicedLegs: [] };
    }
    const invoicedLegs = collectInvoicedSplitLegs(input.splitLegs);
    if (invoicedLegs.length === 0) {
      return { kind: "split", bodyKey: "noInvoicesYet", invoicedLegs: [] };
    }
    return { kind: "split", bodyKey: "withInvoices", invoicedLegs };
  }

  if (input.principalInvoiceId) {
    return {
      kind: "primary",
      bodyKey: "withInvoice",
      invoiceId: input.principalInvoiceId,
    };
  }

  return { kind: "primary", bodyKey: "noInvoice", invoiceId: null };
}
