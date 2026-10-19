import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { AgreementCommissionType, TripRouteType } from "@features/settlements/domain";
import type {
  CompensationTemplateRule,
  TemplateDeduction,
  TemplateFixedAllowance,
} from "../../domain/entities";

// ============================================================================
// TYPES
// ============================================================================

export interface SimulationInput {
  routeType: TripRouteType;
  distanceKm: number;
  freightRevenue: number;
}

export interface SimulationLineItem {
  id: string;
  label: string;
  amount: number;
  formattedAmount: string;
  source: "rule" | "allowance" | "corridor" | "deduction";
}

export interface SimulationResult {
  items: SimulationLineItem[];
  /** Bruto (reglas + pagos fijos + corredor). */
  gross: number;
  formattedGross: string;
  /** Suma de deducciones (positivo). */
  totalDeductions: number;
  formattedTotalDeductions: string;
  /** Neto = bruto − deducciones (no baja de 0). */
  total: number;
  formattedTotal: string;
  matchedRule: CompensationTemplateRule | null;
  /** La regla pagó el mínimo garantizado en lugar del cálculo. */
  minimumApplied: boolean;
  corridorMatchName: string | null;
}

/** Dato faltante para el cálculo, aunque haya aplicado el mínimo. */
export type CommissionCalculationGap = "zero_km" | "zero_freight";

export interface RuleCommissionBreakdown {
  amount: number;
  minimumApplied: boolean;
  calculationGap: CommissionCalculationGap | null;
}

export const SIMULATION_DEFAULTS: SimulationInput = {
  routeType: "long_haul",
  distanceKm: 920,
  freightRevenue: 18_000,
};

// ============================================================================
// CALCULATION
// ============================================================================

/**
 * Espejo de `computeTripCommissionBreakdown` del API (ADR-0086 D1, enmienda
 * 2026-10-09): pago = máx(cálculo, mínimo) también con cálculo $0; con `none`
 * el mínimo nunca aplica. Paridad cubierta por `commissionGoldenCases.ts`.
 */
export function computeRuleCommission(
  rule: CompensationTemplateRule,
  input: SimulationInput,
): RuleCommissionBreakdown {
  const commissionType = rule.commissionType as AgreementCommissionType;
  const rateValue = typeof rule.rateValue === "number" && Number.isFinite(rule.rateValue)
    ? rule.rateValue
    : 0;

  let base = 0;
  let calculationGap: CommissionCalculationGap | null = null;

  switch (commissionType) {
    case "rate_per_km":
      base = Math.round(input.distanceKm * rateValue * 100) / 100;
      if (input.distanceKm <= 0) calculationGap = "zero_km";
      break;
    case "percentage_of_freight":
      base = Math.round(((input.freightRevenue * rateValue) / 100) * 100) / 100;
      if (input.freightRevenue <= 0) calculationGap = "zero_freight";
      break;
    case "fixed_per_trip":
      base = rateValue;
      break;
    case "none":
    default:
      return { amount: 0, minimumApplied: false, calculationGap: null };
  }

  const min =
    typeof rule.minimumGuaranteedAmount === "number" && rule.minimumGuaranteedAmount > 0
      ? rule.minimumGuaranteedAmount
      : 0;
  const minimumApplied = min > 0 && base < min;

  return { amount: minimumApplied ? min : base, minimumApplied, calculationGap };
}

function describeRuleForSimulation(
  rule: CompensationTemplateRule,
  routeLabels: Record<string, string>,
  minimumApplied: boolean,
): string {
  const routeLabel = routeLabels[rule.routeType] ?? rule.routeType;
  const commissionType = rule.commissionType as AgreementCommissionType;
  const suffix = minimumApplied ? " · mínimo garantizado" : "";

  switch (commissionType) {
    case "rate_per_km":
      return `Pago por km (${routeLabel.toLowerCase()})${suffix}`;
    case "percentage_of_freight":
      return `${rule.rateValue}% del flete (${routeLabel.toLowerCase()})${suffix}`;
    case "fixed_per_trip":
      return `Importe fijo (${routeLabel.toLowerCase()})${suffix}`;
    case "none":
    default:
      return `Sin pago por viaje (${routeLabel.toLowerCase()})`;
  }
}

const ROUTE_LABELS: Record<string, string> = {
  local: "Local",
  long_haul: "Foráneo",
  transfer: "Transfer / Patio",
};

/**
 * Simula el pago estimado de un viaje hipotético contra la configuración
 * actual de la tarifa. Cálculo client-side, sin API.
 */
