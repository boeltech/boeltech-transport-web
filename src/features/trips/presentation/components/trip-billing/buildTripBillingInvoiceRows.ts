/**
 * Construye filas de «Facturas del viaje» desde el listado trip-linked (D-INV-1…9).
 * Modo reparto (D19 / F-01): 1 fila por pierna/cliente; cadena de sustitución en subtítulo.
 */
import { buildInvoiceCreateHref } from "@features/invoicing/application/invoiceCreateHref";
import type { InvoiceStatus } from "@features/invoicing/domain";
import type {
  Trip,
  TripLinkedInvoice,
  TripRevenueSplit,
} from "@features/trips/domain";

import { billingCopy } from "../../copy/tripDetail/billingCopy";

const copy = billingCopy.invoices;

export type InvoiceRowKind =
  | "freight"
  | "accessory"
  | "false_trip"
  | "split"
  | "false_trip_pending";

export type TripBillingInvoiceRow = {
  id: string;
  kind: InvoiceRowKind;
  title: string;
  subtitle: string;
  status: InvoiceStatus | null;
  folio: string | null;
  stampedAt: string | null;
  /** Total CFDI (con IVA) cuando hay factura; en placeholder split = null. */
  total: number | null;
  collected: number | null;
  balance: number | null;
  /** Solo modo reparto / pierna. */
  sharePercent: number | null;
  /** Monto de porción sobre base de flete (sin IVA). Solo split. */
  shareAmount: number | null;
  /** RFC del cliente de la pierna (modo split). */
  clientRfc: string | null;
  isPrimaryClient: boolean;
  carriesCartaPorte: boolean;
  needsSubstitute: boolean;
  /**
   * D27: original reemplazada aún abierta ante el SAT
   * (stamped / cancellation_pending) → badge «Por cancelar».
   */
  pendingCancel: boolean;
  /** D27: fila del CFDI reemplazado (subtítulo / título «… original»). */
  isReplacedRow: boolean;
  isDraft: boolean;
  /** Cancelada o reemplazada → Total tachado. */
  strikeTotal: boolean;
  /** Cobrado/Saldo numéricos (null → «—»). */
  showAmounts: boolean;
  /** Cuenta en summary «Facturado vigente». */
  countsInVigente: boolean;
  href: string | null;
  invoicePortionHref: string | null;
};

export type TripBillingInvoiceSummary = {
  total: number;
  collected: number;
  balance: number;
  rowCount: number;
};

function formatFolio(serie: string, folio: number): string {
  return `${serie}-${folio}`;
}

function isTerminalInactive(status: InvoiceStatus): boolean {
  return status === "cancelled";
}

function isReplaced(
  invoiceId: string,
  byParent: Map<string, TripLinkedInvoice[]>,
): boolean {
  return (byParent.get(invoiceId)?.length ?? 0) > 0;
}

function showCollectedBalance(
  status: InvoiceStatus,
  replaced: boolean,
): boolean {
  if (replaced) return false;
  return status === "stamped" || status === "cancellation_pending";
}

function countsInVigente(status: InvoiceStatus, replaced: boolean): boolean {
  if (replaced) return false;
  if (status === "draft" || status === "stamping" || status === "cancelled") {
    return false;
  }
  return status === "stamped" || status === "cancellation_pending";
}

function sortActiveThenCancelled(
  a: TripLinkedInvoice,
  b: TripLinkedInvoice,
): number {
  const aInactive = isTerminalInactive(a.status) ? 1 : 0;
  const bInactive = isTerminalInactive(b.status) ? 1 : 0;
  if (aInactive !== bInactive) return aInactive - bInactive;
  return a.createdAt.localeCompare(b.createdAt);
}

