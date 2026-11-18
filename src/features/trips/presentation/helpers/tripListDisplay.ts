/**
 * Helpers de display del listado `/trips` (F11) — puro, sin React.
 */
import {
  TripStatus,
  type TripListItem,
  type TripRouteTypeValue,
  type TripStatusType,
} from "../../domain";
import { tripsListCopy } from "../copy/listCopy";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { getTripOverdueState } from "../utils/tripOverdue";
import { formatTripLateDelayChip } from "./formatTripLateDelayChip";

const MEXICO_TIMEZONE = "America/Mexico_City";
const copy = tripsListCopy;

function mexicoParts(
  date: Date,
): { day: string; month: string; hour: string; minute: string; dayKey: string } {
  const fmt = new Intl.DateTimeFormat("es-MX", {
    timeZone: MEXICO_TIMEZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const day = get("day");
  const month = get("month").replace(/\.$/, "");
  const hour = get("hour");
  const minute = get("minute");
  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEXICO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return { day, month, hour, minute, dayKey };
}

/** Salida: `17 nov, 06:30` (día civil México, 24 h, sin año). */
export function formatTripListDeparture(date: Date): string {
  if (Number.isNaN(date.getTime())) return copy.columns.emptyCell;
  const { day, month, hour, minute } = mexicoParts(date);
  return `${day} ${month}, ${hour}:${minute}`;
}

/**
 * Llegada bajo salida:
 * - mismo día → `Llegada HH:mm`
 * - otro día → `Llegada d mmm, HH:mm`
 * - sin llegada → `Llegada —`
 */
export function formatTripListArrivalLine(
  departure: Date,
  arrival: Date | null,
): string {
  if (arrival == null || Number.isNaN(arrival.getTime())) {
    return copy.schedule.arrivalEmpty;
  }
  const dep = mexicoParts(departure);
  const arr = mexicoParts(arrival);
  if (dep.dayKey === arr.dayKey) {
    return copy.schedule.arrivalSameDay(`${arr.hour}:${arr.minute}`);
  }
  return copy.schedule.arrivalOtherDay(
    `${arr.day} ${arr.month}, ${arr.hour}:${arr.minute}`,
  );
}

export function formatTripListCargoCount(count: number): string {
  if (count <= 0) return copy.routeMeta.noCargos;
  if (count === 1) return copy.routeMeta.oneCargo;
  return copy.routeMeta.nCargos(count);
}

export function formatTripListRouteTypeLabel(
  routeType: TripRouteTypeValue | undefined,
): string {
  if (!routeType) return copy.routeType.long_haul;
  return copy.routeType[routeType] ?? copy.routeType.long_haul;
}

export function formatTripListRouteMeta(trip: {
  routeType?: TripRouteTypeValue;
  cargoCount: number;
}): string {
  return `${formatTripListRouteTypeLabel(trip.routeType)} · ${formatTripListCargoCount(trip.cargoCount)}`;
}

export function formatTripListClientSecondary(
  trip: Pick<TripListItem, "client" | "clientCount">,
): string {
  const name = trip.client?.legalName?.trim() || copy.columns.noClient;
  if (trip.clientCount > 1) {
    return `${name} ${copy.columns.moreClients(trip.clientCount - 1)}`;
  }
  return name;
}

function hasAssignedVehicle(
  trip: Pick<TripListItem, "vehicle">,
): boolean {
  const id = trip.vehicle?.id?.trim();
  const unit = trip.vehicle?.unitNumber?.trim();
  return Boolean(id) && Boolean(unit);
}

function hasAssignedDriver(trip: Pick<TripListItem, "driver">): boolean {
  const id = trip.driver?.id?.trim();
  const name = trip.driver?.fullName?.trim();
  return Boolean(id) && Boolean(name);
}

function hasRouteEndpoints(
  trip: Pick<TripListItem, "originCity" | "destinationCity">,
): boolean {
  return Boolean(trip.originCity?.trim()) && Boolean(trip.destinationCity?.trim());
}

/**
 * D-F11-9 — un solo «Falta …» en Reserva; orden unidad → conductor → ruta → cargas.
 */
export function resolveTripListReserveGap(
  trip: Pick<
    TripListItem,
    | "status"
    | "vehicle"
    | "driver"
    | "originCity"
    | "destinationCity"
    | "cargoCount"
  >,
): string | null {
  if (trip.status !== TripStatus.DRAFT) return null;
  if (!hasAssignedVehicle(trip)) return copy.statusSecondary.missingVehicle;
  if (!hasAssignedDriver(trip)) return copy.statusSecondary.missingDriver;
  if (!hasRouteEndpoints(trip)) return copy.statusSecondary.missingRoute;
  if (trip.cargoCount <= 0) return copy.statusSecondary.missingCargos;
  return null;
}

export function resolveTripListStatusSecondary(
  trip: Pick<
    TripListItem,
    | "status"
    | "scheduledArrival"
    | "operationalOutcome"
    | "vehicle"
    | "driver"
    | "originCity"
    | "destinationCity"
    | "cargoCount"
  >,
  now?: Date,
): { text: string; tone: "late" | "muted" } | null {
  const overdue = getTripOverdueState({ ...trip, now });
  if (overdue.isOverdue) {
    return {
      text: formatTripLateDelayChip(overdue.hoursOverdue * 3_600_000),
      tone: "late",
    };
  }
  if (trip.operationalOutcome === "false_trip") {
    return { text: copy.statusSecondary.falseTrip, tone: "muted" };
  }
  const gap = resolveTripListReserveGap(trip);
  if (gap) return { text: gap, tone: "muted" };
  return null;
}

export type TripListInvoicingAppearance =
  | { mode: "empty" }
  | { mode: "quiet"; label: string; secondary?: string }
  | {
      mode: "badge";
      label: string;
      variant: "success" | "warning" | "secondary" | "destructive" | "neutral";
      tone?: "soft" | "solid";
      secondary?: string;
    };

function hasInvoiceEvidence(
  invoicing: TripListItem["invoicing"],
): boolean {
  return (
    !!invoicing.invoiceId ||
    !!invoicing.invoiceFolio ||
    invoicing.invoiceStatus !== null ||
    !!invoicing.invoiceCfdiUuid ||
    invoicing.hasActiveInvoice
  );
}

function folioSecondary(folio: string | null | undefined): string | undefined {
  const trimmed = folio?.trim();
  return trimmed || undefined;
}

function invoiceStateSecondary(
  trip: Pick<TripListItem, "invoicing" | "operationalOutcome">,
): string | undefined {
  const { invoicing } = trip;
  const folio = folioSecondary(invoicing.invoiceFolio);
  const labels = copy.invoicingBadge;
  const detail = tripFiscalCopy.detailBadge;

  if (invoicing.hasActiveSplit) {
    const { splitLegsInvoiced, splitLegsTotal } = invoicing;
    if (
      splitLegsTotal > 0 &&
      splitLegsInvoiced > 0 &&
      splitLegsInvoiced < splitLegsTotal
    ) {
      const portions = copy.invoicingSecondary.portions(
        splitLegsInvoiced,
        splitLegsTotal,
      );
      return folio ? `${detail.splitPartial} · ${folio}` : portions;
    }
  }

  switch (invoicing.invoiceStatus) {
    case "draft":
      return folio
        ? trip.operationalOutcome === "false_trip"
          ? `${folio} · ${copy.statusSecondary.falseTrip.toLowerCase()}`
          : folio
        : undefined;
    case "stamped":
      return folio
        ? `${labels.stamped} · ${folio}`
        : labels.stamped;
    case "cancellation_pending":
      return folio ?? labels.cancellationPending;
    case "cancelled":
      return folio ? `${labels.cancelled} · ${folio}` : labels.cancelled;
    default:
      if (folio) return folio;
      if (invoicing.hasActiveInvoice) {
        return labels.stamped;
      }
      return undefined;
  }
}

/**
 * Celda Facturación del listado (D-F11-2/3/4 · Q22/Q24).
 * Pendiente / Sin factura / Factura cancelada = texto gris; Atención fiscal manda.
 */
export function getTripListInvoicingAppearance(
  trip: Pick<
    TripListItem,
    | "status"
    | "invoicing"
    | "cfdiEmissionIntent"
    | "routeType"
    | "requiresFiscalAttention"
    | "operationalOutcome"
  >,
  options: { hideFiscalAttentionBadge?: boolean } = {},
): TripListInvoicingAppearance {
  const { invoicing } = trip;
  const labels = copy.invoicingBadge;
  const detail = tripFiscalCopy.detailBadge;
  const evidence = hasInvoiceEvidence(invoicing);

  if (trip.requiresFiscalAttention && !options.hideFiscalAttentionBadge) {
    return {
      mode: "badge",
      label: copy.badge.fiscalAttention,
      variant: "destructive",
      tone: "soft",
      secondary: invoiceStateSecondary(trip),
    };
  }

  // Traslado / cancelado sin factura → —
  if (
    !evidence &&
    !invoicing.hasActiveSplit &&
    (trip.routeType === "transfer" || trip.status === TripStatus.CANCELLED)
  ) {
    return { mode: "empty" };
  }

  if (
    trip.cfdiEmissionIntent === "sin_cfdi_efectivo" &&
    !evidence &&
    !invoicing.hasActiveSplit
  ) {
    return { mode: "quiet", label: detail.sinCfdi };
  }

  if (evidence || invoicing.hasActiveInvoice) {
    switch (invoicing.invoiceStatus) {
      case "draft":
        return {
          mode: "badge",
          label: labels.draft,
          variant: "secondary",
          tone: "soft",
          secondary: folioSecondary(invoicing.invoiceFolio),
        };
      case "stamped":
        return {
          mode: "badge",
          label: labels.stamped,
          variant: "success",
          tone: "soft",
          secondary: folioSecondary(invoicing.invoiceFolio),
        };
      case "cancellation_pending":
        return {
          mode: "badge",
          label: labels.cancellationPending,
          variant: "destructive",
          tone: "soft",
          secondary: folioSecondary(invoicing.invoiceFolio),
        };
      case "cancelled":
        // Q22: si vuelve a ser facturable, Listo (sin folio tachado)
        if (invoicing.canGenerateInvoice) {
          return {
            mode: "badge",
            label: detail.readyToBill,
            variant: "warning",
            tone: "soft",
          };
        }
        return {
          mode: "quiet",
          label: labels.cancelled,
          secondary: folioSecondary(invoicing.invoiceFolio),
        };
      default:
        if (invoicing.hasActiveInvoice) {
          return {
            mode: "badge",
            label: labels.stamped,
            variant: "success",
            tone: "soft",
            secondary: folioSecondary(invoicing.invoiceFolio),
          };
        }
        break;
    }
  }

  if (invoicing.hasActiveSplit) {
    const { splitLegsInvoiced, splitLegsTotal } = invoicing;
    if (splitLegsTotal > 0 && splitLegsInvoiced >= splitLegsTotal) {
      return {
        mode: "badge",
        label: labels.stamped,
        variant: "success",
        tone: "soft",
      };
    }
    if (splitLegsInvoiced > 0 && splitLegsInvoiced < splitLegsTotal) {
      return {
        mode: "badge",
        label: detail.splitPartial,
        variant: "secondary",
        tone: "soft",
        secondary: copy.invoicingSecondary.portions(
          splitLegsInvoiced,
          splitLegsTotal,
        ),
      };
    }
    if (invoicing.canGenerateSplitShareInvoice) {
      return {
        mode: "badge",
        label: detail.readyToBill,
        variant: "warning",
        tone: "soft",
      };
    }
    return { mode: "quiet", label: detail.pending };
  }

  if (invoicing.canGenerateInvoice) {
    return {
      mode: "badge",
      label: detail.readyToBill,
      variant: "warning",
      tone: "soft",
    };
  }

  return { mode: "quiet", label: detail.pending };
}

export function tripListIncomeValue(
  baseRate: number | undefined | null,
): number | null {
  if (baseRate == null || !Number.isFinite(baseRate) || baseRate <= 0) {
    return null;
  }
  return baseRate;
}

export function isTripListFleetEmpty(
  trip: Pick<TripListItem, "vehicle" | "driver">,
): boolean {
  return !hasAssignedVehicle(trip) && !hasAssignedDriver(trip);
}

export type { TripStatusType };
