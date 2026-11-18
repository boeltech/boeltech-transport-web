/**
 * Modelo puro de la franja del viaje (D2 / Q8): fases + 6 datos clave.
 * Sin JSX — el componente solo pinta.
 */

import {
  StopStatus,
  TripStatus,
  type Trip,
  type TripStatusHistory,
  type TripStatusType,
  type TripStop,
} from "@features/trips/domain";

export type TripJourneyPhaseId =
  | "draft"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TripJourneyPhaseState = "done" | "current" | "upcoming";

export type TripJourneyPhase = {
  readonly id: TripJourneyPhaseId;
  readonly label: string;
  readonly state: TripJourneyPhaseState;
  /** Fecha / hint bajo el nombre (p. ej. «10 nov», «desde 05:40»). */
  readonly detail: string | null;
  readonly stepNumber: number;
};

export type TripJourneyFactTone = "default" | "missing" | "warning";

export type TripJourneyFact = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string | null;
  readonly tone: TripJourneyFactTone;
};

export type TripJourneyStripModel = {
  readonly phases: readonly TripJourneyPhase[];
  readonly facts: readonly TripJourneyFact[];
};

export type BuildTripJourneyStripModelInput = {
  readonly trip: Trip;
  readonly status: TripStatusType;
  readonly orderedStops: readonly TripStop[];
  readonly cargoCount: number;
  readonly distanceKm: number | null;
  readonly durationLabel: string | null;
  readonly nowMs: number;
  readonly supportStaffCount?: number;
};

const PHASE_LABELS: Record<TripJourneyPhaseId, string> = {
  draft: "Reserva",
  scheduled: "Programado",
  in_progress: "En ruta",
  completed: "Completado",
  cancelled: "Cancelado",
};

