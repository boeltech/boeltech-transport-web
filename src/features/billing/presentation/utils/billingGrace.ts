/**
 * Orientación de gracia SaaS v1 / v1.5 (PD3/PD4 · D1 · ADR-0072):
 * - Fallback local: 14 días desde `current_period_start` (mes CDMX).
 * - Tenant con ledger AR: preferir `oldest_due_date` de GET /billing/arrears.
 * El corte a `paused` es **manual** (`platform_owner`); no hay job de dunning
 * que el tenant deba interpretar como auto-pausa.
 * Tenant UI: comunican pago pendiente sin promesa de auto-pausa.
 * Platform UI: checklist de acción pendiente para el owner.
 */

/** Días desde `current_period_start` hasta la referencia de gracia (7 + 7). */
export const PAST_DUE_DAYS_UNTIL_PAUSE = 14;

/**
 * Fecha de referencia de gracia mientras `status === past_due`.
 * Usa el inicio del periodo de la suscripción (mes CDMX) + 14 días.
 * Preferir `resolveTenantGraceDeadline` en pantallas tenant cuando exista
 * `oldest_due_date` de API.
 */
export function resolvePastDueGraceDeadline(
  currentPeriodStart: string | null | undefined,
): Date | null {
  if (!currentPeriodStart) return null;

  const start = new Date(currentPeriodStart);
  if (Number.isNaN(start.getTime())) return null;

  const deadline = new Date(start.getTime());
  deadline.setUTCDate(deadline.getUTCDate() + PAST_DUE_DAYS_UNTIL_PAUSE);
  return deadline;
}

/**
 * Grace tenant (ADR-0072): `oldest_due_date` de arrears gana sobre
 * `current_period_start + 14`.
 */
export function resolveTenantGraceDeadline(args: {
  oldestDueDate?: string | null;
  currentPeriodStart?: string | null;
}): Date | null {
  if (args.oldestDueDate) {
    const fromApi = new Date(args.oldestDueDate);
    if (!Number.isNaN(fromApi.getTime())) return fromApi;
  }
  return resolvePastDueGraceDeadline(args.currentPeriodStart);
}

/** Filtra el historial para no repetir el mes vigente como «mes anterior». */
export function filterClosedBillingPeriods<T extends { periodKey: string }>(
  history: T[],
  currentPeriodKey: string | null | undefined,
): T[] {
  if (!currentPeriodKey) return history;
  return history.filter((item) => item.periodKey !== currentPeriodKey);
}
