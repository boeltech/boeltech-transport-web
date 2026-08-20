import { describe, expect, it } from "vitest";
import {
  isFinanceAnalyticsEnabled,
  isFinanceCobrosTabEnabled,
} from "./financeHubAccess";

describe("isFinanceAnalyticsEnabled", () => {
  it("returns false for client portal even with finance.read", () => {
    expect(
      isFinanceAnalyticsEnabled({
        isClientPortal: true,
        hasFinanceRead: true,
      }),
    ).toBe(false);
  });

  it("returns false for staff without finance.read (dispatcher)", () => {
    expect(
      isFinanceAnalyticsEnabled({
        isClientPortal: false,
        hasFinanceRead: false,
      }),
    ).toBe(false);
  });

  it("returns true for staff with finance.read", () => {
    expect(
      isFinanceAnalyticsEnabled({
        isClientPortal: false,
        hasFinanceRead: true,
      }),
    ).toBe(true);
  });
});

describe("isFinanceCobrosTabEnabled", () => {
  it("returns false for client portal even with finance.create", () => {
    expect(
      isFinanceCobrosTabEnabled({
        isClientPortal: true,
        hasFinanceCreate: true,
      }),
    ).toBe(false);
  });

  it("returns false for staff without finance.create (dispatcher)", () => {
    expect(
      isFinanceCobrosTabEnabled({
        isClientPortal: false,
        hasFinanceCreate: false,
      }),
    ).toBe(false);
  });

  it("returns true for staff with finance.create", () => {
    expect(
      isFinanceCobrosTabEnabled({
        isClientPortal: false,
        hasFinanceCreate: true,
      }),
    ).toBe(true);
  });
});