function substitutionSubtitle(
  inv: TripLinkedInvoice,
  byId: Map<string, TripLinkedInvoice>,
  byParent: Map<string, TripLinkedInvoice[]>,
): string | null {
  const parts: string[] = [];
  if (inv.parentInvoiceId) {
    const parent = byId.get(inv.parentInvoiceId);
    if (parent) {
      parts.push(copy.replaces(formatFolio(parent.serie, parent.folio)));
    }
  }
  const children = byParent.get(inv.id) ?? [];
  // Cadena completa: mostrar el hijo más reciente (CEO).
  const child = children[children.length - 1];
  if (child) {
    parts.push(copy.replacedBy(formatFolio(child.serie, child.folio)));
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function kindForScope(
  scope: TripLinkedInvoice["billingScope"],
): InvoiceRowKind {
  if (scope === "accessory") return "accessory";
  if (scope === "false_trip") return "false_trip";
  if (scope === "split_share") return "split";
  return "freight";
}

function titleFor(
  kind: InvoiceRowKind,
  splitLabel: string | null,
  replaced: boolean,
): string {
  switch (kind) {
    case "accessory":
      return copy.docAccessory;
    case "false_trip":
    case "false_trip_pending":
      return copy.docFalseTrip;
    case "split":
      return replaced
        ? copy.docSplitOriginal(splitLabel ?? "Cliente")
        : copy.docSplit(splitLabel ?? "Cliente");
    default:
      return replaced ? copy.docFreightOriginal : copy.docFreight;
  }
}

function shareAmountFor(
  basisAmount: number,
  sharePercent: number | null,
): number | null {
  if (sharePercent == null) return null;
  if (!(basisAmount > 0)) return null;
  return (basisAmount * sharePercent) / 100;
}

/**
 * Una factura representativa por pierna: vigente > borrador > resto (más reciente).
 * La cadena de sustitución queda en subtítulo, no como filas hermanas.
 */
function pickDisplayInvoiceForLeg(
  legInvoices: readonly TripLinkedInvoice[],
  byParent: Map<string, TripLinkedInvoice[]>,
): TripLinkedInvoice | null {
  if (legInvoices.length === 0) return null;
  const ranked = [...legInvoices].sort((a, b) => {
    const score = (inv: TripLinkedInvoice): number => {
      const replaced = isReplaced(inv.id, byParent);
      if (
        !replaced &&
        (inv.status === "stamped" || inv.status === "cancellation_pending")
      ) {
        return 0;
      }
      if (inv.status === "draft" || inv.status === "stamping") return 1;
      if (!replaced && inv.status !== "cancelled") return 2;
      return 3;
    };
    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    return b.createdAt.localeCompare(a.createdAt);
  });
  return ranked[0] ?? null;
}

function emptySplitMeta(): Pick<
  TripBillingInvoiceRow,
  "shareAmount" | "clientRfc" | "isPrimaryClient" | "carriesCartaPorte"
> {
  return {
    shareAmount: null,
    clientRfc: null,
    isPrimaryClient: false,
    carriesCartaPorte: false,
  };
}

function toRowFromInvoice(params: {
  inv: TripLinkedInvoice;
  kind: InvoiceRowKind;
  clientLabel: string;
  splitLabel: string | null;
  sharePercent: number | null;
  shareAmount: number | null;
  clientRfc: string | null;
  isPrimaryClient: boolean;
  carriesCartaPorte: boolean;
  needsSubstitute: boolean;
  byId: Map<string, TripLinkedInvoice>;
  byParent: Map<string, TripLinkedInvoice[]>;
}): TripBillingInvoiceRow {
  const {
    inv,
    kind,
    clientLabel,
    splitLabel,
    sharePercent,
    shareAmount,
    clientRfc,
    isPrimaryClient,
    carriesCartaPorte,
    needsSubstitute,
  } = params;
  const replaced = isReplaced(inv.id, params.byParent);
  const isSubstitute = Boolean(inv.parentInvoiceId);
  const sub = substitutionSubtitle(inv, params.byId, params.byParent);
  const cpLabel = inv.attachCartaPorte
    ? copy.withCartaPorte
    : copy.withoutCartaPorte;

  let subtitle: string;
  if (kind === "split") {
    // Eje cliente: RFC y/o cadena de sustitución (no 2ª fila hermano en display).
    const parts: string[] = [];
    if (clientRfc) parts.push(clientRfc);
    if (sub) parts.push(sub);
    subtitle = parts.join(" · ");
  } else if (kind === "false_trip") {
    // D20: título «Viaje en falso»; subtítulo tipado ingreso sin CP (+ cliente / cadena).
    const parts: string[] = [copy.docFalseTripSubtitle];
    if (clientLabel) parts.push(clientLabel);
    if (sub) parts.push(sub);
    subtitle = parts.join(" · ");
  } else if (kind === "accessory") {
    subtitle = sub ? `${clientLabel} · ${sub}` : clientLabel;
  } else if (sub) {
    // D27: subtítulo = cadena (+ CP); cliente queda implícito en el viaje.
    subtitle = `${sub} · ${cpLabel}`;
  } else {
    subtitle = `${cpLabel} · ${clientLabel}`;
  }

  const showAmounts = showCollectedBalance(inv.status, replaced);
  const pendingCancel =
    replaced &&
    (inv.status === "stamped" || inv.status === "cancellation_pending");
  return {
    id: inv.id,
    kind,
    title: titleFor(kind, splitLabel, replaced),
    subtitle,
    status: inv.status,
    folio: formatFolio(inv.serie, inv.folio),
    stampedAt: inv.stampedAt,
    total: inv.total,
    collected: showAmounts ? inv.totalPaid : null,
    balance: showAmounts ? inv.balanceDue : null,
    sharePercent,
    shareAmount,
    clientRfc,
    isPrimaryClient,
    carriesCartaPorte,
    // D27: con sustituta ya emitida no invitar a Sustituir de nuevo.
    needsSubstitute:
      needsSubstitute &&
      !replaced &&
      !isSubstitute &&
      inv.status !== "cancelled",
    pendingCancel,
    isReplacedRow: replaced,
    isDraft: inv.status === "draft",
    strikeTotal: inv.status === "cancelled" || replaced,
    showAmounts,
    countsInVigente: countsInVigente(inv.status, replaced),
    href: `/invoices/${inv.id}`,
    invoicePortionHref: null,
  };
}

export function summarizeVigente(
  rows: readonly TripBillingInvoiceRow[],
): TripBillingInvoiceSummary {
  let total = 0;
  let collected = 0;
  let balance = 0;
  let rowCount = 0;
  for (const row of rows) {
    if (!row.countsInVigente) continue;
    rowCount += 1;
    total += row.total ?? 0;
    collected += row.collected ?? 0;
    balance += row.balance ?? 0;
  }
  return { total, collected, balance, rowCount };
}

export function buildTripBillingInvoiceRows(params: {
  trip: Trip;
  linkedInvoices: readonly TripLinkedInvoice[];
  revenueSplit?: TripRevenueSplit | null;
  canCreate: boolean;
}): TripBillingInvoiceRow[] {
  const { trip, linkedInvoices, revenueSplit, canCreate } = params;
  const inv = trip.invoicing;
  const isFalseTrip = trip.operationalOutcome === "false_trip";
  const tripCancelled = trip.status === "cancelled";
  const hasSplit =
    inv.hasActiveSplit ||
    revenueSplit?.status === "active" ||
    revenueSplit?.status === "draft";
  const clientLabel = trip.client?.legalName?.trim() || "Cliente";
  const freightNeedsSubstitute =
    Boolean(trip.requiresFiscalAttention) && !isFalseTrip;

  const byId = new Map(linkedInvoices.map((row) => [row.id, row]));
  const byParent = new Map<string, TripLinkedInvoice[]>();
  for (const row of linkedInvoices) {
    if (!row.parentInvoiceId) continue;
    const list = byParent.get(row.parentInvoiceId) ?? [];
    list.push(row);
    byParent.set(row.parentInvoiceId, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  const out: TripBillingInvoiceRow[] = [];

  if (hasSplit && revenueSplit && revenueSplit.status !== "cancelled") {
    const usedIds = new Set<string>();
    const legs = [...revenueSplit.legs].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    const tripClientId = trip.clientId;

    for (const leg of legs) {
      const label =
        leg.clientLegalName || leg.clientRfc || leg.clientId.slice(0, 8);
      const isPrimaryClient = Boolean(
        tripClientId && leg.clientId === tripClientId,
      );
      const shareAmount = shareAmountFor(
        revenueSplit.basisAmount,
        leg.sharePercent,
      );
      const legInvoices = linkedInvoices
        .filter((row) => row.splitLegId === leg.id)
        .sort(sortActiveThenCancelled);

      for (const legInv of legInvoices) {
        usedIds.add(legInv.id);
      }

      const display = pickDisplayInvoiceForLeg(legInvoices, byParent);

      if (!display) {
        const portionHref =
          !tripCancelled &&
          canCreate &&
          inv.canGenerateSplitShareInvoice
            ? buildInvoiceCreateHref({
                tripId: trip.id,
                scope: "split_share",
                legId: leg.id,
              })
            : null;
        out.push({
          id: `leg-placeholder-${leg.id}`,
          kind: "split",
          title: copy.docSplit(label),
          subtitle: tripCancelled
            ? copy.noEmit
            : (leg.clientRfc ?? ""),
          status: null,
          folio: null,
          stampedAt: null,
          total: null,
          collected: null,
          balance: null,
          sharePercent: leg.sharePercent,
          shareAmount,
          clientRfc: leg.clientRfc,
          isPrimaryClient,
          carriesCartaPorte: leg.suggestedCartaPorte,
          needsSubstitute: false,
          pendingCancel: false,
          isReplacedRow: false,
          isDraft: false,
          strikeTotal: false,
          showAmounts: false,
          countsInVigente: false,
          href: null,
          invoicePortionHref: portionHref,
        });
        continue;
      }

      out.push(
        toRowFromInvoice({
          inv: display,
          kind: "split",
          clientLabel,
          splitLabel: label,
          sharePercent: display.sharePercent ?? leg.sharePercent,
          shareAmount,
          clientRfc: leg.clientRfc,
          isPrimaryClient,
          carriesCartaPorte:
            leg.suggestedCartaPorte || display.attachCartaPorte,
          needsSubstitute: false,
          byId,
          byParent,
        }),
      );
    }

    const accessories = linkedInvoices
      .filter((row) => row.billingScope === "accessory")
      .sort(sortActiveThenCancelled);
    for (const acc of accessories) {
      usedIds.add(acc.id);
      out.push(
        toRowFromInvoice({
          inv: acc,
          kind: "accessory",
          clientLabel,
          splitLabel: null,
          sharePercent: null,
          needsSubstitute: false,
          byId,
          byParent,
          ...emptySplitMeta(),
        }),
      );
    }

    // Canceladas / huérfanas de split no ligadas a pierna actual.
    const leftovers = linkedInvoices
      .filter((row) => !usedIds.has(row.id))
      .sort(sortActiveThenCancelled);
    for (const leftover of leftovers) {
      out.push(
        toRowFromInvoice({
          inv: leftover,
          kind: kindForScope(leftover.billingScope),
          clientLabel,
          splitLabel: null,
          sharePercent: leftover.sharePercent,
          shareAmount: shareAmountFor(
            revenueSplit.basisAmount,
            leftover.sharePercent,
          ),
          clientRfc: null,
          isPrimaryClient: false,
          carriesCartaPorte: leftover.attachCartaPorte,
          needsSubstitute: false,
          byId,
          byParent,
        }),
      );
    }

    return out;
  }

  // Modo docs: flete / falso + accesorias (+ canceladas / cadena).
  const principalScopes = isFalseTrip
    ? (["false_trip", "primary_transport"] as const)
    : (["primary_transport", "false_trip"] as const);

  const principals = linkedInvoices
    .filter((row) =>
      (principalScopes as readonly string[]).includes(row.billingScope),
    )
    .sort((a, b) => {
      // Activos (no cancelled, no replaced) primero; luego cadena/canceladas.
      const aRank =
        isTerminalInactive(a.status) || isReplaced(a.id, byParent) ? 1 : 0;
      const bRank =
        isTerminalInactive(b.status) || isReplaced(b.id, byParent) ? 1 : 0;
      if (aRank !== bRank) return aRank - bRank;
      // En falso: ingreso false_trip antes que flete cancelado.
      if (isFalseTrip) {
        const aFalse = a.billingScope === "false_trip" ? 0 : 1;
        const bFalse = b.billingScope === "false_trip" ? 0 : 1;
        if (aFalse !== bFalse) return aFalse - bFalse;
      }
      return a.createdAt.localeCompare(b.createdAt);
    });

  for (const principal of principals) {
    const kind =
      principal.billingScope === "false_trip" ? "false_trip" : "freight";
    out.push(
      toRowFromInvoice({
        inv: principal,
        kind,
        clientLabel,
        splitLabel: null,
        sharePercent: null,
        needsSubstitute: freightNeedsSubstitute && kind === "freight",
        byId,
        byParent,
        ...emptySplitMeta(),
      }),
    );
  }

  // Slot «Por facturar» en viaje en falso sin ingreso aún.
  if (
    isFalseTrip &&
    !principals.some((row) => row.billingScope === "false_trip")
  ) {
    out.unshift({
      id: "false-trip-pending",
      kind: "false_trip_pending",
      title: copy.docFalseTrip,
      subtitle: copy.docFalseTripSubtitle,
      status: null,
      folio: null,
      stampedAt: null,
      total: null,
      collected: null,
      balance: null,
      sharePercent: null,
      needsSubstitute: false,
      pendingCancel: false,
      isReplacedRow: false,
      isDraft: false,
      strikeTotal: false,
      showAmounts: false,
      countsInVigente: false,
      href: null,
      invoicePortionHref:
        canCreate && inv.canGenerateFalseTripInvoice
          ? buildInvoiceCreateHref({
              tripId: trip.id,
              scope: "false_trip",
            })
          : null,
      ...emptySplitMeta(),
    });
  }

  const accessories = linkedInvoices
    .filter((row) => row.billingScope === "accessory")
    .sort(sortActiveThenCancelled);
  for (const acc of accessories) {
    out.push(
      toRowFromInvoice({
        inv: acc,
        kind: "accessory",
        clientLabel,
        splitLabel: null,
        sharePercent: null,
        needsSubstitute: false,
        byId,
        byParent,
        ...emptySplitMeta(),
      }),
    );
  }

  return out;
}
