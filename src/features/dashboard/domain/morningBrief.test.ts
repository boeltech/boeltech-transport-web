import { describe, expect, it } from "vitest";
import {
  buildPendingApprovalsHref,
  resolvePendingApprovalsDestinationType,
  shouldShowMorningBrief,
} from "./morningBrief";

describe("resolvePendingApprovalsDestinationType", () => {
  const zero = {
    trip_expense: 0,
    driver_advance_request: 0,
    internal_staff_compensation: 0,
  };

  it("prioriza trip_expense si tiene pendientes", () => {
    expect(
      resolvePendingApprovalsDestinationType({
        ...zero,
        trip_expense: 2,
        driver_advance_request: 5,
      }),
    ).toBe("trip_expense");
  });

  it("cae a anticipos y luego a compensación", () => {
    expect(
      resolvePendingApprovalsDestinationType({
        ...zero,
        driver_advance_request: 1,
        internal_staff_compensation: 4,
      }),
    ).toBe("driver_advance_request");
    expect(
      resolvePendingApprovalsDestinationType({
        ...zero,
        internal_staff_compensation: 4,
      }),
    ).toBe("internal_staff_compensation");
  });

  it("todos en 0, sin datos o parcial → trip_expense", () => {
    expect(resolvePendingApprovalsDestinationType(zero)).toBe("trip_expense");
    expect(resolvePendingApprovalsDestinationType(undefined)).toBe(
      "trip_expense",
    );
    expect(resolvePendingApprovalsDestinationType(null)).toBe("trip_expense");
    expect(resolvePendingApprovalsDestinationType({})).toBe("trip_expense");
  });
});

describe("buildPendingApprovalsHref", () => {
  it("arma la URL de la bandeja con el type elegido", () => {
    expect(
      buildPendingApprovalsHref("/finance/approvals", {
        trip_expense: 0,
        driver_advance_request: 3,
        internal_staff_compensation: 1,
      }),
    ).toBe("/finance/approvals?type=driver_advance_request");
    expect(buildPendingApprovalsHref("/finance/approvals", undefined)).toBe(
      "/finance/approvals?type=trip_expense",
    );
  });
});

describe("shouldShowMorningBrief", () => {
  it("muestra banda para admin con lectura de viajes", () => {
    expect(
      shouldShowMorningBrief({
        role: "admin",
        canReadTrips: true,
        showFinance: false,
      }),
    ).toBe(true);
  });

  it("muestra banda para manager solo con finance + trips", () => {
    expect(
      shouldShowMorningBrief({
        role: "manager",
        canReadTrips: true,
        showFinance: true,
      }),
    ).toBe(true);
    expect(
      shouldShowMorningBrief({
        role: "manager",
        canReadTrips: true,
        showFinance: false,
      }),
    ).toBe(false);
  });

  it("oculta banda para otros roles", () => {
    for (const role of [
      "accountant",
      "dispatcher",
      "operator",
      "driver",
      "client",
    ] as const) {
      expect(
        shouldShowMorningBrief({
          role,
          canReadTrips: true,
          showFinance: true,
        }),
      ).toBe(false);
    }
  });

  it("oculta banda sin lectura de viajes", () => {
    expect(
      shouldShowMorningBrief({
        role: "admin",
        canReadTrips: false,
        showFinance: true,
      }),
    ).toBe(false);
  });
});
