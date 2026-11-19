/**
 * Estado D27 de sustitución parcial desde la cadena linked invoices
 * (`parentInvoiceId`). Sin endpoint de historial.
 */

import type { InvoiceStatus } from "@features/invoicing/domain";
import type { TripLinkedInvoice } from "@features/trips/domain";

import { billingCopy } from "../../copy/tripDetail/billingCopy";

const copy = billingCopy.substitute;

export type TripBillingSubstitutionHistoryItem = {
  id: string;
  title: string;
  when: string | null;
  /** Resalta el pendiente actual (cancelar original). */
  active: boolean;
};

export type TripBillingSubstitutionState = {
  /** Sustituta vigente + original stamped / cancellation_pending. */
  hasPartialSubstitution: boolean;
  originalInvoiceId: string | null;
  originalFolio: string | null;
  substituteInvoiceId: string | null;
  substituteFolio: string | null;
  history: TripBillingSubstitutionHistoryItem[];
};

function formatFolio(serie: string, folio: number): string {
  return `${serie}-${folio}`;
}

function isOpenOriginal(status: InvoiceStatus): boolean {
  return status === "stamped" || status === "cancellation_pending";
}

function isActiveSubstitute(status: InvoiceStatus): boolean {
  return status === "stamped" || status === "cancellation_pending";
}

function whenFor(inv: TripLinkedInvoice): string | null {
  return inv.stampedAt ?? inv.createdAt;
}

/**
 * Detecta cadenas padre→hijo y arma el historial (más reciente primero).
 * Solo scopes de flete / porción / falso; ignora accesorias.
 */
export function resolveTripBillingSubstitution(
  linkedInvoices: readonly TripLinkedInvoice[],
): TripBillingSubstitutionState {
  const principals = linkedInvoices.filter(
    (row) => row.billingScope !== "accessory",
  );
  const byId = new Map(principals.map((row) => [row.id, row]));

  const pairs: Array<{
    original: TripLinkedInvoice;
    substitute: TripLinkedInvoice;
  }> = [];

  for (const sub of principals) {
    if (!sub.parentInvoiceId) continue;
    if (!isActiveSubstitute(sub.status)) continue;
    const original = byId.get(sub.parentInvoiceId);
    if (!original) continue;
    pairs.push({ original, substitute: sub });
  }

  // Preferir el par con original aún abierto (D27); si varios, el más reciente.
  pairs.sort((a, b) =>
    b.substitute.createdAt.localeCompare(a.substitute.createdAt),
  );
  const openPair =
    pairs.find((pair) => isOpenOriginal(pair.original.status)) ?? null;
  const displayPair = openPair ?? pairs[0] ?? null;

  const history: TripBillingSubstitutionHistoryItem[] = [];
  if (displayPair) {
    const { original, substitute } = displayPair;
    const origFolio = formatFolio(original.serie, original.folio);
    const subFolio = formatFolio(substitute.serie, substitute.folio);
    const originalOpen = isOpenOriginal(original.status);

    if (originalOpen) {
      history.push({
        id: `cancel-pending-${original.id}`,
        title:
          original.status === "cancellation_pending"
            ? copy.historyWaitingReceptor(origFolio)
            : copy.historyCancelPending(origFolio),
        when: whenFor(substitute),
        active: true,
      });
    }

    history.push({
      id: `sub-stamped-${substitute.id}`,
      title: copy.historySubstituteStamped(subFolio, origFolio),
      when: whenFor(substitute),
      active: false,
    });

    history.push({
      id: `orig-stamped-${original.id}`,
      title: copy.historyOriginalStamped(origFolio),
      when: whenFor(original),
      active: false,
    });
  }

  return {
    hasPartialSubstitution: openPair != null,
    originalInvoiceId: displayPair?.original.id ?? null,
    originalFolio: displayPair
      ? formatFolio(displayPair.original.serie, displayPair.original.folio)
      : null,
    substituteInvoiceId: displayPair?.substitute.id ?? null,
    substituteFolio: displayPair
      ? formatFolio(
          displayPair.substitute.serie,
          displayPair.substitute.folio,
        )
      : null,
    history,
  };
}
