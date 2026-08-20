import {
  computeFinancialSummary,
  isIndirectExpenseCategory,
  isOperationalExpenseCategory,
  type ExpenseCategory,
  type FinancialSummary,
} from "./financialSummary";

export interface TripWizardExpenseLine {
  id?: string;
  category: string;
  description: string;
  amount: number;
  /** Present in detail; wizard draft lines may omit status. */
  status?: string;
}

/** `approved` = paridad Finanzas (solo approved en costo real). */
export type TripWizardCostBasis = "all" | "approved";

const QUEUED_EXPENSE_STATUSES = new Set(["pending", "documented"]);

export interface TripWizardFinancialSnapshot {
  operationalCosts: TripWizardExpenseLine[];
  indirectExpenses: TripWizardExpenseLine[];
  totalOperationalCosts: number;
  totalIndirectExpenses: number;
  totalExpenses: number;
  /** Montos en cola (pending/documented); no restan del margen primario. */
  queuedCostsTotal: number;
  costBasis: TripWizardCostBasis;
  financial: FinancialSummary;
  marginToneClass: string;
}

export interface BuildTripWizardFinancialSnapshotOptions {
  costBasis?: TripWizardCostBasis;
}

function countsTowardPrimary(
  expense: TripWizardExpenseLine,
  costBasis: TripWizardCostBasis,
): boolean {
  if (costBasis === "all") return true;
  return expense.status === "approved";
}

export function buildTripWizardFinancialSnapshot(
  baseRate: number | undefined,
  expenses: TripWizardExpenseLine[] | undefined,
  options?: BuildTripWizardFinancialSnapshotOptions,
): TripWizardFinancialSnapshot {
  const costBasis = options?.costBasis ?? "all";
  const lines = expenses ?? [];

  const primaryLines = lines.filter((expense) =>
    countsTowardPrimary(expense, costBasis),
  );

  const operationalCosts = primaryLines.filter((expense) =>
    isOperationalExpenseCategory(expense.category as ExpenseCategory),
  );
  const indirectExpenses = primaryLines.filter((expense) =>
    isIndirectExpenseCategory(expense.category as ExpenseCategory),
  );

  const totalOperationalCosts = operationalCosts.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0,
  );
  const totalIndirectExpenses = indirectExpenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0,
  );
  const totalExpenses = totalOperationalCosts + totalIndirectExpenses;
  const queuedCostsTotal = lines
    .filter(
      (expense) =>
        expense.status != null && QUEUED_EXPENSE_STATUSES.has(expense.status),
    )
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const rate = baseRate ?? 0;

  const financial = computeFinancialSummary(rate, totalExpenses, {
    totalOperationalCosts,
    totalIndirectExpenses,
  });

  const marginToneClass =
    financial.health === "healthy"
      ? "text-success"
      : financial.health === "warning"
        ? "text-warning"
        : financial.health === "critical"
          ? "text-destructive"
          : "text-muted-foreground";

  return {
    operationalCosts,
    indirectExpenses,
    totalOperationalCosts,
    totalIndirectExpenses,
    totalExpenses,
    queuedCostsTotal,
    costBasis,
    financial,
    marginToneClass,
  };
}
