import { describe, expect, it, vi } from "vitest";
import { mapDispatchWorkbenchBuckets } from "./mapDispatchWorkbenchBuckets";

describe("mapDispatchWorkbenchBuckets", () => {
  it("marca el tab activo y propaga conteos de pendientes y enviadas", () => {
    const onTabChange = vi.fn();
    const buckets = mapDispatchWorkbenchBuckets({
      activeTab: "pending",
      onTabChange,
      pendingCount: 7,
      sentCount: 3,
    });

    expect(buckets).toHaveLength(3);
    expect(buckets[0]).toMatchObject({
      id: "pending",
      count: 7,
      isActive: true,
    });
    expect(buckets[1]).toMatchObject({ id: "sent", count: 3, isActive: false });
    expect(buckets[2]).toMatchObject({
      id: "history",
      count: 0,
      isActive: false,
    });

    buckets[1]!.onClick();
    expect(onTabChange).toHaveBeenCalledWith("sent");
  });
});
