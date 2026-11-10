/**
 * F6 — mapa avisos del corte → badges / acciones (PRD §H + DOM).
 * Exceso de deducciones = bloquea (nunca «incluido con $0»).
 */

import type {
  SettlementCutEffect,
  SettlementCutPreviewRow,
  SettlementCutWarningCode,
} from "../../domain/settlementCut";

export type SettlementCutBadgeVariant =
  | "destructive"
  | "warning"
  | "info"
  | "neutral";

export type SettlementCutRowAction =
  | "assign_tariff"
  | "view_operator"
  | "review"
  | "change_amount"
  | "view_trip"
  | "view_history"
  | "split_advance"
  | "define_payee"
  | "view"
  | null;

export interface SettlementCutWarningUi {
  label: string;
  badgeVariant: SettlementCutBadgeVariant;
  /** Categoría de efecto para footer / copy. */
  effectHint: "excluded" | "includable" | "blocking";
  action: SettlementCutRowAction;
}

const WARNING_UI: Record<SettlementCutWarningCode, SettlementCutWarningUi> = {
  no_payable_template: {
    label: "Sin tarifa",
    badgeVariant: "destructive",
    effectHint: "excluded",
    action: "assign_tariff",
  },
  salary_period_mismatch: {
    label: "Ritmo distinto",
    badgeVariant: "neutral",
    effectHint: "excluded",
    action: "view_operator",
  },
  inactive_or_terminated: {
    label: "Baja",
    badgeVariant: "neutral",
    effectHint: "excluded",
    action: "view_operator",
  },
  contractor_excluded: {
    label: "Contratista sin opt-in",
    badgeVariant: "neutral",
    effectHint: "excluded",
    action: "view_operator",
  },
  nothing_to_pay: {
    label: "Nada que pagar",
    badgeVariant: "neutral",
    effectHint: "excluded",
    action: "view_operator",
  },
  template_change_in_period: {
    label: "Dos tarifas en el periodo",
    badgeVariant: "warning",
    effectHint: "includable",
    action: "review",
  },
  open_advance: {
    label: "Anticipo abierto",
    badgeVariant: "info",
    effectHint: "includable",
    action: "change_amount",
  },
  template_version_superseded: {
    label: "Versión reemplazada",
    badgeVariant: "warning",
    effectHint: "includable",
    action: "review",
  },
  period_contained: {
    label: "Sueldo ya en otro pago",
    badgeVariant: "info",
    effectHint: "includable",
    action: null,
  },
  zero_km_trips: {
    label: "Viaje sin km",
    badgeVariant: "warning",
    effectHint: "includable",
    action: "view_trip",
  },
  period_partial_overlap: {
    label: "Solape parcial",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "view_history",
  },
  trip_in_active_settlement: {
    label: "Viaje ya en otro pago",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "view_history",
  },
  missing_ack_no_rule: {
    label: "Viaje sin regla",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "review",
  },
  missing_ack_zero_km: {
    label: "Viaje sin km",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "review",
  },
  missing_ack_zero_freight: {
    label: "Viaje sin flete",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "review",
  },
  deductions_exceed_capacity: {
    label: "Anticipo mayor que su pago",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "split_advance",
  },
  reimbursement_payee_required: {
    label: "Falta payee",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "define_payee",
  },
  no_client_invoice: {
    label: "Sin factura de cliente",
    badgeVariant: "warning",
    effectHint: "includable",
    action: "review",
  },
};

const SEVERITY_RANK: Record<SettlementCutWarningUi["effectHint"], number> = {
  blocking: 3,
  excluded: 2,
  includable: 1,
};

const VARIANT_RANK: Record<SettlementCutBadgeVariant, number> = {
  destructive: 4,
  warning: 3,
  info: 2,
  neutral: 1,
};

export function resolveCutWarningUi(
  code: SettlementCutWarningCode,
): SettlementCutWarningUi {
  return WARNING_UI[code];
}

function warningSeverityScore(code: SettlementCutWarningCode): number {
  const ui = resolveCutWarningUi(code);
  return SEVERITY_RANK[ui.effectHint] * 10 + VARIANT_RANK[ui.badgeVariant];
}

/**
 * Aviso primario de la fila: `primaryReason` del API si existe;
 * si no, el de mayor severidad (blocking gana sobre open_advance).
 */
export function primaryCutWarningCode(
  row: SettlementCutPreviewRow,
): SettlementCutWarningCode | null {
  if (row.primaryReason) return row.primaryReason;
  if (row.warnings.length === 0) return null;
  let best = row.warnings[0]!.code;
  let bestScore = warningSeverityScore(best);
  for (let i = 1; i < row.warnings.length; i += 1) {
    const code = row.warnings[i]!.code;
    const score = warningSeverityScore(code);
    if (score > bestScore) {
      best = code;
      bestScore = score;
    }
  }
  return best;
}

export function resolveCutRowWarningUi(
  row: SettlementCutPreviewRow,
): SettlementCutWarningUi | null {
  const code = primaryCutWarningCode(row);
  if (!code) return null;
  return resolveCutWarningUi(code);
}

/** Mensaje largo del API para el aviso primario (tooltip / inspector). */
export function primaryCutWarningMessage(
  row: SettlementCutPreviewRow,
): string | null {
  const code = primaryCutWarningCode(row);
  if (!code) return null;
  const match = row.warnings.find((w) => w.code === code);
  return match?.message ?? resolveCutWarningUi(code).label;
}

export type SettlementCutReviewFilter = "all" | "with_warning" | "ready";

export function rowHasCutWarning(row: SettlementCutPreviewRow): boolean {
  return row.warnings.length > 0 || row.effect !== "includable";
}

export function isCutRowReady(row: SettlementCutPreviewRow): boolean {
  return row.effect === "includable" && row.warnings.length === 0;
}

export function isCutRowSendable(row: SettlementCutPreviewRow): boolean {
  return row.effect === "includable";
}

export function filterCutReviewRows(
  rows: readonly SettlementCutPreviewRow[],
  filter: SettlementCutReviewFilter,
): SettlementCutPreviewRow[] {
  switch (filter) {
    case "with_warning":
      return rows.filter(rowHasCutWarning);
    case "ready":
      return rows.filter(isCutRowReady);
    default:
      return [...rows];
  }
}

export function partitionCutReviewRows(
  eligible: readonly SettlementCutPreviewRow[],
  excluded: readonly SettlementCutPreviewRow[],
): {
  withWarning: SettlementCutPreviewRow[];
  ready: SettlementCutPreviewRow[];
  outside: SettlementCutPreviewRow[];
} {
  const withWarning: SettlementCutPreviewRow[] = [];
  const ready: SettlementCutPreviewRow[] = [];

  for (const row of eligible) {
    if (rowHasCutWarning(row)) withWarning.push(row);
    else ready.push(row);
  }

  return {
    withWarning,
    ready,
    outside: [...excluded],
  };
}

export function cutEffectAllowsNetDisplay(effect: SettlementCutEffect): boolean {
  return effect === "includable";
}
