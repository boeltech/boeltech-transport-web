/**
 * ADR-0096 — gate UX de cargas para viajes `sin_cfdi_efectivo`.
 * Espeja `requireActiveCargoForSinCfdiEmission` del dominio compartido.
 */

import {
  requireActiveCargoForSinCfdiEmission,
  TRIP_SIN_CFDI_CARGO_REQUIRED_CODE,
  type CfdiEmissionIntent,
} from "@boeltech/cfdi-domain";
import { isApiError } from "@shared/api/interceptors/error-handler";

import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";

export type SinCfdiCargoGateAction = "start" | "complete";

export type TripCargoStatusLike = { readonly status: string };

const cargoGateCopy = cfdiEmissionIntentCopy.cargoGate;

/** Conteos con status <> cancelled (paridad API / domain). */
export function countActiveTripCargos(
  cargos: readonly TripCargoStatusLike[],
): number {
  return cargos.filter((cargo) => cargo.status !== "cancelled").length;
}

/**
 * Motivo UI para deshabilitar Iniciar / Completar / QuickClose.
 * `null` si el gate no aplica (emitir_cfdi, o hay ≥1 carga activa).
 */
export function sinCfdiCargoBlockReason(
  intent: CfdiEmissionIntent | null | undefined,
  cargos: readonly TripCargoStatusLike[],
  action: SinCfdiCargoGateAction,
): string | null {
  const resolvedIntent: CfdiEmissionIntent = intent ?? "emitir_cfdi";
  const result = requireActiveCargoForSinCfdiEmission({
    intent: resolvedIntent,
    activeCargoCount: countActiveTripCargos(cargos),
  });
  if (result.ok) return null;
  return action === "start"
    ? cargoGateCopy.ctaStartBlocked
    : cargoGateCopy.ctaCompleteBlocked;
}

/** Mensaje toast/sheet cuando el API responde `TRIP_SIN_CFDI_CARGO_REQUIRED`. */
export function resolveSinCfdiCargoApiErrorMessage(
  error: unknown,
): string | null {
  if (
    isApiError(error) &&
    error.code === TRIP_SIN_CFDI_CARGO_REQUIRED_CODE
  ) {
    return cargoGateCopy.alertSheet;
  }
  return null;
}
