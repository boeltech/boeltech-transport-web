export type FinancialHealth = "healthy" | "warning" | "critical" | "neutral";

export interface FinancialSummary {
  baseRate: number;
  totalExpenses: number;
  totalOperationalCosts: number;
  totalIndirectExpenses: number;
  margin: number;
  marginPct: number | null;
  health: FinancialHealth;
}

export const OPERATIONAL_COST_CATEGORIES = [
  "fuel",
  "tolls",
  "loading_unloading",
  "maintenance",
  "insurance",
  "permits",
] as const;

export const INDIRECT_EXPENSE_CATEGORIES = [
  "driver_allowance",
  "lodging",
  "parking",
  "other",
] as const;

export type ExpenseCategory =
  | (typeof OPERATIONAL_COST_CATEGORIES)[number]
  | (typeof INDIRECT_EXPENSE_CATEGORIES)[number];

export function computeFinancialSummary(
  baseRate: number,
  totalExpenses: number,
  totalsByType?: {
    totalOperationalCosts: number;
    totalIndirectExpenses: number;
  },
): FinancialSummary {
  const margin = baseRate - totalExpenses;
  const marginPct = baseRate > 0 ? (margin / baseRate) * 100 : null;

  let health: FinancialHealth = "neutral";
  if (marginPct !== null) {
    if (marginPct >= 30) {
      health = "healthy";
    } else if (marginPct >= 10) {
      health = "warning";
    } else {
      health = "critical";
    }
  }

  return {
    baseRate,
    totalExpenses,
    totalOperationalCosts: totalsByType?.totalOperationalCosts ?? totalExpenses,
    totalIndirectExpenses: totalsByType?.totalIndirectExpenses ?? 0,
    margin,
    marginPct,
    health,
  };
}

export function formatMxCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}
