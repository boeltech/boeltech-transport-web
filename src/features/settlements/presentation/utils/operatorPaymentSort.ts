import type { OperatorPaymentReadiness } from "../../domain/entities";
import type { OperatorPaymentReadinessStatus } from "../../domain/enums";

/** Bloqueantes primero (C5): Sin tarifa → dual → Sin CLABE → reemplazada → listo. */
const STATUS_SORT_ORDER: Record<OperatorPaymentReadinessStatus, number> = {
  no_template: 0,
  dual_template: 1,
  no_clabe: 2,
  version_superseded: 3,
  ready: 4,
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