export function simulateCompensation(
  rules: CompensationTemplateRule[],
  fixedAllowances: TemplateFixedAllowance[],
  input: SimulationInput,
  corridorFixedAmount?: number,
  corridorName?: string,
  deductions: TemplateDeduction[] = [],
): SimulationResult {
  const items: SimulationLineItem[] = [];
  let gross = 0;
  let matchedRule: CompensationTemplateRule | null = null;
  let minimumApplied = false;
  let corridorMatchName: string | null = null;

  if (corridorFixedAmount != null && corridorFixedAmount > 0) {
    items.push({
      id: "corridor",
      label: corridorName ? `Ruta fija: ${corridorName}` : "Tarifa fija por ruta",
      amount: corridorFixedAmount,
      formattedAmount: formatMxCurrency(corridorFixedAmount),
      source: "corridor",
    });
    gross += corridorFixedAmount;
    corridorMatchName = corridorName ?? null;
  } else {
    const rule = rules.find((r) => r.routeType === input.routeType);

    if (rule) {
      matchedRule = rule;
      const commission = computeRuleCommission(rule, input);
      minimumApplied = commission.minimumApplied;
      if (commission.amount > 0) {
        items.push({
          id: `rule-${rule.routeType}`,
          label: describeRuleForSimulation(rule, ROUTE_LABELS, commission.minimumApplied),
          amount: commission.amount,
          formattedAmount: formatMxCurrency(commission.amount),
          source: "rule",
        });
        gross += commission.amount;
      }
    }
  }

  for (const [index, allowance] of fixedAllowances.entries()) {
    if (!allowance) continue;
    const amount = typeof allowance.amount === "number" && Number.isFinite(allowance.amount)
      ? allowance.amount
      : 0;
    if (amount <= 0) continue;

    items.push({
      id: `allowance-${index}`,
      label: allowance.label?.trim() || "Pago fijo",
      amount,
      formattedAmount: formatMxCurrency(amount),
      source: "allowance",
    });
    gross += amount;
  }

  let totalDeductions = 0;
  for (const [index, deduction] of deductions.entries()) {
    if (!deduction) continue;
    const amount =
      typeof deduction.amount === "number" && Number.isFinite(deduction.amount)
        ? deduction.amount
        : 0;
    if (amount <= 0) continue;

    items.push({
      id: `deduction-${index}`,
      label: deduction.label?.trim() || "Deducción",
      amount: -amount,
      formattedAmount: `-${formatMxCurrency(amount)}`,
      source: "deduction",
    });
    totalDeductions += amount;
  }

  const total = Math.max(0, gross - totalDeductions);

  return {
    items,
    gross,
    formattedGross: formatMxCurrency(gross),
    totalDeductions,
    formattedTotalDeductions:
      totalDeductions > 0
        ? `-${formatMxCurrency(totalDeductions)}`
        : formatMxCurrency(0),
    total,
    formattedTotal: formatMxCurrency(total),
    matchedRule,
    minimumApplied,
    corridorMatchName,
  };
}

/**
 * Genera la descripción en prosa de una regla individual,
 * para mostrar inline debajo del componente editado.
 */
export function describeRuleProse(
  routeType: TripRouteType | undefined,
  commissionType: AgreementCommissionType | undefined,
  rateValue: number | undefined,
  minimumGuaranteedAmount: number | undefined,
): string | null {
  if (!routeType) return null;

  const routeLabel = ROUTE_LABELS[routeType] ?? String(routeType);
  const amount = typeof rateValue === "number" && Number.isFinite(rateValue) ? rateValue : 0;

  let base: string;
  switch (commissionType) {
    case "rate_per_km":
      base = `El operador recibirá ${formatMxCurrency(amount)} por cada km recorrido en viaje ${routeLabel.toLowerCase()}`;
      break;
    case "percentage_of_freight":
      base = `El operador recibirá el ${amount}% del flete en viaje ${routeLabel.toLowerCase()}`;
      break;
    case "fixed_per_trip":
      base = `El operador recibirá ${formatMxCurrency(amount)} por cada viaje ${routeLabel.toLowerCase()}`;
      break;
    case "none":
      return `Esta clase de ruta no tiene pago por viaje. El sueldo y los pagos fijos se liquidan aparte.`;
    default:
      return null;
  }

  if (typeof minimumGuaranteedAmount === "number" && minimumGuaranteedAmount > 0) {
    return `${base}, con un mínimo garantizado de ${formatMxCurrency(minimumGuaranteedAmount)} por viaje.`;
  }

  return `${base}.`;
}

/**
 * Genera la descripción en prosa de una prestación fija individual.
 */
export function describeAllowanceProse(
  label: string | undefined,
  amount: number | undefined,
  period: string | undefined,
): string | null {
  const name = label?.trim() || "Pago fijo";
  const amountVal = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;

  const periodLabels: Record<string, string> = {
    weekly: "semanal",
    biweekly: "quincenal",
    monthly: "mensual",
  };

  const periodLabel = period ? periodLabels[period] ?? period : "";

  if (amountVal <= 0) {
    return `${name}: sin monto configurado.`;
  }

  const rhythm = periodLabel ? ` con ritmo ${periodLabel}` : "";
  return `${name}: ${formatMxCurrency(amountVal)} se suma 1× al bruto de cada pago${rhythm}.`;
}

/**
 * Genera la descripción en prosa de una deducción de tarifa.
 */
export function describeDeductionProse(
  label: string | undefined,
  amount: number | undefined,
  period: string | undefined,
): string | null {
  const name = label?.trim() || "Deducción";
  const amountVal = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;

  const periodLabels: Record<string, string> = {
    weekly: "semanal",
    biweekly: "quincenal",
    monthly: "mensual",
  };

  const periodLabel = period ? periodLabels[period] ?? period : "";

  if (amountVal <= 0) {
    return `${name}: sin monto configurado.`;
  }

  const rhythm = periodLabel ? ` con ritmo ${periodLabel}` : "";
  return `${name}: ${formatMxCurrency(amountVal)} se resta del neto de cada pago${rhythm}.`;
}
