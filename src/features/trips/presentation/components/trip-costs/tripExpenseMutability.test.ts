import { describe, expect, it } from "vitest";

import { tripDetailCopy } from "../../copy";
import {
  canMutateTripExpenseRow,
  describeExpenseMutationError,
} from "./tripExpenseMutability";

const toastCopy = tripDetailCopy.costs.toast;
const CLOSED_AT = "2026-05-01T12:00:00.000Z";
const INSIDE_WINDOW = "2026-05-15T12:00:00.000Z";
const OUTSIDE_WINDOW = "2026-06-05T12:00:00.000Z";

describe("canMutateTripExpenseRow", () => {
  it.each(["draft", "scheduled", "in_progress"])(
    "viaje %s: pending/documented mutables; approved/rejected no",
    (tripStatus) => {
      const can = (expenseStatus: "pending" | "documented" | "approved" | "rejected") =>
        canMutateTripExpenseRow({ gate: true, tripStatus, expenseStatus });

      expect(can("pending")).toBe(true);
      expect(can("documented")).toBe(true);
      expect(can("approved")).toBe(false);
      expect(can("rejected")).toBe(false);
    },
  );

  it("completed en ventana: solo pending", () => {
    const can = (expenseStatus: "pending" | "documented" | "approved" | "rejected") =>
      canMutateTripExpenseRow({
        gate: true,
        tripStatus: "completed",
        expenseStatus,
        closedAt: CLOSED_AT,
        now: INSIDE_WINDOW,
      });

    expect(can("pending")).toBe(true);
    expect(can("documented")).toBe(false);
    expect(can("approved")).toBe(false);
    expect(can("rejected")).toBe(false);
  });

  it("completed fuera de ventana o sin closedAt: nada mutable", () => {
    expect(
      canMutateTripExpenseRow({
        gate: true,
        tripStatus: "completed",
        expenseStatus: "pending",
        closedAt: CLOSED_AT,
        now: OUTSIDE_WINDOW,
      }),
    ).toBe(false);
    expect(
      canMutateTripExpenseRow({
        gate: true,
        tripStatus: "completed",
        expenseStatus: "pending",
      }),
    ).toBe(false);
  });

  it("ADR-0099 TEC-5: devuelto para corregir sigue mutable fuera de ventana; el no devuelto no", () => {
    const outside = (returnedForCorrection: boolean) =>
      canMutateTripExpenseRow({
        gate: true,
        tripStatus: "completed",
        expenseStatus: "pending",
        closedAt: CLOSED_AT,
        now: OUTSIDE_WINDOW,
        returnedForCorrection,
      });

    expect(outside(true)).toBe(true);
    expect(outside(false)).toBe(false);
    expect(
      canMutateTripExpenseRow({
        gate: true,
        tripStatus: "completed",
        expenseStatus: "approved",
        closedAt: CLOSED_AT,
        now: OUTSIDE_WINDOW,
        returnedForCorrection: true,
      }),
    ).toBe(false);
    expect(
      canMutateTripExpenseRow({
        gate: false,
        tripStatus: "completed",
        expenseStatus: "pending",
        closedAt: CLOSED_AT,
        now: OUTSIDE_WINDOW,
        returnedForCorrection: true,
      }),
    ).toBe(false);
  });

  it("sin gate RBAC o sin estado del gasto: no mutable", () => {
    expect(
      canMutateTripExpenseRow({
        gate: false,
        tripStatus: "in_progress",
        expenseStatus: "pending",
      }),
    ).toBe(false);
    expect(
      canMutateTripExpenseRow({
        gate: true,
        tripStatus: "in_progress",
        expenseStatus: undefined,
      }),
    ).toBe(false);
  });

  it("cancelled: nada mutable", () => {
    expect(
      canMutateTripExpenseRow({
        gate: true,
        tripStatus: "cancelled",
        expenseStatus: "pending",
      }),
    ).toBe(false);
  });
});

function apiError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

describe("describeExpenseMutationError", () => {
  const notMutable = apiError(
    "EXPENSE_NOT_MUTABLE",
    "El gasto ya fue autorizado y no se puede editar",
  );

  it("EXPENSE_NOT_MUTABLE al editar → copy de edición", () => {
    expect(describeExpenseMutationError(notMutable, "edit")).toBe(
      toastCopy.expenseNotMutableEdit,
    );
  });

  it("EXPENSE_NOT_MUTABLE al eliminar → copy de borrado", () => {
    expect(describeExpenseMutationError(notMutable, "remove")).toBe(
      toastCopy.expenseNotMutableRemove,
    );
  });

  it("otros errores conservan el mensaje del API", () => {
    const other = apiError("VALIDATION_ERROR", "Monto inválido");
    expect(describeExpenseMutationError(other, "edit")).toBe("Monto inválido");
    expect(describeExpenseMutationError("boom", "remove")).toBeUndefined();
  });
});
