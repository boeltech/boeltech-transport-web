import { describe, expect, it } from "vitest";
import {
  isoWeekNumber,
  resolveClosedPeriodBanner,
} from "./closedPeriodBanner";
import type {
  SettlementBacklogRow,
  SettlementWorkbenchSummary,
} from "../../domain/entities";

const summary: SettlementWorkbenchSummary = {
  pending: 2,
  draft: 0,
  approval: 0,
  payable: 0,
  closed: 0,
  openAdvances: 0,
  kpis: {
    toArm: { count: 2, amount: 390_760 },
    inApproval: { count: 0, amount: 0 },
    authorizedUnpaid: { count: 0, amount: 0 },
    advancesToDeduct: { count: 0, amount: 0 },
  },
};

const backlog: SettlementBacklogRow[] = [
  {
    employeeId: "e1",
    employeeFullName: "Juan",
    branchId: null,
    branchName: null,
    periodStart: "2026-11-02",
    periodEnd: "2026-11-08",
    pendingTripsCount: 1,
    oldestTripAgeDays: 1,
    estimatedNetAmount: 200_000,
    rowType: "trips_pending",
    warnings: ["open_advance"],
    periodOverlap: null,
  },
  {
    employeeId: "e2",
    employeeFullName: "Ana",
    branchId: null,
    branchName: null,
    periodStart: "2026-11-02",
    periodEnd: "2026-11-08",
    pendingTripsCount: 0,
    oldestTripAgeDays: 0,
    estimatedNetAmount: 190_760,
    rowType: "salary_close",
    warnings: [],
    periodOverlap: null,
  },
];

describe("closedPeriodBanner", () => {
  it("computes ISO week from period end", () => {
    expect(isoWeekNumber("2026-11-08")).toBe(45);
  });

  it("builds banner model when there is backlog to arm", () => {
    const model = resolveClosedPeriodBanner(summary, backlog);
    expect(model).toEqual({
      monthLabel: "NOV",
      dayRange: "2–8",
      weekLabel: "45",
      operatorCount: 2,
      estimatedAmount: 390_760,
      warningsCount: 1,
      otherPeriodsCount: 0,
      periodStart: "2026-11-02",
      periodEnd: "2026-11-08",
      namedWeek: true,
    });
  });

  it("counts only the announced period and notes others (C7)", () => {
    const mixed: typeof backlog = [
      backlog[0]!,
      {
        ...backlog[1]!,
        employeeId: "e3",
        periodStart: "2026-10-12",
        periodEnd: "2026-10-18",
        estimatedNetAmount: 50_000,
      },
    ];
    const model = resolveClosedPeriodBanner(
      { ...summary, pending: 2, kpis: { ...summary.kpis!, toArm: { count: 2, amount: 250_000 } } },
      mixed,
    );
    expect(model?.operatorCount).toBe(1);
    expect(model?.otherPeriodsCount).toBe(1);
    expect(model?.namedWeek).toBe(true);
    expect(model?.periodStart).toBe("2026-11-02");
  });

  it("returns null when nothing to arm", () => {
    expect(
      resolveClosedPeriodBanner({ ...summary, pending: 0, kpis: undefined }, []),
    ).toBeNull();
  });

  it("PM-01: no publica Estimado $0.00 cuando el periodo anunciado no tiene monto", () => {
    const zeroPeriod: typeof backlog = [
      {
        ...backlog[0]!,
        estimatedNetAmount: 0,
      },
      {
        ...backlog[1]!,
        employeeId: "e3",
        periodStart: "2026-10-12",
        periodEnd: "2026-10-18",
        estimatedNetAmount: 50_000,
      },
    ];
    const model = resolveClosedPeriodBanner(
      {
        ...summary,
        pending: 2,
        kpis: { ...summary.kpis!, toArm: { count: 2, amount: 50_000 } },
      },
      zeroPeriod,
    );
    expect(model?.operatorCount).toBe(1);
    expect(model?.estimatedAmount).toBeNull();
  });
});
