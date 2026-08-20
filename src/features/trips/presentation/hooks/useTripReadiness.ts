import { useMemo } from "react";
import { configVehicularLikelyRequiresRemolques } from "@boeltech/cfdi-domain";

import type { Trip, TripCargo, TripStop } from "@features/trips/domain";
import { isTripRouteReadyForStartUi } from "../utils/tripStartRouteGating";

export type TripReadinessGroup = "schedule" | "operate";

export type TripReadinessCheckId =
  | "order"
  | "fleet"
  | "departure"
  | "arrival"
  | "rate"
  | "mileage"
  | "route"
  | "cargo";

export type TripReadinessTab = "overview" | "route" | "cargo" | "costs";

export interface TripReadinessItem {
  readonly id: TripReadinessCheckId;
  readonly done: boolean;
  readonly group: TripReadinessGroup;
  readonly tab?: TripReadinessTab;
}

export interface TripReadiness {
  readonly items: TripReadinessItem[];
  /**
   * Completitud de detalle (programar + paradas + cargas).
   * No es elegibilidad de start (`canStartTrip`); no usarla para Iniciar.
   */
  readonly allDone: boolean;
  readonly scheduleReady: boolean;
  readonly fleetReady: boolean;
}

export interface TripReadinessTripInput {
  readonly clientId?: string | null;
  readonly vehicleId?: string | null;
  readonly driverId?: string | null;
  readonly originCity?: string | null;
  readonly destinationCity?: string | null;
  readonly scheduledDeparture?: Date | string | null;
  readonly scheduledArrival?: Date | string | null;
  readonly startMileage?: number | null;
  readonly stops?: readonly Pick<TripStop, "stopType">[] | readonly unknown[] | null;
  readonly trailers?: readonly unknown[] | null;
  readonly costs?: { readonly baseRate?: number | null } | null;
  readonly cfdiDocumentIntent?: "ingreso" | "traslado" | null;
}

function hasText(value: string | null | undefined, min = 1): boolean {
  return (value ?? "").trim().length >= min;
}

function isInstantReady(value: Date | string | null | undefined): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }
  return hasText(typeof value === "string" ? value : null);
}

function isOrderReady(trip: TripReadinessTripInput): boolean {
  return hasText(trip.clientId);
}

function isFleetReady(
  trip: TripReadinessTripInput,
  satConfigAutotransporteCode?: string | null,
): boolean {
  if (!hasText(trip.vehicleId) || !hasText(trip.driverId)) {
    return false;
  }

  const config = (satConfigAutotransporteCode ?? "").trim();
  if (!config) {
    return true;
  }

  if (configVehicularLikelyRequiresRemolques(config)) {
    return (trip.trailers?.length ?? 0) >= 1;
  }

  return true;
}

function hasStopType(
  stop: unknown,
): stop is Pick<TripStop, "stopType"> {
  return Boolean(stop && typeof stop === "object" && "stopType" in stop);
}

function isRouteReady(trip: TripReadinessTripInput): boolean {
  const stops = (trip.stops ?? []).filter(hasStopType);
  return isTripRouteReadyForStartUi(stops);
}

function isCargoReady(cargoCount: number): boolean {
  return cargoCount >= 1;
}

function isRateReady(trip: TripReadinessTripInput): boolean {
  if (trip.cfdiDocumentIntent === "traslado") {
    return true;
  }
  return (trip.costs?.baseRate ?? 0) > 0;
}

function isMileageReady(trip: TripReadinessTripInput): boolean {
  return trip.startMileage != null;
}

export function computeTripReadiness(
  trip: TripReadinessTripInput,
  options?: {
    cargoCount?: number;
    satConfigAutotransporteCode?: string | null;
  },
): TripReadiness {
  const fleetReady = isFleetReady(trip, options?.satConfigAutotransporteCode);
  const routeReady = isRouteReady(trip);

  const items: TripReadinessItem[] = [
    { id: "order", done: isOrderReady(trip), group: "schedule" },
    { id: "fleet", done: fleetReady, group: "schedule" },
    {
      id: "departure",
      done: isInstantReady(trip.scheduledDeparture),
      group: "schedule",
      tab: "overview",
    },
    {
      id: "arrival",
      done: isInstantReady(trip.scheduledArrival),
      group: "schedule",
      tab: "overview",
    },
    {
      id: "rate",
      done: isRateReady(trip),
      group: "schedule",
      tab: "costs",
    },
    {
      id: "mileage",
      done: isMileageReady(trip),
      group: "schedule",
      tab: "overview",
    },
    {
      id: "route",
      done: routeReady,
      group: "operate",
      tab: "route",
    },
    {
      id: "cargo",
      done: isCargoReady(options?.cargoCount ?? 0),
      group: "operate",
      tab: routeReady ? "cargo" : "route",
    },
  ];

  const scheduleItems = items.filter((item) => item.group === "schedule");
  const scheduleReady = scheduleItems.every((item) => item.done);

  return {
    items,
    allDone: items.every((item) => item.done),
    scheduleReady,
    fleetReady,
  };
}

export function useTripReadiness(
  trip: Pick<
    Trip,
    | "clientId"
    | "vehicleId"
    | "driverId"
    | "originCity"
    | "destinationCity"
    | "scheduledDeparture"
    | "scheduledArrival"
    | "stops"
    | "trailers"
    | "costs"
    | "cfdiDocumentIntent"
  > & { mileage?: { start?: number | null } },
  cargos: readonly TripCargo[] | undefined,
  satConfigAutotransporteCode?: string | null,
): TripReadiness {
  const cargoCount = cargos?.length ?? 0;

  return useMemo(
    () =>
      computeTripReadiness(
        {
          ...trip,
          startMileage: trip.mileage?.start,
        },
        {
          cargoCount,
          satConfigAutotransporteCode,
        },
      ),
    [trip, cargoCount, satConfigAutotransporteCode],
  );
}
