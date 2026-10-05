import type { CreateExpenseInput, TripExpense, UpdateExpenseInput } from "@features/trips/domain";
import type { TripExpenseFormValues } from "../../pages/create/components/validation";
import type { TripExpenseListItem } from "./TripExpenseEditableList";

export function tripExpenseToFormValues(expense: TripExpense): TripExpenseFormValues {
  return {
    id: expense.id,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency ?? "MXN",
    paymentSource: expense.paymentSource ?? "driver",
    vendorName: expense.vendorName ?? "",
    notes: expense.notes ?? "",
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
    paymentSource: values.paymentSource ?? "driver",
    vendorName: values.vendorName?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
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
    paymentSource: values.paymentSource ?? "driver",
    vendorName: values.vendorName?.trim() || null,
    notes: values.notes?.trim() || null,
  };
}

export function tripExpensesToListItems(expenses: TripExpense[]): TripExpenseListItem[] {
  return expenses.map((expense) => ({
    id: expense.id,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    vendorName: expense.vendorName ?? undefined,
    paymentSource: expense.paymentSource,
    status: expense.status,
    expenseDate: expense.expenseDate,
    hasReceipt: expense.hasReceipt,
    createdBy: expense.createdBy,
    selfSegregatedApproval: expense.selfSegregatedApproval,
    ...(expense.approval !== undefined ? { approval: expense.approval } : {}),
    ...(expense.approvalRevision !== undefined
      ? { approvalRevision: expense.approvalRevision }
      : {}),
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
  status: string;
}> {
  return expenses.map((expense) => ({
    id: expense.id,
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    vendorName: expense.vendorName ?? undefined,
    status: expense.status,
  }));
}
