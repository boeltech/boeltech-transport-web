import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { AgreementCommissionType, TripRouteType } from "@features/settlements";
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
  corridorMatchName: string | null;
}

export const SIMULATION_DEFAULTS: SimulationInput = {
  routeType: "long_haul",
  distanceKm: 920,
  freightRevenue: 18_000,
};

// ============================================================================
// CALCULATION
// ============================================================================

function computeRuleCommission(
  rule: CompensationTemplateRule,
  input: SimulationInput,
): number {
  const commissionType = rule.commissionType as AgreementCommissionType;
  const rateValue = typeof rule.rateValue === "number" && Number.isFinite(rule.rateValue)
    ? rule.rateValue
    : 0;

  let raw = 0;

  switch (commissionType) {
    case "rate_per_km":
      raw = input.distanceKm * rateValue;
      break;
    case "percentage_of_freight":
      raw = input.freightRevenue * (rateValue / 100);
      break;
    case "fixed_per_trip":
      raw = rateValue;
      break;
    case "none":
    default:
      raw = 0;
      break;
  }

  const min = typeof rule.minimumGuaranteedAmount === "number"
    ? rule.minimumGuaranteedAmount
    : 0;

  return Math.max(raw, min);
}

function describeRuleForSimulation(
  rule: CompensationTemplateRule,
  routeLabels: Record<string, string>,
): string {
  const routeLabel = routeLabels[rule.routeType] ?? rule.routeType;
  const commissionType = rule.commissionType as AgreementCommissionType;

  switch (commissionType) {
    case "rate_per_km":
      return `Pago por km (${routeLabel.toLowerCase()})`;
    case "percentage_of_freight":
      return `Comisión ${rule.rateValue}% (${routeLabel.toLowerCase()})`;
    case "fixed_per_trip":
      return `Importe fijo (${routeLabel.toLowerCase()})`;
    case "none":
    default:
      return `Sin pago extra (${routeLabel.toLowerCase()})`;
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
      if (commission > 0) {
        items.push({
          id: `rule-${rule.routeType}`,
          label: describeRuleForSimulation(rule, ROUTE_LABELS),
          amount: commission,
          formattedAmount: formatMxCurrency(commission),
          source: "rule",
        });
        gross += commission;
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
      base = `El operador recibirá el ${amount}% de lo que cobra el viaje ${routeLabel.toLowerCase()}`;
      break;
    case "fixed_per_trip":
      base = `El operador recibirá ${formatMxCurrency(amount)} por cada viaje ${routeLabel.toLowerCase()}`;
      break;
    case "none":
      return `Esta clase de ruta no genera pago extra. El sueldo y los pagos fijos se liquidan aparte.`;
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
