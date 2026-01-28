/**
 * Trip Domain Rules
 * Clean Architecture - Domain Layer
 *
 * Reglas de negocio puras que definen el comportamiento del dominio.
 * Estas funciones NO tienen efectos secundarios y son fácilmente testeables.
 *
 * NOTA: El tripCode lo genera el BACKEND automáticamente.
 * No incluimos generateTripCode aquí.
 */

import {
  type Trip,
  type TripStatusType,
  type StopTypeValue,
  type TripStop,
  type DomainResult,
  type ValidationResult,
  TripStatus,
  StopType,
  VALID_STATUS_TRANSITIONS,
  UNIQUE_STOP_TYPES,
  TRIP_STATUS_LABELS,
} from "./entities";

// ============================================================================
// STATUS TRANSITION VALIDATORS
// ============================================================================

/**
 * Valida si una transición de estado es válida
 */
export function validateStatusTransition(
  currentStatus: TripStatusType,
  newStatus: TripStatusType,
): ValidationResult {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions || allowedTransitions.length === 0) {
    return {
      success: false,
      error: {
        code: "STATUS_FINAL",
        message: `El estado "${getStatusLabel(currentStatus)}" es final y no puede cambiar`,
      },
    };
  }

  if (!allowedTransitions.includes(newStatus)) {
    return {
      success: false,
      error: {
        code: "INVALID_STATUS_TRANSITION",
        message: `No se puede cambiar de "${getStatusLabel(currentStatus)}" a "${getStatusLabel(newStatus)}"`,
      },
    };
  }

  return { success: true };
}

/**
 * Verifica si una transición de estado es válida (versión booleana)
 */
