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
}

export interface TripWizardFinancialSnapshot {
  operationalCosts: TripWizardExpenseLine[];
  indirectExpenses: TripWizardExpenseLine[];
  totalOperationalCosts: number;
  totalIndirectExpenses: number;
  totalExpenses: number;
  financial: FinancialSummary;
  marginToneClass: string;
}

export function buildTripWizardFinancialSnapshot(
  baseRate: number | undefined,
  expenses: TripWizardExpenseLine[] | undefined,
): TripWizardFinancialSnapshot {
  const operationalCosts = (expenses ?? []).filter((expense) =>
    isOperationalExpenseCategory(expense.category as ExpenseCategory),
  );
  const indirectExpenses = (expenses ?? []).filter((expense) =>
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
    financial,
    marginToneClass,
  };
}
