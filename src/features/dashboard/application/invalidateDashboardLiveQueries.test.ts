import { describe, expect, it, vi } from "vitest";
import type { QueryClient } from "@tanstack/react-query";

import { dashboardQueryKeys } from "@features/dashboard/domain";
import { invalidateDashboardLiveQueries } from "./invalidateDashboardLiveQueries";

describe("invalidateDashboardLiveQueries", () => {
  it("invalidates dashboardQueryKeys.all", () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidateDashboardLiveQueries(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all,
    });
  });
});
