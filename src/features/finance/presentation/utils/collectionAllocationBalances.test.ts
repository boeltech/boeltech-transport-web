import { describe, expect, it } from "vitest";
import {
  allocationNeedsRepEnrich,
  buildBalancesByPayment,
  resolveAllocationRepFields,
  type BalancePaymentInput,
} from "./collectionAllocationBalances";

function payment(
  overrides: Partial<BalancePaymentInput> & Pick<BalancePaymentInput, "id">,
): BalancePaymentInput {
  return {
    amountMxn: 5000,
    paymentDate: "2026-11-01",
    paymentTime: "12:00:00",
    repImpPagado: null,
    repImpSaldoAnt: null,
    repImpSaldoInsoluto: null,
    repNumParcialidad: null,
    ...overrides,
  };
}

describe("buildBalancesByPayment", () => {
  it("computes installment and balances when REP fields are null", () => {
    const map = buildBalancesByPayment(
      [
        payment({ id: "p1", amountMxn: 5000, paymentDate: "2026-10-01" }),
        payment({ id: "p2", amountMxn: 3180, paymentDate: "2026-11-01" }),
      ],
      8180,
    );

    expect(map.get("p1")).toEqual({
      installment: 1,
      balanceBefore: 8180,
      balanceAfter: 3180,
    });
    expect(map.get("p2")).toEqual({
      installment: 2,
      balanceBefore: 3180,
      balanceAfter: 0,
    });
  });

  it("prefers persisted REP snapshot when present", () => {
    const map = buildBalancesByPayment(
      [
        payment({
          id: "p1",
          amountMxn: 5000,
          repNumParcialidad: 2,
          repImpSaldoAnt: 8180,
          repImpSaldoInsoluto: 3200,
          repImpPagado: 4980,
        }),
      ],
      8180,
    );

    expect(map.get("p1")).toEqual({
      installment: 2,
      balanceBefore: 8180,
      balanceAfter: 3200,
    });
  });
});

describe("resolveAllocationRepFields", () => {
  it("returns allocation snapshot when complete", () => {
    expect(
      resolveAllocationRepFields(
        {
          amount: 45000,
          repNumParcialidad: 2,
          repImpSaldoAnt: 8180,
          repImpSaldoInsoluto: 3200,
        },
        "pay-1",
        undefined,
      ),
    ).toEqual({
      installment: 2,
      balanceBefore: 8180,
      balanceAfter: 3200,
    });
  });

  it("derives from invoice context when allocation REP is null (Camino A)", () => {
    const resolved = resolveAllocationRepFields(
      {
        amount: 4980,
        repNumParcialidad: null,
        repImpSaldoAnt: null,
        repImpSaldoInsoluto: null,
      },
      "pay-2",
      {
        total: 8180,
        payments: [
          payment({ id: "pay-1", amountMxn: 3200, paymentDate: "2026-10-01" }),
          payment({ id: "pay-2", amountMxn: 4980, paymentDate: "2026-11-01" }),
        ],
      },
    );

    expect(resolved).toEqual({
      installment: 2,
      balanceBefore: 4980,
      balanceAfter: 0,
    });
  });

  it("derives missing saldo from the other + amount", () => {
    expect(
      resolveAllocationRepFields(
        {
          amount: 1000,
          repNumParcialidad: 1,
          repImpSaldoAnt: 1000,
          repImpSaldoInsoluto: null,
        },
        "pay-1",
        undefined,
      ),
    ).toEqual({
      installment: 1,
      balanceBefore: 1000,
      balanceAfter: 0,
    });
  });
});

describe("allocationNeedsRepEnrich", () => {
  it("is true when any REP field is null", () => {
    expect(
      allocationNeedsRepEnrich({
        repNumParcialidad: 1,
        repImpSaldoAnt: null,
        repImpSaldoInsoluto: 0,
      }),
    ).toBe(true);
    expect(
      allocationNeedsRepEnrich({
        repNumParcialidad: 1,
        repImpSaldoAnt: 100,
        repImpSaldoInsoluto: 0,
      }),
    ).toBe(false);
  });
});