export function canTransitionTo(
  currentStatus: TripStatusType,
  newStatus: TripStatusType,
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Verifica si un viaje puede ser editado
 * Solo viajes en draft o scheduled pueden editarse
 */
export function canEditTrip(status: TripStatusType): boolean {
  return status === TripStatus.DRAFT || status === TripStatus.SCHEDULED;
}

/**
 * Verifica si un viaje puede ser eliminado
 * Solo viajes en draft pueden eliminarse
 */
export function canDeleteTrip(status: TripStatusType): boolean {
  return status === TripStatus.DRAFT;
}

/**
 * Verifica si un viaje puede iniciarse
 */
export function canStartTrip(status: TripStatusType): boolean {
  return status === TripStatus.SCHEDULED;
}

/**
 * Verifica si un viaje puede finalizarse
 */
export function canFinishTrip(status: TripStatusType): boolean {
  return status === TripStatus.IN_PROGRESS;
}

/**
 * Verifica si un viaje puede cancelarse
 */
export function canCancelTrip(status: TripStatusType): boolean {
  return (
    status === TripStatus.DRAFT ||
    status === TripStatus.SCHEDULED ||
    status === TripStatus.IN_PROGRESS
  );
}

/**
 * Verifica si un viaje está activo (puede ser modificado)
 */
export function isTripActive(status: TripStatusType): boolean {
  return status === TripStatus.SCHEDULED || status === TripStatus.IN_PROGRESS;
}

/**
 * Verifica si un viaje está en un estado terminal
 */
export function isTerminalStatus(status: TripStatusType): boolean {
  return status === TripStatus.COMPLETED || status === TripStatus.CANCELLED;
}

/**
 * Obtiene los estados a los que puede transicionar un viaje
 */
export function getAvailableTransitions(
  currentStatus: TripStatusType,
): TripStatusType[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}

// ============================================================================
// MILEAGE CALCULATIONS
// ============================================================================

/**
 * Calcula la distancia recorrida
 */
export function calculateDistance(mileage: {
  start: number | null;
  end: number | null;
}): number | null {
  if (mileage.start === null || mileage.end === null) return null;
  return mileage.end - mileage.start;
}

/**
 * Valida que el kilometraje final sea mayor al inicial
 */
export function validateMileageRange(
  startMileage: number | null,
  endMileage: number,
): DomainResult<true> {
  if (startMileage !== null && endMileage < startMileage) {
    return {
      success: false,
      error: {
        code: "INVALID_MILEAGE",
        message: "El kilometraje final debe ser mayor o igual al inicial",
        field: "endMileage",
      },
    };
  }
  return { success: true, data: true };
}

// ============================================================================
// DURATION CALCULATIONS
// ============================================================================

/**
 * Calcula la duración del viaje en horas
 */
export function calculateTripDuration(trip: Trip): number | null {
  const start = trip.actualDeparture || trip.scheduledDeparture;
  const end = trip.actualArrival || trip.scheduledArrival;

  if (!start || !end) return null;

  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;

  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / (1000 * 60 * 60); // Convertir a horas
}

// ============================================================================
// COST CALCULATIONS
// ============================================================================

/**
 * Calcula el costo total de un viaje
 */
export function calculateTotalCost(
  baseRate: number,
  fuelCost: number,
  tollCost: number,
  otherCosts: number,
): number {
  return baseRate + fuelCost + tollCost + otherCosts;
}

// ============================================================================
// STOP RULES
// ============================================================================

/**
 * Verifica si se puede agregar un tipo de parada al viaje
 * Origin y Destination solo pueden existir una vez
 */
export function canAddStopType(
  currentStops: TripStop[],
  stopType: StopTypeValue,
): boolean {
  // Si no es un tipo único, siempre se puede agregar
  if (!UNIQUE_STOP_TYPES.includes(stopType)) {
    return true;
  }

  // Verificar que no exista ya una parada de este tipo
  return !currentStops.some((stop) => stop.stopType === stopType);
}

/**
 * Calcula el siguiente número de orden para una nueva parada
 */
export function getNextStopOrder(currentStops: TripStop[]): number {
  if (currentStops.length === 0) {
    return 1;
  }

  const maxOrder = Math.max(...currentStops.map((s) => s.sequenceOrder));
  return maxOrder + 1;
}

/**
 * Valida que las paradas tengan un orden válido (sin huecos)
 */
export function validateStopOrder(stops: TripStop[]): boolean {
  if (stops.length === 0) return true;

  const orders = stops.map((s) => s.sequenceOrder).sort((a, b) => a - b);

  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) {
      return false;
    }
  }

  return true;
}

/**
 * Obtiene las paradas ordenadas por sequenceOrder
 */
