import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { approvalsQueryKeys } from "./approvalsQueryKeys";
import { invalidateApprovalsRelatedQueries } from "./invalidateApprovalsQueries";

const getUnreadCount = vi.fn().mockResolvedValue(0);

vi.mock("@features/notifications/infrastructure", () => ({
  notificationsApi: {
    getUnreadCount: (...args: unknown[]) => getUnreadCount(...args),
  },
}));

describe("invalidateApprovalsRelatedQueries", () => {
  it("invalidates approvals-related queries and force-fetches unread count", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const fetchSpy = vi.spyOn(queryClient, "fetchQuery");

    invalidateApprovalsRelatedQueries(queryClient);

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: approvalsQueryKeys.all,
      }),
    );
    expect(getUnreadCount).toHaveBeenCalledWith({ force: true });
  });
});
