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
