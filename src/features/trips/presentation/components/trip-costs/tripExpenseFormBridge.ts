import type { CreateExpenseInput, TripExpense, UpdateExpenseInput } from "@features/trips/domain";
import type { TripExpenseFormValues } from "../../pages/create/components/validation";

export function tripExpenseToFormValues(expense: TripExpense): TripExpenseFormValues {
  return {
    id: expense.id,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    currency: "MXN",
    vendorName: expense.vendorName ?? "",
    notes: expense.notes ?? "",
    isEstimated: expense.isEstimated,
  };
}

export function formValuesToCreateExpenseInput(
  values: TripExpenseFormValues,
): CreateExpenseInput {
  return {
    category: values.category,
    description: values.description,
    amount: values.amount,
    currency: values.currency,
    vendorName: values.vendorName?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    isEstimated: values.isEstimated,
  };
}

export function formValuesToUpdateExpenseInput(
  values: TripExpenseFormValues,
): UpdateExpenseInput {
  return {
    category: values.category,
    description: values.description,
    amount: values.amount,
    currency: values.currency,
    vendorName: values.vendorName?.trim() || null,
    notes: values.notes?.trim() || null,
    isEstimated: values.isEstimated,
  };
}

import type { TripExpenseListItem } from "./TripExpenseEditableList";

export function tripExpensesToListItems(expenses: TripExpense[]): TripExpenseListItem[] {
  return expenses.map((expense) => ({
    id: expense.id,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    vendorName: expense.vendorName ?? undefined,
    status: expense.status,
    isEstimated: expense.isEstimated,
    expenseDate: expense.expenseDate,
    hasReceipt: expense.hasReceipt,
  }));
}

export function tripExpensesToWizardLines(
  expenses: TripExpense[],
): Array<{
  id: string;
  category: string;
  description: string;
  amount: number;
  vendorName?: string;
}> {
  return expenses.map((expense) => ({
    id: expense.id,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    vendorName: expense.vendorName ?? undefined,
  }));
}