function formatMoneyMxn(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDayMonthTime(date: Date): string {
  const day = formatDayMonth(date);
  const time = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${day}, ${time}`;
}

function formatTimeOnly(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function historyAt(
  history: readonly TripStatusHistory[] | undefined,
  status: TripStatusType,
): TripStatusHistory | undefined {
  if (!history?.length) return undefined;
  const matches = history.filter((h) => h.newStatus === status);
  return matches[matches.length - 1];
}

function phaseDetail(
  id: TripJourneyPhaseId,
  state: TripJourneyPhaseState,
  trip: Trip,
  orderedStops: readonly TripStop[],
): string | null {
  if (state === "upcoming") return null;

  if (id === "draft") {
    const h = historyAt(trip.statusHistory, TripStatus.DRAFT);
    const at = h?.changedAt ?? trip.createdAt;
    return at ? formatDayMonth(at) : null;
  }

  if (id === "scheduled") {
    const h = historyAt(trip.statusHistory, TripStatus.SCHEDULED);
    const at = h?.changedAt;
    if (state === "current" && at) {
      return `desde ${formatDayMonthTime(at)}`;
    }
    return at ? formatDayMonth(at) : null;
  }

  if (id === "in_progress") {
    const started =
      trip.actualDeparture ??
      historyAt(trip.statusHistory, TripStatus.IN_PROGRESS)?.changedAt;
    const arrivedCount = orderedStops.filter(
      (s) =>
        s.actualArrival != null || s.status === StopStatus.COMPLETED,
    ).length;
    const total = orderedStops.length;
    const parts: string[] = [];
    if (started) {
      parts.push(
        state === "current"
          ? `desde ${formatTimeOnly(started)}`
          : formatDayMonth(started),
      );
    }
    if (state === "current" && total > 0) {
      const currentIndex = Math.min(arrivedCount + 1, total);
      parts.push(`parada ${currentIndex} de ${total}`);
    }
    return parts.length ? parts.join(" · ") : null;
  }

  if (id === "completed") {
    const at =
      trip.actualArrival ??
      historyAt(trip.statusHistory, TripStatus.COMPLETED)?.changedAt;
    return at ? formatDayMonth(at) : null;
  }

  if (id === "cancelled") {
    const h = historyAt(trip.statusHistory, TripStatus.CANCELLED);
    const at = h?.changedAt;
    const who = h?.changedByName?.trim();
    if (at && who) return `${formatDayMonth(at)} · ${who}`;
    if (at) return formatDayMonth(at);
    return who ?? null;
  }

  return null;
}

function buildPhases(
  status: TripStatusType,
  trip: Trip,
  orderedStops: readonly TripStop[],
): TripJourneyPhase[] {
  if (status === TripStatus.CANCELLED) {
    const ids: TripJourneyPhaseId[] = [
      "draft",
      "scheduled",
      "in_progress",
      "cancelled",
    ];
    // Si nunca salió a ruta, omitir «En ruta» como done vacío: marcar upcoming
    // salvo que haya actualDeparture / historial in_progress.
    const hadInProgress = Boolean(
      trip.actualDeparture ||
        historyAt(trip.statusHistory, TripStatus.IN_PROGRESS),
    );
    return ids.map((id, index) => {
      let state: TripJourneyPhaseState = "done";
      if (id === "cancelled") state = "current";
      else if (id === "in_progress" && !hadInProgress) state = "upcoming";
      else if (id === "scheduled" && !historyAt(trip.statusHistory, TripStatus.SCHEDULED) && !hadInProgress) {
        // Cancelado desde reserva: programado puede no haberse alcanzado
        const hadScheduled = Boolean(
          historyAt(trip.statusHistory, TripStatus.SCHEDULED),
        );
        if (!hadScheduled && status === TripStatus.CANCELLED) {
          // keep done if we don't know — cancelado from draft still shows path
        }
      }
      return {
        id,
        label: PHASE_LABELS[id],
        state,
        detail: phaseDetail(id, state, trip, orderedStops),
        stepNumber: index + 1,
      };
    });
  }

  const sequence: TripJourneyPhaseId[] = [
    "draft",
    "scheduled",
    "in_progress",
    "completed",
  ];
  const currentIndex =
    status === TripStatus.DRAFT
      ? 0
      : status === TripStatus.SCHEDULED
        ? 1
        : status === TripStatus.IN_PROGRESS
          ? 2
          : 3;

  return sequence.map((id, index) => {
    const state: TripJourneyPhaseState =
      index < currentIndex
        ? "done"
        : index === currentIndex
          ? "current"
          : "upcoming";
    return {
      id,
      label: PHASE_LABELS[id],
      state,
      detail: phaseDetail(id, state, trip, orderedStops),
      stepNumber: index + 1,
    };
  });
}

function buildFacts(input: BuildTripJourneyStripModelInput): TripJourneyFact[] {
  const {
    trip,
    status,
    orderedStops,
    cargoCount,
    distanceKm,
    durationLabel,
    nowMs,
    supportStaffCount = 0,
  } = input;

  const scheduledDep = trip.scheduledDeparture;
  const actualDep = trip.actualDeparture;
  const scheduledArr = trip.scheduledArrival;
  const actualArr = trip.actualArrival;

  const departed = Boolean(actualDep);
  const departureOverdue =
    status === TripStatus.SCHEDULED &&
    scheduledDep != null &&
    scheduledDep.getTime() < nowMs &&
    !departed;

  const arrivalOverdue =
    (status === TripStatus.SCHEDULED || status === TripStatus.IN_PROGRESS) &&
    scheduledArr != null &&
    scheduledArr.getTime() < nowMs &&
    !actualArr;

  // ── Salida ──────────────────────────────────────────────────────────────
  let departureValue = "—";
  let departureDetail: string | null = null;
  let departureTone: TripJourneyFactTone = "default";

  if (status === TripStatus.CANCELLED && !departed) {
    departureValue = scheduledDep ? formatDayMonthTime(scheduledDep) : "—";
    departureDetail = "No se realizó";
  } else if (departed && actualDep) {
    departureValue = formatDayMonthTime(actualDep);
    departureDetail = scheduledDep
      ? `Programada ${formatTimeOnly(scheduledDep)}`
      : null;
  } else if (scheduledDep) {
    departureValue = formatDayMonthTime(scheduledDep);
    if (departureOverdue) {
      departureDetail = "Ya pasó · sin salir";
      departureTone = "warning";
    } else {
      departureDetail = "Programada";
    }
  }

  // ── Llegada ─────────────────────────────────────────────────────────────
  const arrivalLabel =
    status === TripStatus.COMPLETED || actualArr
      ? "Llegada"
      : "Llegada estimada";
  let arrivalValue = "—";
  let arrivalDetail: string | null = null;
  let arrivalTone: TripJourneyFactTone = "default";

  if (status === TripStatus.DRAFT && !scheduledArr) {
    arrivalValue = "Falta";
    arrivalDetail = "Se pide al confirmar";
    arrivalTone = "missing";
  } else if (status === TripStatus.CANCELLED && !actualArr) {
    arrivalValue = scheduledArr ? formatDayMonthTime(scheduledArr) : "—";
    arrivalDetail = "No se realizó";
  } else if (actualArr) {
    arrivalValue = formatDayMonthTime(actualArr);
    if (scheduledArr) {
      const deltaMin = Math.round(
        (actualArr.getTime() - scheduledArr.getTime()) / 60_000,
      );
      if (deltaMin === 0) arrivalDetail = "A tiempo";
      else if (deltaMin < 0) arrivalDetail = `${Math.abs(deltaMin)} min antes`;
      else arrivalDetail = `${deltaMin} min después`;
    }
  } else if (scheduledArr) {
    arrivalValue = formatDayMonthTime(scheduledArr);
    if (arrivalOverdue) {
      arrivalDetail = "Ya pasó";
      arrivalTone = "warning";
    } else if (status === TripStatus.IN_PROGRESS) {
      arrivalDetail = "A tiempo";
    } else {
      arrivalDetail = "Programada";
    }
  }

  // ── Unidad ──────────────────────────────────────────────────────────────
  let unitValue = "Sin asignar";
  let unitDetail: string | null = "Asigna flota";
  let unitTone: TripJourneyFactTone = "missing";
  if (trip.vehicle) {
    unitValue = trip.vehicle.unitNumber || trip.vehicle.licensePlate || "—";
    unitTone = "default";
    const plate = trip.vehicle.licensePlate;
    const trailerCount = trip.trailers?.length ?? 0;
    const parts: string[] = [];
    if (plate && plate !== unitValue) parts.push(plate);
    if (trailerCount > 0) {
      parts.push(trailerCount === 1 ? "1 remolque" : `${trailerCount} remolques`);
    }
    unitDetail = parts.length ? parts.join(" · ") : null;
  }

  // ── Operador ────────────────────────────────────────────────────────────
  let driverValue = "Sin asignar";
  let driverDetail: string | null = "Asigna flota";
  let driverTone: TripJourneyFactTone = "missing";
  if (trip.driver) {
    driverValue = trip.driver.fullName || "—";
    driverTone = "default";
    driverDetail =
      supportStaffCount > 0
        ? `+ ${supportStaffCount} de apoyo`
        : "Sin equipo de apoyo";
  }

  // ── Recorrido ───────────────────────────────────────────────────────────
  let routeValue = "—";
  let routeDetail: string | null = null;
  let routeTone: TripJourneyFactTone = "default";
  const stopCount = orderedStops.length;
  const hasReserveCities =
    Boolean(trip.originCity?.trim()) || Boolean(trip.destinationCity?.trim());
  const stopCargoDetail = [
    stopCount > 0
      ? stopCount === 1
        ? "1 parada"
        : `${stopCount} paradas`
      : null,
    cargoCount > 0
      ? cargoCount === 1
        ? "1 carga"
        : `${cargoCount} cargas`
      : "sin cargas",
  ]
    .filter(Boolean)
    .join(" · ");

  if (status === TripStatus.IN_PROGRESS && distanceKm != null && distanceKm > 0) {
    const planned = trip.totalDistRec ?? distanceKm;
    routeValue = `${Math.round(planned).toLocaleString("es-MX")} km`;
    routeDetail = stopCargoDetail;
  } else if (status === TripStatus.COMPLETED) {
    const km =
      trip.mileage.end != null && trip.mileage.start != null
        ? Math.max(0, trip.mileage.end - trip.mileage.start)
        : distanceKm;
    routeValue =
      km != null && km > 0 ? `${Math.round(km).toLocaleString("es-MX")} km` : "—";
    const parts = [durationLabel, stopCargoDetail].filter(Boolean);
    routeDetail = parts.length ? parts.join(" · ") : null;
  } else if (distanceKm != null && distanceKm > 0) {
    routeValue = `${Math.round(distanceKm).toLocaleString("es-MX")} km`;
    routeDetail = stopCargoDetail;
  } else if (
    status === TripStatus.DRAFT &&
    stopCount === 0 &&
    hasReserveCities
  ) {
    // F8c AmbosCiudad — franja Recorrido (PRD C.2).
    routeValue = "Faltan origen y destino";
    routeDetail = "Solo ciudades";
    routeTone = "missing";
  } else {
    routeValue = stopCount > 0 ? stopCargoDetail : "—";
    routeDetail = cargoCount > 0 ? null : stopCargoDetail;
  }

  // ── Tarifa ──────────────────────────────────────────────────────────────
  const rate = trip.costs.baseRate;
  let rateValue = "—";
  let rateDetail: string | null = null;
  let rateTone: TripJourneyFactTone = "default";

  if (status === TripStatus.DRAFT && (rate == null || rate <= 0)) {
    rateValue = "Falta";
    rateDetail = "Se pide al confirmar";
    rateTone = "missing";
  } else if (rate != null && rate > 0) {
    rateValue = formatMoneyMxn(rate);
    if (trip.cfdiEmissionIntent === "sin_cfdi_efectivo") {
      const pending =
        trip.operationalCash?.pendingAmount ??
        Math.max(0, rate - (trip.operationalCashAmount ?? 0));
      if (pending <= 0.01) {
        rateDetail = "Cobrado";
      } else {
        rateDetail = `Falta cobrar ${formatMoneyMxn(pending)}`;
      }
    } else if (trip.invoicing.invoiceStatus === "stamped") {
      const cobrado = trip.cobradoViaje ?? 0;
      const facturado = trip.facturadoVigente ?? rate;
      rateDetail =
        cobrado + 0.01 >= facturado ? "Facturada · cobrada" : "Facturada · por cobrar";
    } else if (status === TripStatus.CANCELLED && trip.invoicing.invoiceId) {
      rateDetail = "Factura vigente";
    } else {
      rateDetail = "Por facturar";
    }
  }

  return [
    {
      id: "departure",
      label: "Salida",
      value: departureValue,
      detail: departureDetail,
      tone: departureTone,
    },
    {
      id: "arrival",
      label: arrivalLabel,
      value: arrivalValue,
      detail: arrivalDetail,
      tone: arrivalTone,
    },
    {
      id: "unit",
      label: "Unidad",
      value: unitValue,
      detail: unitDetail,
      tone: unitTone,
    },
    {
      id: "driver",
      label: "Operador",
      value: driverValue,
      detail: driverDetail,
      tone: driverTone,
    },
    {
      id: "route",
      label: "Recorrido",
      value: routeValue,
      detail: routeDetail,
      tone: routeTone,
    },
    {
      id: "rate",
      label: "Tarifa",
      value: rateValue,
      detail: rateDetail,
      tone: rateTone,
    },
  ];
}

export function buildTripJourneyStripModel(
  input: BuildTripJourneyStripModelInput,
): TripJourneyStripModel {
  return {
    phases: buildPhases(input.status, input.trip, input.orderedStops),
    facts: buildFacts(input),
  };
}
