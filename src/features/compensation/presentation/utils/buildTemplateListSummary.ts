import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type {
  CompensationTemplate,
  CompensationTemplateRule,
} from "../../domain/entities";
import { FIXED_ALLOWANCE_PERIOD_LABELS, type FixedAllowancePeriod } from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";
import { type BranchNameMap, formatCorridorRouteHuman } from "./formatCorridorRoute";

const summaryCopy = compensationCopy.templates.listSummary;
const routeLabels = compensationCopy.builder.routeTypeLabels;

const percentFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 });

export interface TemplateListSummary {
  /** Sin regla por clase ni ruta fija activa: la celda muestra «Sin configurar». */
  isEmpty: boolean;
  /** Línea 1: segmentos que no deben partirse (se unen con « · »). */
  primary: string[];
  /** Línea 2 (gris): rutas fijas, pagos fijos y deducciones como conteos. */
  secondary: string[];
  /** Detalle completo para el tooltip; vacío = sin tooltip. */
  tooltip: string[];
}

type ListSummaryInput = Pick<
  CompensationTemplate,
  "rules" | "fixedAllowances" | "deductions" | "corridors"
>;

function finiteOrZero(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatPeriod(period: FixedAllowancePeriod | undefined): string | undefined {
  const label = period ? FIXED_ALLOWANCE_PERIOD_LABELS[period] : undefined;
  return label?.toLowerCase();
}

function formatRuleSegment(rule: CompensationTemplateRule): string {
  const routeLabel = routeLabels[rule.routeType] ?? String(rule.routeType);
  const amount = finiteOrZero(rule.rateValue);
  switch (rule.commissionType) {
    case "rate_per_km":
      return summaryCopy.perKm(routeLabel, formatMxCurrency(amount));
    case "fixed_per_trip":
      return summaryCopy.perTrip(routeLabel, formatMxCurrency(amount));
    case "percentage_of_freight":
      return summaryCopy.percentage(routeLabel, percentFormatter.format(amount));
    case "none":
      return summaryCopy.noPay(routeLabel);
    default:
      return `${routeLabel} ${formatMxCurrency(amount)}`;
  }
}

function formatCorridorsSegment(amounts: number[]): string | null {
  if (amounts.length === 0) return null;
  if (amounts.length === 1) return summaryCopy.oneCorridor(formatMxCurrency(amounts[0]));
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  if (min === max) return summaryCopy.corridorSame(amounts.length, formatMxCurrency(min));
  return summaryCopy.corridorRange(
    amounts.length,
    formatMxCurrency(min),
    formatMxCurrency(max),
  );
}

/**
 * Resumen compacto de «Cómo se paga» para el listado (PRD D7–D9). Solo cuenta rutas
 * activas: el cálculo del pago ignora las inactivas; en el tooltip salen marcadas.
 */
export function buildTemplateListSummary(
  template: ListSummaryInput,
  branchNameMap?: BranchNameMap,
): TemplateListSummary {
  const rules = (template.rules ?? []).filter((rule) => Boolean(rule?.routeType));
  const corridors = template.corridors ?? [];
  const activeCorridors = corridors.filter((corridor) => corridor.isActive);
  const allowances = template.fixedAllowances ?? [];
  const deductions = template.deductions ?? [];

  const ruleSegments = rules.map(formatRuleSegment);
  const corridorSegment = formatCorridorsSegment(
    activeCorridors.map((corridor) => finiteOrZero(corridor.fixedAmount)),
  );
  const extraSegments = [
    allowances.length > 0 ? summaryCopy.allowances(allowances.length) : null,
    deductions.length > 0 ? summaryCopy.deductions(deductions.length) : null,
  ].filter((segment): segment is string => segment !== null);

  let primary: string[];
  let secondary: string[];
  if (ruleSegments.length > 0) {
    primary = ruleSegments;
    secondary = corridorSegment ? [corridorSegment, ...extraSegments] : extraSegments;
  } else if (corridorSegment) {
    primary = [corridorSegment];
    secondary = extraSegments;
  } else {
    primary = [];
    secondary = extraSegments;
  }

  const tooltip: string[] = [];
  if (ruleSegments.length > 0 && activeCorridors.length > 0) {
    tooltip.push(compensationCopy.builder.inspectorPrecedenceHint);
  }
  for (const corridor of corridors) {
    const line = summaryCopy.tooltipCorridor(
      corridor.name,
      formatCorridorRouteHuman(corridor, branchNameMap),
      formatMxCurrency(finiteOrZero(corridor.fixedAmount)),
    );
    tooltip.push(corridor.isActive ? line : `${line} ${summaryCopy.tooltipCorridorInactive}`);
  }
  rules.forEach((rule, index) => {
    const minimum = finiteOrZero(rule.minimumGuaranteedAmount);
    tooltip.push(
      minimum > 0
        ? `${ruleSegments[index]} · ${summaryCopy.tooltipMinimum(formatMxCurrency(minimum))}`
        : ruleSegments[index],
    );
  });
  for (const allowance of allowances) {
    tooltip.push(
      summaryCopy.tooltipAllowance(
        allowance.label?.trim() || summaryCopy.allowanceFallback,
        formatMxCurrency(finiteOrZero(allowance.amount)),
        formatPeriod(allowance.period),
      ),
    );
  }
  for (const deduction of deductions) {
    tooltip.push(
      summaryCopy.tooltipDeduction(
        deduction.label?.trim() || summaryCopy.deductionFallback,
        formatMxCurrency(finiteOrZero(deduction.amount)),
        formatPeriod(deduction.period),
      ),
    );
  }

  return { isEmpty: primary.length === 0, primary, secondary, tooltip };
}
