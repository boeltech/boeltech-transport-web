import type { OperatorPaymentReadiness } from "../../domain/entities";
import type { OperatorPaymentReadinessStatus } from "../../domain/enums";

/**
 * Bloqueantes primero (C5 + C):
 * No pagable → Programada → Sin tarifa → dual → Sin CLABE → reemplazada → listo.
 */
const STATUS_SORT_ORDER: Record<OperatorPaymentReadinessStatus, number> = {
  template_not_payable: 0,
  template_scheduled: 1,
  no_template: 2,
  dual_template: 3,
  no_clabe: 4,
  version_superseded: 5,
  ready: 6,
};

export function compareOperatorsByAttentionPriority(
  a: OperatorPaymentReadiness,
  b: OperatorPaymentReadiness,
): number {
  const byStatus =
    (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99);
  if (byStatus !== 0) return byStatus;
  return a.fullName.localeCompare(b.fullName, "es");
}

export function sortOperatorsByAttentionPriority(
  rows: readonly OperatorPaymentReadiness[],
): OperatorPaymentReadiness[] {
  return [...rows].sort(compareOperatorsByAttentionPriority);
}
