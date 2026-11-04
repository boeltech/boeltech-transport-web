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
    paymentSource: expense.paymentSource,
    vendorName: expense.vendorName ?? "",
    notes: expense.notes ?? "",
    isEmptyReturn: expense.isEmptyReturn === true,
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
    paymentSource: values.paymentSource,
    vendorName: values.vendorName?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    isEmptyReturn: values.category === "fuel" && values.isEmptyReturn === true,
  };
}

export function formValuesToUpdateExpenseInput(
  values: TripExpenseFormValues,
): UpdateExpenseInput {
  const input: UpdateExpenseInput = {
    category: values.category,
    description: values.description,
    amount: values.amount,
    currency: values.currency,
    vendorName: values.vendorName?.trim() || null,
    notes: values.notes?.trim() || null,
    isEmptyReturn: values.category === "fuel" && values.isEmptyReturn === true,
  };
  // Update: omit payment_source if absent — do not reinject "driver"
  if (values.paymentSource !== undefined) {
    input.paymentSource = values.paymentSource;
  }
  return input;
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
    isEmptyReturn: expense.isEmptyReturn === true,
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
    isEmptyReturn: expense.isEmptyReturn === true,
  }));
}
