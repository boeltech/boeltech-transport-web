import { describe, expect, it } from "vitest";
import { tripOrderCopy } from "../../copy/tripDetail/tripOrderCopy";
import {
  describeTripOrderDisabledReason,
  resolveTripOrderCardVisible,
  shouldQueryTripOrder,
} from "./tripOrderHelpers";

const card = tripOrderCopy.card;

describe("shouldQueryTripOrder", () => {
  const ok = {
    canRead: true,
    isClientPortalView: false,
    isDriverPortalView: false,
  };

  it("consulta con permiso read y sin portal", () => {
    expect(shouldQueryTripOrder(ok)).toBe(true);
  });

  it("no consulta sin read ni en portales", () => {
    expect(shouldQueryTripOrder({ ...ok, canRead: false })).toBe(false);
    expect(shouldQueryTripOrder({ ...ok, isClientPortalView: true })).toBe(false);
    expect(shouldQueryTripOrder({ ...ok, isDriverPortalView: true })).toBe(false);
  });
});

describe("resolveTripOrderCardVisible", () => {
  it("oculta si kill-switch enabled=false", () => {
    expect(resolveTripOrderCardVisible({ enabled: false })).toBe(false);
    expect(resolveTripOrderCardVisible({ enabled: true })).toBe(true);
    expect(resolveTripOrderCardVisible(undefined)).toBe(false);
  });
});

describe("describeTripOrderDisabledReason", () => {
  it("mapea códigos a copy PRD", () => {
    expect(describeTripOrderDisabledReason("TRIP_ORDER_STATUS_DRAFT")).toBe(
      card.disabled.draft,
    );
    expect(
      describeTripOrderDisabledReason("TRIP_ORDER_THRESHOLD_INCOMPLETE"),
    ).toBe(card.disabled.threshold);
    expect(describeTripOrderDisabledReason("TRIP_ORDER_STATUS_CANCELLED")).toBe(
      card.disabled.cancelled,
    );
    expect(describeTripOrderDisabledReason("TRIP_ORDER_NOT_OUTDATED")).toBeNull();
    expect(describeTripOrderDisabledReason(null)).toBeNull();
  });
});
