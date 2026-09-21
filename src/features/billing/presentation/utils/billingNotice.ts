/**
 * Aviso único de `/settings/subscription`.
 *
 * Solo se muestra el primero que aplique, de mayor a menor gravedad. Las
 * condiciones que no ganan quedan como texto secundario en su bloque, nunca
 * como una alerta adicional.
 *
 * Prioridad (producto PD2/PD5 · ADR-0072 · ADR-0095 · Capa 1 D3):
 * no_plan → blocked → past_due (sin saldo open) → trial_exhausted →
 * trial_ended → stamps_exhausted → stamps_low → capacity_over_quota
 *
 * El saldo open (`hasOpenArrears`) se muestra en `BillingArrearsCard`, no como
 * aviso duplicado. Con saldo open, `past_due` también se omite (la card cubre).
 *
 * OVER_LIMIT (users/branches): un solo notice `capacity_over_quota`; el alcance
 * (users | branches | both) lo resuelve la UI con los flags de input.
 *
 * El fin de prueba se resuelve por `status` cuando el API lo expresa; si sigue
 * en `trialing` la fecha solo puede compararse contra el reloj del navegador.
 */

import {
  STAMP_USAGE_EXHAUSTED_PERCENT,
  STAMP_USAGE_WARNING_PERCENT,
} from "./stampUsageThresholds";

export type BillingNoticeId =
  | "no_plan"
  | "blocked"
  | "arrears"
  | "past_due"
  | "trial_exhausted"
  | "trial_ended"
  | "stamps_exhausted"
  | "stamps_low"
  | "capacity_over_quota"
  /** @deprecated Prefer `capacity_over_quota` (ADR-0095). */
  | "branches_over_quota";

export type CapacityOverQuotaScope = "users" | "branches" | "both";

export interface BillingNoticeInput {
  /** Falso mientras la suscripción no ha resuelto: no se decide nada aún. */
  isSubscriptionResolved: boolean;
  status?: string | null;
  trialEndsAt?: string | null;
  includedStamps?: number | null;
  stampsUsed?: number | null;
  usagePercent: number;
  /** Preferir snapshot `capacity.branches.overQuota` (ADR-0095). */
  branchesOverQuota: boolean;
  /** Snapshot `capacity.users.overQuota` (ADR-0095). */
  usersOverQuota?: boolean;
  /** `total_open_cents > 0` desde GET /billing/arrears — card, no notice. */
  hasOpenArrears?: boolean;
  /** Referencia temporal inyectable (tests y comparación de fin de prueba). */
  now?: number;
}

const BLOCKED_STATUSES = new Set(["paused", "canceled"]);

export function resolveCapacityOverQuotaScope(input: {
  usersOverQuota?: boolean;
  branchesOverQuota?: boolean;
}): CapacityOverQuotaScope | null {
  const users = Boolean(input.usersOverQuota);
  const branches = Boolean(input.branchesOverQuota);
  if (users && branches) return "both";
  if (users) return "users";
  if (branches) return "branches";
  return null;
}

export function resolveBillingNotice(
  input: BillingNoticeInput,
): BillingNoticeId | null {
  if (!input.isSubscriptionResolved) return null;

  const { status } = input;
  if (!status) return "no_plan";
  if (BLOCKED_STATUSES.has(status)) return "blocked";

  // D3: saldo open → BillingArrearsCard; no emitir notice `arrears`.
  // Tampoco past_due si ya hay card de saldo (evita doble mensaje de cobro).
  if (status === "past_due" && !input.hasOpenArrears) return "past_due";

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

  if (input.usersOverQuota || input.branchesOverQuota) {
    return "capacity_over_quota";
  }

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
