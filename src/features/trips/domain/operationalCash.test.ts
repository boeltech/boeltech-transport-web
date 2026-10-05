import { describe, expect, it } from "vitest";
import {
  canRegisterOperationalCashAbono,
  classifyOperationalCashCollection,
  hasOperationalCashCollected,
  resolveOperationalCashSummary,
} from "./operationalCash";

describe("classifyOperationalCashCollection", () => {
  it("classifies pending / partial / collected vs base rate", () => {
    expect(classifyOperationalCashCollection(0, 24500)).toBe("pending");
    expect(classifyOperationalCashCollection(10000, 24500)).toBe("partial");
    expect(classifyOperationalCashCollection(24500, 24500)).toBe("collected");
    expect(classifyOperationalCashCollection(24499.995, 24500)).toBe(
      "collected",
    );
  });
});

describe("hasOperationalCashCollected", () => {
  it("locks on partial/collected summary or projection", () => {
    expect(
      hasOperationalCashCollected({
        operationalCash: {
          status: "pending",
          collectedTotal: 0,
          pendingAmount: 100,
          baseRate: 100,
          receiptCount: 0,
        },
      }),
    ).toBe(false);
    expect(
      hasOperationalCashCollected({
        operationalCash: {
          status: "partial",
          collectedTotal: 10,
          pendingAmount: 90,
          baseRate: 100,
          receiptCount: 1,
        },
      }),
    ).toBe(true);
    expect(
      hasOperationalCashCollected({
        operationalCashCollectedAt: new Date("2026-10-04T12:00:00.000Z"),
      }),
    ).toBe(true);
    expect(
      hasOperationalCashCollected({ operationalCashAmount: 500 }),
    ).toBe(true);
  });
});

describe("resolveOperationalCashSummary", () => {
  it("prefers API summary and falls back to projection", () => {
    const summary = {
      status: "partial" as const,
      collectedTotal: 10000,
      pendingAmount: 14500,
      baseRate: 24500,
      receiptCount: 1,
    };
    expect(
      resolveOperationalCashSummary({ operationalCash: summary }),
    ).toEqual(summary);
    expect(
      resolveOperationalCashSummary(
        { operationalCashAmount: 10000, operationalCash: null },
        24500,
      ),
    ).toMatchObject({
      status: "partial",
      collectedTotal: 10000,
      pendingAmount: 14500,
      baseRate: 24500,
    });
  });
});

describe("canRegisterOperationalCashAbono", () => {
  it("allows while pending amount remains", () => {
    expect(
      canRegisterOperationalCashAbono({
        status: "partial",
        pendingAmount: 14500,
      }),
    ).toBe(true);
    expect(
      canRegisterOperationalCashAbono({
        status: "collected",
        pendingAmount: 0,
      }),
    ).toBe(false);
  });
});
