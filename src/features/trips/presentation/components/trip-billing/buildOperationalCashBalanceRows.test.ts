import { describe, expect, it } from "vitest";
import type { OperationalCashReceipt } from "@features/trips/domain";
import { buildOperationalCashBalanceRows } from "./buildOperationalCashBalanceRows";

function receipt(
  partial: Partial<OperationalCashReceipt> &
    Pick<OperationalCashReceipt, "id" | "amount" | "collectedAt">,
): OperationalCashReceipt {
  return {
    tripId: "t1",
    note: null,
    paymentInstrument: "cash",
    reference: null,
    batchId: null,
    createdBy: "u1",
    createdAt: partial.collectedAt,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    ...partial,
  };
}

describe("buildOperationalCashBalanceRows", () => {
  it("acumula saldo después solo con cobros activos", () => {
    const rows = buildOperationalCashBalanceRows(
      [
        receipt({
          id: "r2",
          amount: 4000,
          collectedAt: new Date("2026-11-15T13:10:00Z"),
        }),
        receipt({
          id: "r1",
          amount: 6000,
          collectedAt: new Date("2026-11-14T22:20:00Z"),
        }),
        receipt({
          id: "r0",
          amount: 6500,
          collectedAt: new Date("2026-11-14T22:05:00Z"),
          voidedAt: new Date("2026-11-14T22:06:00Z"),
          voidReason: "Error de captura",
        }),
      ],
      18500,
    );

    expect(rows.map((r) => r.receipt.id)).toEqual(["r0", "r1", "r2"]);
    expect(rows[0]?.balanceAfter).toBeNull();
    expect(rows[1]?.balanceAfter).toBe(12500);
    expect(rows[2]?.balanceAfter).toBe(8500);
  });
});
