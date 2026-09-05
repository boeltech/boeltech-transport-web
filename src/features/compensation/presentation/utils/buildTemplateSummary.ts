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

/**
 * Resumen estructurado en prosa operativa para el inspector del Builder (ADR-0091 · D5.1).
 * Tolera valores parciales de useWatch mientras el form aún hidrata.
 */
export function buildTemplateStructuredSummary(
  template: Pick<
    CompensationTemplate,
    "rules" | "fixedAllowances" | "corridorIds" | "corridors"
  >,
): TemplateSummaryLine[] {
  const lines: TemplateSummaryLine[] = [];
  const rules = template.rules ?? [];
  const allowances = template.fixedAllowances ?? [];
  const corridorIds = template.corridorIds ?? [];
  const corridors = template.corridors ?? [];

  for (const [index, rule] of rules.entries()) {
    if (!rule) continue;
    const text = formatRuleProse(
      rule.routeType,
      rule.commissionType,
      rule.rateValue,
      rule.minimumGuaranteedAmount,
    );
    if (!text) continue;
    lines.push({
      id: `rule-${rule.routeType ?? index}`,
      text,
    });
  }

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
      ? ` (${String(periodLabel).toLowerCase()})`
      : "";
    lines.push({
      id: `allowance-${label}-${index}`,
      text: `Pago fijo ${label}: ${formatMxCurrency(amount)}${periodSuffix}`,
    });
  }

  const corridorCount = corridorIds.length;
  if (corridorCount === 1) {
    const name = corridors[0]?.name;
    lines.push({
      id: "corridors",
      text: name
        ? `1 ruta con precio fijo: ${name}`
        : "1 ruta con precio fijo",
    });
  } else if (corridorCount > 1) {
    lines.push({
      id: "corridors",
      text: `${corridorCount} rutas con precio fijo`,
    });
  }

  return lines;
}

/** Resumen compacto (lista / cards). Usa prosa operativa. */
export function buildTemplateSummary(template: CompensationTemplate): string {
  const lines = buildTemplateStructuredSummary(template);
  if (lines.length === 0) {
    return compensationCopy.templates.summaryEmpty;
  }
  return lines.map((line) => line.text).join(" · ");
}
