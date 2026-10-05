import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { settlementsQueryKeys } from "@features/settlements/application";
import { tripQueryKeys } from "@features/trips/domain";
import { approvalsQueryKeys } from "./approvalsQueryKeys";
import { invalidateApprovalsRelatedQueries } from "./invalidateApprovalsQueries";

const getUnreadCount = vi.fn().mockResolvedValue(0);

vi.mock("@features/notifications/infrastructure", () => ({
  notificationsApi: {
    getUnreadCount: (...args: unknown[]) => getUnreadCount(...args),
  },
}));

describe("invalidateApprovalsRelatedQueries", () => {
  it("invalidates approvals-related queries including settlements and trips, and force-fetches unread count", async () => {
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
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: settlementsQueryKeys.all,
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: tripQueryKeys.all,
      }),
    );
    expect(getUnreadCount).toHaveBeenCalledWith({ force: true });
  });
});
