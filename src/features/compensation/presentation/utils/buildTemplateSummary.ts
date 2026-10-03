import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { AgreementCommissionType, TripRouteType } from "@features/settlements";
import type { CompensationTemplate } from "../../domain/entities";
import { FIXED_ALLOWANCE_PERIOD_LABELS } from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";
import type { TemplateSummaryLine } from "./templateCompositionTypes";

const routeLabels = compensationCopy.builder.routeTypeLabels;
const commissionLabels = compensationCopy.builder.commissionTypeLabels;

function formatRuleCommission(
  commissionType: AgreementCommissionType | undefined,
  rateValue: number | undefined,
): string {
  const amount = typeof rateValue === "number" && Number.isFinite(rateValue) ? rateValue : 0;

  switch (commissionType) {
    case "rate_per_km":
      return `${formatMxCurrency(amount)}/km`;
    case "percentage_of_freight":
      return `${amount}% de lo que cobra el viaje`;
    case "fixed_per_trip":
      return `${formatMxCurrency(amount)} por viaje`;
    case "none":
      return commissionLabels.none;
    default:
      return formatMxCurrency(amount);
  }
}

function formatRuleProse(
  routeType: TripRouteType | undefined,
  commissionType: AgreementCommissionType | undefined,
  rateValue: number | undefined,
  minimumGuaranteedAmount: number | undefined,
): string | null {
  if (!routeType) {
    return null;
  }

  const routeLabel = routeLabels[routeType] ?? String(routeType);
  const commissionLabel = formatRuleCommission(commissionType, rateValue);
  const base = `Cuando viaje ${routeLabel.toLowerCase()}, pagar ${commissionLabel}`;

  if (typeof minimumGuaranteedAmount === "number" && minimumGuaranteedAmount > 0) {
    return `${base} (mínimo garantizado ${formatMxCurrency(minimumGuaranteedAmount)})`;
  }

  return base;
}

function buildCorridorLine(
  corridorIds: string[],
  corridors: CompensationTemplate["corridors"],
): TemplateSummaryLine | null {
  const corridorCount = corridorIds.length;
  if (corridorCount === 1) {
    const name = corridors[0]?.name;
    return {
      id: "corridors",
      text: name ? `1 ruta con tarifa fija: ${name}` : "1 ruta con tarifa fija",
    };
  }
  if (corridorCount > 1) {
    return {
      id: "corridors",
      text: `${corridorCount} rutas con tarifa fija`,
    };
  }
  return null;
}

/**
 * Resumen estructurado en prosa operativa para el inspector del Builder (ADR-0091 · D5.1).
 * Tolera valores parciales de useWatch mientras el form aún hidrata.
 *
 * Orden cuando coexisten reglas y corredores (ADR-0089 D3):
 * precedencia → rutas fijas → pago por viaje → extras → descuentos.
 */
export function buildTemplateStructuredSummary(
  template: Pick<
    CompensationTemplate,
    "rules" | "fixedAllowances" | "deductions" | "corridorIds" | "corridors"
  >,
): TemplateSummaryLine[] {
  const lines: TemplateSummaryLine[] = [];
  const rules = template.rules ?? [];
  const allowances = template.fixedAllowances ?? [];
  const deductions = template.deductions ?? [];
  const corridorIds = template.corridorIds ?? [];
  const corridors = template.corridors ?? [];

  const ruleLines: TemplateSummaryLine[] = [];
  for (const [index, rule] of rules.entries()) {
    if (!rule) continue;
    const text = formatRuleProse(
      rule.routeType,
      rule.commissionType,
      rule.rateValue,
      rule.minimumGuaranteedAmount,
    );
    if (!text) continue;
    ruleLines.push({
      id: `rule-${rule.routeType ?? index}`,
      text,
    });
  }

  const corridorLine = buildCorridorLine(corridorIds, corridors);
  const hasRules = ruleLines.length > 0;
  const hasCorridors = corridorLine !== null;

  if (hasRules && hasCorridors) {
    lines.push({
      id: "precedence",
      text: compensationCopy.builder.inspectorPrecedenceHint,
      variant: "hint",
    });
  }

  if (corridorLine) {
    lines.push(corridorLine);
  }

  lines.push(...ruleLines);

  for (const [index, allowance] of allowances.entries()) {
    if (!allowance) continue;
    const label = allowance.label?.trim() || "Pago fijo";
    const periodLabel =
      (allowance.period ? FIXED_ALLOWANCE_PERIOD_LABELS[allowance.period] : undefined) ??
      allowance.period ??
      "";
    const amount =
      typeof allowance.amount === "number" && Number.isFinite(allowance.amount)
        ? allowance.amount
        : 0;
    const periodSuffix = periodLabel
      ? ` · ritmo ${String(periodLabel).toLowerCase()}`
      : "";
    lines.push({
      id: `allowance-${label}-${index}`,
      text: `Pago fijo de tarifa ${label}: ${formatMxCurrency(amount)} · 1× por pago${periodSuffix}`,
    });
  }

  for (const [index, deduction] of deductions.entries()) {
    if (!deduction) continue;
    const label = deduction.label?.trim() || "Deducción";
    const periodLabel =
      (deduction.period ? FIXED_ALLOWANCE_PERIOD_LABELS[deduction.period] : undefined) ??
      deduction.period ??
      "";
    const amount =
      typeof deduction.amount === "number" && Number.isFinite(deduction.amount)
        ? deduction.amount
        : 0;
    const periodSuffix = periodLabel
      ? ` · ritmo ${String(periodLabel).toLowerCase()}`
      : "";
    lines.push({
      id: `deduction-${label}-${index}`,
      text: `Deducción ${label}: −${formatMxCurrency(amount)} del neto${periodSuffix}`,
    });
  }

  return lines;
}

/** Resumen compacto (lista / cards). Usa prosa operativa. */
export function buildTemplateSummary(template: CompensationTemplate): string {
  const lines = buildTemplateStructuredSummary(template).filter(
    (line) => line.variant !== "hint",
  );
  if (lines.length === 0) {
    return compensationCopy.templates.summaryEmpty;
  }
  return lines.map((line) => line.text).join(" · ");
}
