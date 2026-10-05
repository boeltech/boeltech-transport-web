/**
 * Totales de una liquidación (ADR-0085 D14 + Enmienda E10), réplica para mostrar.
 *
 * Misma aritmética que `boeltech-transport-api/src/modules/settlements/policy/settlementTotals.ts`
 * (TEC-6: replicar con prueba de paridad). La autoridad es el API: tras guardar
 * se vuelve a pedir el detalle.
 */

export const MANUAL_SETTLEMENT_ITEM_TYPES = [
  "bonus",
  "penalty_deduction",
  "tax_deduction",
  "adjustment",
] as const;
export type ManualSettlementItemType = (typeof MANUAL_SETTLEMENT_ITEM_TYPES)[number];

export interface ManualSettlementItemInput {
  itemType: ManualSettlementItemType;
  description: string;
  amount: number;
  /** Solo `adjustment` lo declara; en los demás tipos se deriva. */
  isDeduction?: boolean;
  tripId?: string | null;
}

export interface ManualSettlementItem {
  itemType: ManualSettlementItemType;
  description: string;
  amount: number;
  isDeduction: boolean;
  tripId: string | null;
}

/** Lo que el motor calculó al crear; la corrección lo conserva intacto. */
export interface CalculatedSettlementBase {
  /** Comisiones + sueldo base + prestaciones fijas + reembolsos. */
  calculatedGross: number;
  /** Deducciones de plantilla (fondo de ahorro, retención…). */
  templateDeductions: number;
  advancesDeducted: number;
}

export interface SettlementTotals {
  totalBonuses: number;
  totalAdvancesDeducted: number;
  totalOtherDeductions: number;
  grossAmount: number;
  netAmount: number;
}

export const roundCents = (value: number): number => Math.round(value * 100) / 100;

export function isManualSettlementItemType(itemType: string): itemType is ManualSettlementItemType {
  return (MANUAL_SETTLEMENT_ITEM_TYPES as readonly string[]).includes(itemType);
}

/**
 * E10.6: `bonus` suma; `penalty_deduction` y `tax_deduction` restan; solo
 * `adjustment` admite los dos sentidos y debe declararlo.
 */
export function manualItemNeedsDirection(itemType: ManualSettlementItemType): boolean {
  return itemType === "adjustment";
}

/** Signo efectivo de la partida (lo que el API guarda en `is_deduction`). */
export function deriveManualItemIsDeduction(item: {
  itemType: ManualSettlementItemType;
  isDeduction?: boolean;
}): boolean {
  return item.itemType === "adjustment" ? item.isDeduction === true : item.itemType !== "bonus";
}

export function normalizeManualItems(
  items: readonly ManualSettlementItemInput[],
): ManualSettlementItem[] {
  return items.map((item) => ({
    itemType: item.itemType,
    description: item.description,
    amount: item.amount,
    isDeduction: deriveManualItemIsDeduction(item),
    tripId: item.tripId ?? null,
  }));
}

/**
 * Partida capturada por una persona (T3): tipo manual sin procedencia del
 * motor. Prestaciones fijas (`fixed_allowance`) y deducciones de plantilla
 * (`template_deduction`) usan los mismos tipos pero son calculadas.
 */
export function isManualSettlementItem(item: {
  itemType: string;
  calculationDetails?: { source?: unknown } | null;
}): boolean {
  if (!isManualSettlementItemType(item.itemType)) return false;
  const source = item.calculationDetails?.source;
  return source === undefined || source === null || source === "manual";
}

export function sumManualItems(items: readonly ManualSettlementItem[]): {
  additions: number;
  deductions: number;
} {
  let additions = 0;
  let deductions = 0;
  for (const item of items) {
    if (item.isDeduction) deductions += item.amount;
    else additions += item.amount;
  }
  return { additions, deductions };
}

/** Bruto = calculado + manuales que suman; neto = max(0, bruto − anticipos − deducciones). */
export function computeSettlementTotals(
  base: CalculatedSettlementBase,
  manualItems: readonly ManualSettlementItem[],
): SettlementTotals {
  const manual = sumManualItems(manualItems);
  const gross = roundCents(base.calculatedGross + manual.additions);
  const otherDeductions = roundCents(base.templateDeductions + manual.deductions);
  const advances = roundCents(base.advancesDeducted);
  return {
    totalBonuses: roundCents(manual.additions),
    totalAdvancesDeducted: advances,
    totalOtherDeductions: otherDeductions,
    grossAmount: gross,
    netAmount: roundCents(Math.max(0, gross - advances - otherDeductions)),
  };
}

export const SETTLEMENT_DEDUCTIONS_EXCEED_GROSS = "SETTLEMENT_DEDUCTIONS_EXCEED_GROSS";

