import { describe, expect, it } from "vitest";
import type { TripExpense } from "@features/trips/domain";
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

  it("defaults to driver when paymentSource is undefined", () => {
    const expense = makeExpense({
      paymentSource: undefined as unknown as TripExpense["paymentSource"],
    });
    const formValues = tripExpenseToFormValues(expense);
    expect(formValues.paymentSource).toBe("driver");
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
