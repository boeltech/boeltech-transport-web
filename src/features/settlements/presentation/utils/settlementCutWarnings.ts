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
  | "confirm_zero_km"
  | "view"
  | null;

export interface SettlementCutWarningUi {
  label: string;
  badgeVariant: SettlementCutBadgeVariant;
  /** Categoría de efecto para footer / copy. */
  effectHint: "excluded" | "includable" | "blocking";
  action: SettlementCutRowAction;
  /** Tooltip preferido sobre el message del API (DOM/PRD). */
  tooltip?: string;
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
    tooltip: "Sin distancia usable; se paga el mínimo de la regla.",
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
    label: "Falta confirmar km",
    badgeVariant: "destructive",
    effectHint: "blocking",
    action: "confirm_zero_km",
    tooltip:
      "Falta distancia en viaje(s) por km. Confirma para pagar el mínimo (o $0 si no hay), o corrige odómetro/tramos.",
  },
  missing_ack_zero_freight: {
    label: "Falta confirmar flete",
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
    label: "Falta quién recibe el reembolso",
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
  const ui = resolveCutWarningUi(code);
  if (ui.tooltip) return ui.tooltip;
  const match = row.warnings.find((w) => w.code === code);
  return match?.message ?? ui.label;
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

export function rowNeedsZeroKmAck(row: SettlementCutPreviewRow): boolean {
  return primaryCutWarningCode(row) === "missing_ack_zero_km";
}

/**
 * Tras Confirmar en Revisar: la fila entra al lote como includable con aviso soft.
 */
export function applyZeroKmAckToCutRow(
  row: SettlementCutPreviewRow,
): SettlementCutPreviewRow {
  if (!rowNeedsZeroKmAck(row)) return row;
  const softMessage =
    resolveCutWarningUi("zero_km_trips").tooltip ??
    "Sin distancia usable; se paga el mínimo de la regla.";
  return {
    ...row,
    effect: "includable",
    primaryReason: "zero_km_trips",
    warnings: [
      { code: "zero_km_trips", message: softMessage },
      ...row.warnings.filter((w) => w.code !== "missing_ack_zero_km"),
    ],
  };
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

/**
 * C30 — operadores que no quedaron en `created`:
 * excluded + blocking del preview + omitted del create (sin duplicar creados).
 */
export function buildCutDidNotEnterRows(args: {
  eligible: readonly SettlementCutPreviewRow[];
  excluded: readonly SettlementCutPreviewRow[];
  createdEmployeeIds: ReadonlySet<string>;
  omitted: readonly {
    employeeId: string;
    reasonCode: string;
    message: string;
  }[];
}): SettlementCutPreviewRow[] {
  const byId = new Map<string, SettlementCutPreviewRow>();

  for (const row of args.excluded) {
    if (args.createdEmployeeIds.has(row.employeeId)) continue;
    byId.set(row.employeeId, row);
  }
  for (const row of args.eligible) {
    if (args.createdEmployeeIds.has(row.employeeId)) continue;
    if (row.effect === "blocking") {
      byId.set(row.employeeId, row);
    }
  }
  for (const omitted of args.omitted) {
    if (args.createdEmployeeIds.has(omitted.employeeId)) continue;
    if (byId.has(omitted.employeeId)) continue;
    const fromPreview =
      args.eligible.find((r) => r.employeeId === omitted.employeeId) ??
      args.excluded.find((r) => r.employeeId === omitted.employeeId);
    if (fromPreview) {
      byId.set(omitted.employeeId, fromPreview);
    }
    // Omitidos sin fila de preview: el paso 3 los pinta aparte con message API.
  }

  return [...byId.values()];
}

/** Motivo corto C30 para filas que no entraron (badge de Revisar). */
export function cutDidNotEnterReasonLabel(row: SettlementCutPreviewRow): string {
  const code = primaryCutWarningCode(row);
  if (!code) return "No entró";
  if (code === "missing_ack_zero_km") return "Sin km · sin confirmar";
  return resolveCutWarningUi(code).label;
}