export function getOrderedStops(stops: TripStop[]): TripStop[] {
  return [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
}

/**
 * Verifica si una parada puede ser eliminada
 * No se pueden eliminar origin ni destination si son las únicas de su tipo
 */
export function canDeleteStop(
  stop: TripStop,
  allStops: TripStop[],
): { canDelete: boolean; reason?: string } {
  // Siempre se pueden eliminar paradas intermedias
  if (
    stop.stopType !== StopType.ORIGIN &&
    stop.stopType !== StopType.DESTINATION
  ) {
    return { canDelete: true };
  }

  // Para origin/destination, verificar que quede al menos una ruta válida
  const remainingStops = allStops.filter((s) => s.id !== stop.id);

  const hasOrigin = remainingStops.some((s) => s.stopType === StopType.ORIGIN);
  const hasDestination = remainingStops.some(
    (s) => s.stopType === StopType.DESTINATION,
  );

  if (stop.stopType === StopType.ORIGIN && !hasOrigin) {
    return {
      canDelete: false,
      reason: "No se puede eliminar el único origen del viaje",
    };
  }

  if (stop.stopType === StopType.DESTINATION && !hasDestination) {
    return {
      canDelete: false,
      reason: "No se puede eliminar el único destino del viaje",
    };
  }

  return { canDelete: true };
}

/**
 * Calcula el progreso de las paradas visitadas
 */
export function calculateStopsProgress(stops: TripStop[]): number {
  if (stops.length === 0) return 0;
  const visited = stops.filter((s) => s.actualArrival !== null).length;
  return Math.round((visited / stops.length) * 100);
}

/**
 * Verifica si se pueden modificar las paradas de un viaje
 */
export function canModifyStops(status: TripStatusType): boolean {
  return status === TripStatus.DRAFT || status === TripStatus.SCHEDULED;
}

/**
 * Verifica si una parada puede marcarse como visitada
 */
export function canMarkStopVisited(tripStatus: TripStatusType): boolean {
  return tripStatus === TripStatus.IN_PROGRESS;
}

// ============================================================================
// BUSINESS VALIDATIONS
// ============================================================================

/**
 * Valida los datos para finalizar un viaje
 */
export function validateFinishTripData(
  trip: Trip,
  endMileage: number,
  actualArrival: Date | string,
): ValidationResult {
  // Verificar que el viaje esté en curso
  if (trip.status !== TripStatus.IN_PROGRESS) {
    return {
      success: false,
      error: {
        code: "TRIP_NOT_IN_PROGRESS",
        message: "Solo se pueden finalizar viajes en curso",
      },
    };
  }

  // Validar kilometraje final
  if (endMileage === undefined || endMileage === null) {
    return {
      success: false,
      error: {
        code: "END_MILEAGE_REQUIRED",
        message: "El kilometraje final es requerido",
      },
    };
  }

  if (endMileage < 0) {
    return {
      success: false,
      error: {
        code: "INVALID_END_MILEAGE",
        message: "El kilometraje final no puede ser negativo",
      },
    };
  }

  // Validar que el kilometraje final sea mayor al inicial
  if (trip.mileage.start !== null && endMileage < trip.mileage.start) {
    return {
      success: false,
      error: {
        code: "END_MILEAGE_LESS_THAN_START",
        message: "El kilometraje final no puede ser menor al inicial",
      },
    };
  }

  // Validar fecha de llegada
  if (!actualArrival) {
    return {
      success: false,
      error: {
        code: "ACTUAL_ARRIVAL_REQUIRED",
        message: "La fecha de llegada es requerida",
      },
    };
  }

  const arrivalDate =
    typeof actualArrival === "string" ? new Date(actualArrival) : actualArrival;

  if (isNaN(arrivalDate.getTime())) {
    return {
      success: false,
      error: {
        code: "INVALID_ARRIVAL_DATE",
        message: "La fecha de llegada no es válida",
      },
    };
  }

  // Validar que la llegada sea posterior a la salida
  if (trip.actualDeparture && arrivalDate <= trip.actualDeparture) {
    return {
      success: false,
      error: {
        code: "ARRIVAL_BEFORE_DEPARTURE",
        message: "La fecha de llegada debe ser posterior a la de salida",
      },
    };
  }

  return { success: true };
}

/**
 * Valida que la fecha de llegada sea posterior a la salida
 */
export function validateDateRange(
  departureDate: Date,
  arrivalDate: Date,
): DomainResult<true> {
  if (arrivalDate < departureDate) {
    return {
      success: false,
      error: {
        code: "INVALID_DATE_RANGE",
        message: "La fecha de llegada debe ser posterior a la salida",
        field: "arrivalDate",
      },
    };
  }
  return { success: true, data: true };
}

/**
 * Valida que la fecha de salida no sea en el pasado
 */
export function validateDepartureNotInPast(
  departureDate: Date,
): ValidationResult {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (departureDate < now) {
    return {
      success: false,
      error: {
        code: "DEPARTURE_IN_PAST",
        message: "La fecha de salida no puede ser en el pasado",
      },
    };
  }

  return { success: true };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtiene la etiqueta en español de un estado
 */
export function getStatusLabel(status: TripStatusType): string {
  return TRIP_STATUS_LABELS[status] || status;
}

/**
 * Verifica si un viaje está en un estado activo (no terminal)
 */
export function isActiveTrip(status: TripStatusType): boolean {
  return !isTerminalStatus(status);
}
