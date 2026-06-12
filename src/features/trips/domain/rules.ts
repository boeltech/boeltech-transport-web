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

import type { DomainResult, ValidationResult } from "@shared/utils/errorMapper";
import {
  canTransitionTo as canTransitionToShared,
  canEditTrip as canEditTripShared,
  canManageTripExpenses as canManageTripExpensesShared,
  canDeleteTrip as canDeleteTripShared,
  canStartTrip as canStartTripShared,
  getAvailableTransitions as getAvailableTransitionsShared,
  isTerminalStatus as isTerminalStatusShared,
  calculateTotalCost as calculateTotalCostShared,
} from "@boeltech/cfdi-domain";
import {
  StopStatus,
  TRIP_STATUS_LABELS,
  TripStatus,
  type TripStatusType,
} from "./enums";
import type { Trip, TripStop } from "./entities";

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
  const allowedTransitions = getAvailableTransitionsShared(currentStatus);

  if (!allowedTransitions || allowedTransitions.length === 0) {
    return {
      success: false,
      error: {
        code: "STATUS_FINAL",
        message: `El estado "${getStatusLabel(currentStatus)}" es final y no puede cambiar`,
      },
    };
  }

  if (!canTransitionToShared(currentStatus, newStatus)) {
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
  return canTransitionToShared(currentStatus, newStatus);
}

/**
 * Verifica si un viaje puede ser editado
 * Solo viajes en draft o scheduled pueden editarse
 */
export function canEditTrip(status: TripStatusType): boolean {
  return canEditTripShared(status);
}

/**
 * Verifica si se pueden registrar o modificar gastos/costos del viaje.
 * Incluye `in_progress` para captura operativa; excluye estados terminales.
 */
export function canManageTripExpenses(status: TripStatusType): boolean {
  return canManageTripExpensesShared(status);
}

/**
 * Verifica si un viaje puede ser eliminado
 * Solo viajes en draft pueden eliminarse
 */
export function canDeleteTrip(status: TripStatusType): boolean {
  return canDeleteTripShared(status);
}

/**
 * Verifica si un viaje puede iniciarse
 */
export function canStartTrip(status: TripStatusType): boolean {
  return canStartTripShared(status);
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
  return isTerminalStatusShared(status);
}

/**
 * Obtiene los estados a los que puede transicionar un viaje
 */
export function getAvailableTransitions(
  currentStatus: TripStatusType,
): TripStatusType[] {
  return getAvailableTransitionsShared(currentStatus);
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
  return calculateTotalCostShared(baseRate, fuelCost, tollCost, otherCosts);
}

// ============================================================================
// STOP RULES
// ============================================================================

/**
 * Obtiene las paradas ordenadas por sequenceOrder
 */
export function getOrderedStops(stops: readonly TripStop[]): TripStop[] {
  return [...stops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
}

/**
 * Paradas con status `completed` (misma métrica que timeline de Seguimiento).
 */
export function countCompletedStops(stops: readonly TripStop[]): number {
  return stops.filter((stop) => stop.status === StopStatus.COMPLETED).length;
}

/**
 * Porcentaje de paradas completadas respecto al total de la ruta.
 * Alineado a `progress.percent_complete` del timeline de tracking.
 */
export function calculateStopsProgress(stops: TripStop[]): number {
  if (stops.length === 0) return 0;
  return Math.round((countCompletedStops(stops) / stops.length) * 100);
}

/**
 * Verifica si se pueden modificar las paradas de un viaje
 */
export function canModifyStops(status: TripStatusType): boolean {
  return status === TripStatus.DRAFT || status === TripStatus.SCHEDULED;
}

// ============================================================================
// BUSINESS VALIDATIONS
// ============================================================================

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
