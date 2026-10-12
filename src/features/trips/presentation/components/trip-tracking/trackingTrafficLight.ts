/**
 * Presentación del semáforo de seguimiento (F1-B).
 * La regla vive en `@boeltech/cfdi-domain`; aquí solo se arma el input y el chip.
 */
import {
  deriveTrackingTrafficLight,
  type TrackingTrafficLight,
} from "@boeltech/cfdi-domain";
import {
  getOrderedStops,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";

import { trackingCopy } from "../../copy";

export type { TrackingTrafficLight };

/** Parada en andén: llegada real sin salida registrada. */
export function findStopAtDock(
  stops: readonly TripStop[],
): TripStop | undefined {
  return getOrderedStops(stops).find(
    (stop) => stop.actualArrival != null && stop.actualDeparture == null,
  );
}

export type ResolveTrackingTrafficLightInput = {
  tripStatus: TripStatusType;
  hasOpenIncident: boolean;
  /** Instant de evaluación (inyectable; p. ej. tick de refresco). */
  now: Date | string | number;
  /** ETA del progreso del timeline (preferida para lateness). */
  estimatedArrival?: Date | string | null;
  /** Llegada programada del viaje (fallback si no hay ETA). */
  scheduledArrival?: Date | string | null;
  stops: readonly TripStop[];
};

/**
 * Deriva el semáforo del tab Seguimiento a partir del timeline.
 * Preferencia de hito: estimatedArrival → scheduledArrival.
 */
export function resolveTrackingTrafficLight(
  input: ResolveTrackingTrafficLightInput,
): TrackingTrafficLight {
  const dockStop = findStopAtDock(input.stops);
  const now =
    typeof input.now === "number" ? new Date(input.now) : input.now;

  return deriveTrackingTrafficLight({
    tripStatus: input.tripStatus,
    hasOpenIncident: input.hasOpenIncident,
    now,
    scheduledArrival:
      input.estimatedArrival ?? input.scheduledArrival ?? null,
    stopArrivedAt: dockStop?.actualArrival ?? null,
  });
}

export function trackingTrafficLightLabel(
  light: TrackingTrafficLight,
): string {
  return trackingCopy.label.trafficLight[light];
}

export type TrackingTrafficLightBadgeVariant =
  | "success"
  | "warning"
  | "destructive"
  | "neutral";

export function trackingTrafficLightBadgeVariant(
  light: Exclude<TrackingTrafficLight, "n/a">,
): TrackingTrafficLightBadgeVariant {
  switch (light) {
    case "on_time":
      return "success";
    case "at_risk":
      return "warning";
    case "delayed":
      return "warning";
    case "stopped":
      return "destructive";
  }
}
