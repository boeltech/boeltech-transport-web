import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { settlementsQueryKeys } from "./settlementsQueryKeys";
import { invalidateSettlementQueries } from "./invalidateSettlementsQueries";

vi.mock("@features/approvals/application", () => ({
  invalidateApprovalsRelatedQueries: vi.fn(),
}));

vi.mock("@features/notifications/infrastructure", () => ({
  notificationsApi: {
    getUnreadCount: vi.fn().mockResolvedValue(0),
  },
}));

describe("invalidateSettlementQueries", () => {
  it("invalidates settlements list, advances, optional detail, and approvals hub", async () => {
    const { invalidateApprovalsRelatedQueries } = await import(
      "@features/approvals/application"
    );
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    invalidateSettlementQueries(queryClient, "stl-1");

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: settlementsQueryKeys.settlementDetail("stl-1"),
      }),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: settlementsQueryKeys.settlements(),
      }),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: settlementsQueryKeys.advances(),
      }),
    );
    expect(invalidateApprovalsRelatedQueries).toHaveBeenCalledWith(queryClient);
  });
});