const toCents = (value: number): number => Math.round((Number(value) || 0) * 100);
const fromCents = (cents: number): number => cents / 100;

/** Orden en que la tarifa consume el bruto; un tipo desconocido va al final. */
export const TEMPLATE_DEDUCTION_PRIORITY: readonly string[] = [
  "tax_withholding",
  "union_dues",
  "savings_fund",
  "equipment_rental",
  "other_deduction",
];

export interface TemplateDeductionAllocation {
  requestedAmount: number;
  appliedAmount: number;
  omittedAmount: number;
}

/**
 * Deducciones de tarifa: nunca bloquean. Consumen el bruto por prioridad
 * (estable dentro de cada tipo) y lo que no cabe se omite. Conserva el orden
 * de entrada.
 */
export function applyTemplateDeductionsByPriority<T extends { deductionType: string; amount: number }>(
  grossAmount: number,
  deductions: readonly T[],
): Array<T & TemplateDeductionAllocation> {
  const rank = (type: string): number => {
    const index = TEMPLATE_DEDUCTION_PRIORITY.indexOf(type);
    return index === -1 ? TEMPLATE_DEDUCTION_PRIORITY.length : index;
  };
  const requested = deductions.map((deduction) => Math.max(0, toCents(deduction.amount)));
  const applied = deductions.map(() => 0);
  const order = deductions
    .map((deduction, index) => ({ index, rank: rank(deduction.deductionType) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index);
  let remaining = Math.max(0, toCents(grossAmount));
  for (const { index } of order) {
    const take = Math.min(requested[index]!, remaining);
    applied[index] = take;
    remaining -= take;
  }
  return deductions.map((deduction, index) => ({
    ...deduction,
    requestedAmount: fromCents(requested[index]!),
    appliedAmount: fromCents(applied[index]!),
    omittedAmount: fromCents(requested[index]! - applied[index]!),
  }));
}

export interface DeductionCapacity {
  maxAdvanceDeductible: number;
  excessAmount: number;
  excessSource: "advances" | "manual_deductions" | null;
}

/**
 * Lo que cabe tras bruto → deducciones de plantilla → manuales en contra →
 * anticipos. Las de plantilla nunca generan excedente (en históricos sin tope
 * solo dejan la capacidad en 0); sí lo generan manuales y anticipos.
 */
export function assessDeductionCapacity(
  base: CalculatedSettlementBase,
  manualItems: readonly ManualSettlementItem[],
): DeductionCapacity {
  const manual = sumManualItems(manualItems);
  const gross = toCents(base.calculatedGross + manual.additions);
  const afterTemplate = Math.max(0, gross - toCents(base.templateDeductions));
  const manualDeductions = toCents(manual.deductions);
  const advances = toCents(base.advancesDeducted);
  const excess = Math.max(0, manualDeductions + advances - afterTemplate);
  const excessSource =
    excess === 0 ? null : manualDeductions > afterTemplate ? "manual_deductions" : "advances";
  return {
    maxAdvanceDeductible: fromCents(Math.max(0, afterTemplate - manualDeductions)),
    excessAmount: fromCents(excess),
    excessSource,
  };
}

/** Descuentos guardados que el neto no cubrió (> 0 solo en históricos). */
export function uncoveredDeductionsAmount(settlement: {
  grossAmount: number;
  totalAdvancesDeducted: number;
  totalOtherDeductions: number;
}): number {
  const uncovered =
    toCents(settlement.totalAdvancesDeducted) +
    toCents(settlement.totalOtherDeductions) -
    toCents(settlement.grossAmount);
  return fromCents(Math.max(0, uncovered));
}

/**
 * Base calculada de una liquidación ya guardada. Las columnas mezclan motor y
 * manuales; se separan restando las manuales vigentes con la misma regla de
 * signo con que se sumaron.
 */
export function calculatedBaseFromStored(settlement: {
  grossAmount: number;
  totalBonuses: number;
  totalOtherDeductions: number;
  totalAdvancesDeducted: number;
  items?: ReadonlyArray<{
    itemType: string;
    amount: number;
    isDeduction: boolean;
    calculationDetails?: { source?: unknown } | null;
  }>;
}): CalculatedSettlementBase {
  const storedManualDeductions = (settlement.items ?? [])
    .filter((item) => isManualSettlementItem(item) && item.itemType !== "bonus" && item.isDeduction)
    .reduce((sum, item) => sum + item.amount, 0);
  return {
    calculatedGross: roundCents(settlement.grossAmount - settlement.totalBonuses),
    templateDeductions: roundCents(settlement.totalOtherDeductions - storedManualDeductions),
    advancesDeducted: settlement.totalAdvancesDeducted,
  };
}
