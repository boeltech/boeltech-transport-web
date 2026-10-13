/**
 * Orden de viaje operativa (pedido 2026-10-12-orden-de-viaje).
 * Documento PDF versionado al conductor — NO es CFDI ni Carta Porte 3.1.
 *
 * Contrato: GET/POST /trips/:tripId/trip-order · GET …/trip-order/file
 * (camelCase vía mapper; el API responde snake_case).
 */

import type { TripStatusType } from "./enums";

export type TripOrderReasonCode =
  | "TRIP_ORDER_DISABLED"
  | "TRIP_ORDER_STATUS_DRAFT"
  | "TRIP_ORDER_STATUS_CANCELLED"
  | "TRIP_ORDER_THRESHOLD_INCOMPLETE"
  | "TRIP_ORDER_NO_EMISSION"
  | "TRIP_ORDER_NOT_OUTDATED";

export type TripOrderThresholdMissing =
  | "origin"
  | "destination"
  | "vehicle"
  | "driver";

export interface TripOrderEmission {
  id: string;
  version: number;
  issuedAt: string;
  issuedByUserId: string | null;
  issuedByName: string | null;
  tripStatusAtIssue: TripStatusType;
  /** Solo API calcula; no recalcular en cliente. */
  outdated: boolean;
  filename: string;
}

export interface TripOrderThreshold {
  met: boolean;
  missing: TripOrderThresholdMissing[];
}

export interface TripOrderEligibility {
  canGenerate: boolean;
  canRegenerate: boolean;
  canDownload: boolean;
  reasonCode: TripOrderReasonCode | null;
}

/** Vista GET /trips/:tripId/trip-order (ya en camelCase). */
export interface TripOrderStatus {
  tripId: string;
  /** Kill-switch API: `false` → ocultar card. */
  enabled: boolean;
  threshold: TripOrderThreshold;
  eligibility: TripOrderEligibility;
  currentEmission: TripOrderEmission | null;
  emissionCount: number;
}

export interface GenerateTripOrderResult {
  emission: TripOrderEmission;
  message: string;
}
