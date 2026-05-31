import {
  STOP_TYPE_LABELS,
  type StopTypeValue,
  type TripStop,
} from "@features/trips/domain";
import {
  formatStopTimelineLabel,
  type StopTimelineLabel,
} from "../uiHelpers";
import { trackingCopy } from "@features/trips/presentation/copy";

function normalizeStopTypes(
  stopType: StopTypeValue | StopTypeValue[],
): StopTypeValue[] {
  return Array.isArray(stopType) ? stopType : [stopType];
}

/** Etiqueta corta para botones: «Parada 2 · Escala». */
export function formatStopActionShortLabel(
  stop: TripStop,
  displayOrder: number,
): string {
  const typeLabels = [
    ...new Set(
      normalizeStopTypes(stop.stopType)
        .map((type) => STOP_TYPE_LABELS[type])
        .filter(Boolean),
    ),
  ];
  const typePart = typeLabels.join(" · ");
  return typePart
    ? `Parada ${displayOrder} · ${typePart}`
    : `Parada ${displayOrder}`;
}

export function formatArrivalButtonLabel(
  stop: TripStop | undefined,
  displayOrder: number | undefined,
): string {
  const base = trackingCopy.action.arrive;
  if (!stop || displayOrder == null) return base;
  return `${base} — ${formatStopActionShortLabel(stop, displayOrder)}`;
}

export function formatDepartureButtonLabel(
  stop: TripStop | undefined,
  displayOrder: number | undefined,
): string {
  const base = trackingCopy.action.depart;
  if (!stop || displayOrder == null) return base;
  return `${base} — ${formatStopActionShortLabel(stop, displayOrder)}`;
}

export function formatTripArrivalButtonLabel(
  stop: TripStop | undefined,
  displayOrder: number | undefined,
): string {
  const base = trackingCopy.action.close;
  if (!stop || displayOrder == null) return base;
  return `${base} — ${formatStopActionShortLabel(stop, displayOrder)}`;
}

export function formatStopActionTooltip(
  stop: TripStop,
  displayOrder: number,
): string {
  const { primary, secondary }: StopTimelineLabel = formatStopTimelineLabel(
    stop,
    displayOrder,
  );
  return secondary ? `${primary}\n${secondary}` : primary;
}

export function resolveStopDisplayOrder(
  stops: TripStop[],
  stopId: string,
): number | undefined {
  const index = stops.findIndex((stop) => stop.id === stopId);
  return index >= 0 ? index + 1 : undefined;
}
