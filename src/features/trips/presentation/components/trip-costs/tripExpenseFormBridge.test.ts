import { describe, expect, it } from "vitest";
import type { TripExpense } from "@features/trips/domain";
import type { TripExpenseFormValues } from "../../pages/create/components/validation";
import {
  formValuesToCreateExpenseInput,
  formValuesToUpdateExpenseInput,
  tripExpenseToFormValues,
  tripExpensesToListItems,
} from "./tripExpenseFormBridge";

function makeExpense(overrides: Partial<TripExpense> = {}): TripExpense {
  const at = new Date("2026-09-20T15:00:00.000Z");
  return {
    id: "expense-usd-1",
    tenantId: "tenant-1",
    tripId: "trip-1",
    category: "fuel",
    subcategory: null,
    satProductCode: null,
    satProductDescription: null,
    description: "Diesel border",
    quantity: null,
    unitPrice: null,
    amount: 120,
    currency: "USD",
    exchangeRate: null,
    paymentMethod: null,
    expenseDate: at,
    location: null,
    latitude: null,
    longitude: null,
    hasReceipt: false,
    receiptUrl: null,
    receiptNumber: null,
    cfdiUuid: null,
    cfdiFolio: null,
    vendorName: "Border Fuel",
    vendorRfc: null,
    paymentSource: "driver",
    status: "pending",
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    selfSegregatedApproval: false,
    approverCountAtApprove: null,
    notes: "Paid in USD",
    createdAt: at,
    updatedAt: at,
    createdBy: "user-1",
    updatedBy: null,
    ...overrides,
  };
}

describe("tripExpenseFormBridge currency", () => {
  it("preserves USD through form values into update input", () => {
    const expense = makeExpense({ currency: "USD", amount: 120 });

    const formValues = tripExpenseToFormValues(expense);
    expect(formValues.currency).toBe("USD");
    expect(formValues.amount).toBe(120);

    const updateInput = formValuesToUpdateExpenseInput(formValues);
    expect(updateInput.currency).toBe("USD");
    expect(updateInput.amount).toBe(120);
  });

  it("falls back to MXN when currency is missing", () => {
    const expense = makeExpense({
      currency: undefined as unknown as TripExpense["currency"],
    });

    expect(tripExpenseToFormValues(expense).currency).toBe("MXN");
  });

  it("does not send isEstimated on create or update payloads", () => {
    const formValues = tripExpenseToFormValues(makeExpense());
    const createInput = formValuesToCreateExpenseInput(formValues);
    const updateInput = formValuesToUpdateExpenseInput(formValues);

    expect(createInput).not.toHaveProperty("isEstimated");
    expect(updateInput).not.toHaveProperty("isEstimated");
    expect(formValues).not.toHaveProperty("isEstimated");
  });
});

describe("tripExpenseFormBridge paymentSource", () => {
  it("round-trips paymentSource through form values into create/update", () => {
    const expense = makeExpense({ paymentSource: "company" });
    const formValues = tripExpenseToFormValues(expense);
    expect(formValues.paymentSource).toBe("company");

    const createInput = formValuesToCreateExpenseInput(formValues);
    expect(createInput.paymentSource).toBe("company");

    const updateInput = formValuesToUpdateExpenseInput(formValues);
    expect(updateInput.paymentSource).toBe("company");
  });

  it("does not reinject driver when paymentSource is missing on update", () => {
    const formValues = tripExpenseToFormValues(makeExpense());
    const withoutSource = {
      ...formValues,
      paymentSource: undefined as unknown as TripExpenseFormValues["paymentSource"],
    };
    const updateInput = formValuesToUpdateExpenseInput(withoutSource);
    expect(updateInput).not.toHaveProperty("paymentSource");
  });

  it("create requires explicit paymentSource (no driver fallback)", () => {
    const formValues = tripExpenseToFormValues(
      makeExpense({ paymentSource: "company" }),
    );
    const createInput = formValuesToCreateExpenseInput(formValues);
    expect(createInput.paymentSource).toBe("company");
    expect(createInput.paymentSource).not.toBeUndefined();
  });

  it("preserves advance through round-trip", () => {
    const expense = makeExpense({ paymentSource: "advance" });
    const formValues = tripExpenseToFormValues(expense);
    expect(formValues.paymentSource).toBe("advance");

    const createInput = formValuesToCreateExpenseInput(formValues);
    expect(createInput.paymentSource).toBe("advance");
  });

  it("includes paymentSource in list items", () => {
    const expenses = [
      makeExpense({ id: "e1", paymentSource: "company" }),
      makeExpense({ id: "e2", paymentSource: "driver" }),
      makeExpense({ id: "e3", paymentSource: "advance" }),
    ];
    const items = tripExpensesToListItems(expenses);
    expect(items[0].paymentSource).toBe("company");
    expect(items[1].paymentSource).toBe("driver");
    expect(items[2].paymentSource).toBe("advance");
  });
});

describe("tripExpenseFormBridge isEmptyReturn", () => {
  it("sends the boolean on create and update, including false", () => {
    const marked = tripExpenseToFormValues(
      makeExpense({ isEmptyReturn: true, description: "Diésel del regreso vacío" }),
    );
    expect(marked.isEmptyReturn).toBe(true);
    expect(formValuesToCreateExpenseInput(marked).isEmptyReturn).toBe(true);
    expect(formValuesToUpdateExpenseInput(marked).isEmptyReturn).toBe(true);

    const unmarked = tripExpenseToFormValues(makeExpense());
    expect(unmarked.isEmptyReturn).toBe(false);
    expect(formValuesToCreateExpenseInput(unmarked).isEmptyReturn).toBe(false);
    expect(formValuesToUpdateExpenseInput(unmarked).isEmptyReturn).toBe(false);
  });

  it("turns the mark off when the category leaves fuel", () => {
    const formValues = tripExpenseToFormValues(
      makeExpense({ isEmptyReturn: true, category: "fuel" }),
    );
    const asTolls = { ...formValues, category: "tolls" as const };
    expect(formValuesToCreateExpenseInput(asTolls).isEmptyReturn).toBe(false);
    expect(formValuesToUpdateExpenseInput(asTolls).isEmptyReturn).toBe(false);
  });

  it("keeps the mark on the list item when the description changes", () => {
    const items = tripExpensesToListItems([
      makeExpense({
        id: "return-1",
        description: "Nota libre que no es la marca",
        isEmptyReturn: true,
      }),
      makeExpense({
        id: "route-1",
        description: "Diésel del regreso vacío",
        isEmptyReturn: false,
      }),
    ]);
    expect(items[0].isEmptyReturn).toBe(true);
    expect(items[0].description).toBe("Nota libre que no es la marca");
    expect(items[1].isEmptyReturn).toBe(false);
  });
});
