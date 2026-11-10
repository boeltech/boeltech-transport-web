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
    label: "Sin tarifa asignada",
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
    label: "Baja o inactivo",
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
    label: "Versión de tarifa reemplazada",
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
    label: "Viaje sin km: aplica mínimo",
    badgeVariant: "warning",
    effectHint: "includable",
    action: "view_trip",
  },
  period_partial_overlap: {
    label: "Solape parcial de periodo",
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
    label: "Viaje sin regla (falta confirmar)",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "review",
  },
  missing_ack_zero_km: {
    label: "Viaje sin km (falta confirmar)",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "review",
  },
  missing_ack_zero_freight: {
    label: "Viaje sin flete (falta confirmar)",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "review",
  },
  deductions_exceed_capacity: {
    label: "Descuentos superan el total",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "split_advance",
  },
  reimbursement_payee_required: {
    label: "Falta payee de reembolso",
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

export function resolveCutWarningUi(
  code: SettlementCutWarningCode,
): SettlementCutWarningUi {
  return WARNING_UI[code];
}

/** Aviso primario de la fila (primaryReason o primer warning). */
export function primaryCutWarningCode(
  row: SettlementCutPreviewRow,
): SettlementCutWarningCode | null {
  if (row.primaryReason) return row.primaryReason;
  return row.warnings[0]?.code ?? null;
}

export function resolveCutRowWarningUi(
  row: SettlementCutPreviewRow,
): SettlementCutWarningUi | null {
  const code = primaryCutWarningCode(row);
  if (!code) return null;
  return resolveCutWarningUi(code);
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
