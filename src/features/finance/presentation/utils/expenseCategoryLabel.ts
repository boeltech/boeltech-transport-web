import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryType,
} from "@features/trips/domain";

export function expenseCategoryLabel(category: string): string {
  return (
    EXPENSE_CATEGORY_LABELS[category as ExpenseCategoryType] ?? category
  );
}
