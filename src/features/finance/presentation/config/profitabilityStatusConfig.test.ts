import { describe, expect, it } from "vitest";
import type { ProfitabilityStatus } from "../../domain";
import { financeCopy } from "../copy";
import {
  getProfitabilityStatusConfig,
  profitabilityStatusConfig,
} from "./profitabilityStatusConfig";

const ALL_STATUSES: ProfitabilityStatus[] = [
  "high",
  "medium",
  "low",
  "breakeven",
  "loss",
];

describe("profitabilityStatusConfig", () => {
  it("maps every profitability status to a label and semantic badge", () => {
    for (const status of ALL_STATUSES) {
      const config = profitabilityStatusConfig[status];
      expect(config.label).toBe(financeCopy.profitability.statuses[status]);
      expect(config.badge.tone).toBe("soft");
      expect(config.badge.variant).toBeTruthy();
    }
  });

  it("getProfitabilityStatusConfig returns the same entry", () => {
    expect(getProfitabilityStatusConfig("loss").badge.variant).toBe(
      "destructive",
    );
  });
});
