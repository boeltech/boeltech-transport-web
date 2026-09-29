import { describe, expect, it, vi } from "vitest";
import { FINANCE_DISPATCH_PERIOD_PATH } from "../../application/financeRoutes";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { mapDispatchWorkbenchBuckets } from "./mapDispatchWorkbenchBuckets";

describe("mapDispatchWorkbenchBuckets", () => {
  it("marca el tab activo y propaga conteos de pendientes, enviadas y periodo", () => {
    const onTabChange = vi.fn();
    const buckets = mapDispatchWorkbenchBuckets({
      activeTab: "pending",
      onTabChange,
      pendingCount: 7,
      sentCount: 3,
      periodCount: 12,
    });

    expect(buckets).toHaveLength(3);
    expect(buckets[0]).toMatchObject({
      id: "pending",
      count: 7,
      isActive: true,
    });
    expect(buckets[1]).toMatchObject({ id: "sent", count: 3, isActive: false });
    expect(buckets[2]).toMatchObject({
      id: "period",
      label: dispatchRunsCopy.workbench.buckets.period,
      description: dispatchRunsCopy.workbench.bucketDescriptions.period,
      count: 12,
      isActive: false,
      crossLink: {
        href: FINANCE_DISPATCH_PERIOD_PATH,
        label: dispatchRunsCopy.workbench.periodLinkAria,
      },
    });

    buckets[1]!.onClick();
    expect(onTabChange).toHaveBeenCalledWith("sent");
  });

  it("muestra Por periodo aunque el total sea 0", () => {
    const buckets = mapDispatchWorkbenchBuckets({
      activeTab: "sent",
      onTabChange: vi.fn(),
      pendingCount: 1,
      sentCount: 2,
      periodCount: 0,
    });

    const period = buckets.find((bucket) => bucket.id === "period");
    expect(period).toBeDefined();
    expect(period?.count).toBe(0);
    expect(period?.crossLink?.href).toBe(FINANCE_DISPATCH_PERIOD_PATH);
  });
});
