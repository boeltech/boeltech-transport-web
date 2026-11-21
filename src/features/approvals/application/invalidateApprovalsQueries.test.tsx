import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { financeQueryKeys } from "@features/finance/application/financeQueryKeys";
import { settlementsQueryKeys } from "@features/settlements/application";
import { tripQueryKeys } from "@features/trips/application/tripsQueryKeys";
import { approvalsQueryKeys } from "./approvalsQueryKeys";
import {
  cancelFinanceAnalysisRefresh,
  FINANCE_ANALYSIS_REFRESH_DELAY_MS,
  invalidateApprovalsRelatedQueries,
  scheduleFinanceAnalysisRefresh,
} from "./invalidateApprovalsQueries";

const getUnreadCount = vi.fn().mockResolvedValue(0);

vi.mock("@features/notifications/infrastructure", () => ({
  notificationsApi: {
    getUnreadCount: (...args: unknown[]) => getUnreadCount(...args),
  },
}));

describe("invalidateApprovalsRelatedQueries", () => {
  afterEach(() => {
    cancelFinanceAnalysisRefresh();
    vi.useRealTimers();
  });

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

  it("schedules a delayed Análisis refresh (~70 s) in addition to immediate invalidation", () => {
    vi.useFakeTimers();
    cancelFinanceAnalysisRefresh();

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    invalidateApprovalsRelatedQueries(queryClient);

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: financeQueryKeys.all }),
    );

    const immediateAnalysisCalls = invalidateSpy.mock.calls.filter(
      ([arg]) =>
        Array.isArray((arg as { queryKey?: unknown[] }).queryKey) &&
        ((arg as { queryKey: unknown[] }).queryKey[1] ===
          "profitability-trips" ||
          (arg as { queryKey: unknown[] }).queryKey[1] ===
            "profitability-aggregate" ||
          (arg as { queryKey: unknown[] }).queryKey[1] ===
            "monthly-performance"),
    );
    expect(immediateAnalysisCalls).toHaveLength(0);

    invalidateSpy.mockClear();
    vi.advanceTimersByTime(FINANCE_ANALYSIS_REFRESH_DELAY_MS);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...financeQueryKeys.all, "profitability-trips"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...financeQueryKeys.all, "profitability-aggregate"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...financeQueryKeys.all, "monthly-performance"],
    });
  });

  it("keeps a single pending timer when two decisions schedule refresh", () => {
    vi.useFakeTimers();
    cancelFinanceAnalysisRefresh();

    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    scheduleFinanceAnalysisRefresh(queryClient);
    vi.advanceTimersByTime(30_000);
    scheduleFinanceAnalysisRefresh(queryClient);

    invalidateSpy.mockClear();
    vi.advanceTimersByTime(FINANCE_ANALYSIS_REFRESH_DELAY_MS - 1);
    expect(invalidateSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...financeQueryKeys.all, "profitability-trips"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...financeQueryKeys.all, "profitability-aggregate"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...financeQueryKeys.all, "monthly-performance"],
    });

    invalidateSpy.mockClear();
    vi.advanceTimersByTime(FINANCE_ANALYSIS_REFRESH_DELAY_MS);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
