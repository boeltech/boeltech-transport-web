import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { notificationsQueryKeys } from "./notificationsQueryKeys";
import { invalidateNotificationsQueries } from "./invalidateNotificationsQueries";

const getUnreadCount = vi.fn().mockResolvedValue(0);

vi.mock("../infrastructure", () => ({
  notificationsApi: {
    getUnreadCount: (...args: unknown[]) => getUnreadCount(...args),
  },
}));

describe("invalidateNotificationsQueries", () => {
  it("force-fetches unread count and invalidates other notification queries", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const fetchSpy = vi.spyOn(queryClient, "fetchQuery");

    invalidateNotificationsQueries(queryClient);

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: notificationsQueryKeys.all,
      }),
    );
    expect(getUnreadCount).toHaveBeenCalledWith({ force: true });
  });
});
