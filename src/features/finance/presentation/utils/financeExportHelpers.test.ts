import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfitabilityAggregateItem } from "@features/finance/domain";
import { financeCopy } from "../copy";
import {
  buildProfitabilityAggregateCsv,
  exportProfitabilityTripsCsv,
} from "./financeExportHelpers";

const mockDownloadCsv = vi.fn();

vi.mock("@shared/utils/exportCsv", () => ({
  downloadCsv: (...args: unknown[]) => mockDownloadCsv(...args),
}));

function item(key: string, margin: number): ProfitabilityAggregateItem {
  return {
    key,
    label: `Cliente ${key}`,
    tripCount: 2,
    totalRevenue: margin * 2,
    totalActual: margin,
    blendedMargin: margin,
    blendedMarginPct: 50,
  };
}

describe("buildProfitabilityAggregateCsv", () => {
  it("exports every visible group with its dimension and period, in screen order", () => {
    const items = Array.from({ length: 150 }, (_, index) => item(`c${index}`, 1000 - index));
    const csv = buildProfitabilityAggregateCsv(items, {
      dimension: "client",
      scope: "operational",
      from: "2025-10-01",
      to: "2026-09-30",
    });
    expect(csv.headers).toEqual([
      "dimension",
      "scope",
      "from",
      "to",
      "key",
      "label",
      "trip_count",
      "total_revenue",
      "total_actual",
      "blended_margin",
      "blended_margin_pct",
    ]);
    expect(csv.rows).toHaveLength(150);
    expect(csv.rows[0]).toEqual([
      "client",
      "operational",
      "2025-10-01",
      "2026-09-30",
      "c0",
      "Cliente c0",
      2,
      2000,
      1000,
      1000,
      50,
    ]);
  });
});

describe("export filename date (día civil CDMX)", () => {
  beforeEach(() => {
    mockDownloadCsv.mockClear();
    vi.useFakeTimers();
    // 2026-10-11 23:30 CDMX — en UTC ya es 12 de octubre.
    vi.setSystemTime(new Date("2026-10-12T05:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("names profitability CSV with Mexico civil day, not UTC", () => {
    exportProfitabilityTripsCsv([]);
    expect(mockDownloadCsv.mock.calls[0]?.[0]).toBe(
      `${financeCopy.exports.files.profitability}-2026-10-11.csv`,
    );
  });
});
