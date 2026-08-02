/**
 * Aviso único de `/settings/subscription`.
 *
 * Solo se muestra el primero que aplique, de mayor a menor gravedad. Las
 * condiciones que no ganan quedan como texto secundario en su bloque, nunca
 * como una alerta adicional.
 *
 * El fin de prueba se resuelve por `status` cuando el API lo expresa; si sigue
 * en `trialing` la fecha solo puede compararse contra el reloj del navegador,
 * así que el aviso es informativo y no afirma que el timbrado esté bloqueado.
 */

import {
  STAMP_USAGE_EXHAUSTED_PERCENT,
  STAMP_USAGE_WARNING_PERCENT,
} from "./stampUsageThresholds";

export type BillingNoticeId =
  | "no_plan"
  | "blocked"
  | "trial_exhausted"
  | "trial_ended"
  | "stamps_exhausted"
  | "stamps_low"
  | "branches_over_quota";

export interface BillingNoticeInput {
  /** Falso mientras la suscripción no ha resuelto: no se decide nada aún. */
  isSubscriptionResolved: boolean;
  status?: string | null;
  trialEndsAt?: string | null;
  includedStamps?: number | null;
  stampsUsed?: number | null;
  usagePercent: number;
  branchesOverQuota: boolean;
  /** Referencia temporal inyectable (tests y comparación de fin de prueba). */
  now?: number;
}

const BLOCKED_STATUSES = new Set(["paused", "canceled"]);

export function resolveBillingNotice(
  input: BillingNoticeInput,
): BillingNoticeId | null {
  if (!input.isSubscriptionResolved) return null;

  const { status } = input;
  if (!status) return "no_plan";
  if (BLOCKED_STATUSES.has(status)) return "blocked";

  const isTrialing = status === "trialing";
  const includedStamps = input.includedStamps ?? null;
  const stampsUsed = input.stampsUsed ?? null;

  if (
    isTrialing &&
    includedStamps != null &&
    stampsUsed != null &&
    includedStamps > 0 &&
    stampsUsed >= includedStamps
  ) {
    return "trial_exhausted";
  }

  if (isTrialing && isTrialDateReached(input.trialEndsAt, input.now)) {
    return "trial_ended";
  }

  if (input.usagePercent >= STAMP_USAGE_EXHAUSTED_PERCENT) {
    return "stamps_exhausted";
  }

  if (input.usagePercent >= STAMP_USAGE_WARNING_PERCENT) {
    return "stamps_low";
  }

  if (input.branchesOverQuota) return "branches_over_quota";

  return null;
}

export function isTrialDateReached(
  trialEndsAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!trialEndsAt) return false;
  const endsAt = new Date(trialEndsAt).getTime();
  if (Number.isNaN(endsAt)) return false;
  return endsAt <= now;
}
