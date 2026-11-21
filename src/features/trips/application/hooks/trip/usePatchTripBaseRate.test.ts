import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { financeQueryKeys } from "@features/finance/application/financeQueryKeys";
import { tripQueryKeys } from "@features/trips/domain";
import { usePatchTripBaseRate } from "./usePatchTripBaseRate";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const setQueryData = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);
const scheduleFinanceAnalysisRefresh = vi.fn();
const invalidateFinanceAnalysisQueries = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({
    invalidateQueries,
    setQueryData,
  }),
}));

vi.mock("@features/approvals/application/invalidateApprovalsQueries", () => ({
  invalidateFinanceAnalysisQueries: (...args: unknown[]) =>
    invalidateFinanceAnalysisQueries(...args),
  scheduleFinanceAnalysisRefresh: (...args: unknown[]) =>
    scheduleFinanceAnalysisRefresh(...args),
}));

vi.mock("@features/trips/infrastructure/api/tripsApi", () => ({
  tripsApi: {
    patchBaseRate: vi.fn(),
  },
}));

describe("usePatchTripBaseRate", () => {
  const tripId = "trip-rate-1";

  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    setQueryData.mockReset();
    useMutationMock.mockClear();
    scheduleFinanceAnalysisRefresh.mockReset();
    invalidateFinanceAnalysisQueries.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("invalidates Análisis keys and schedules MV refresh after base rate patch (Q03)", async () => {
    const mutationConfig = usePatchTripBaseRate(tripId) as unknown as {
      onSuccess: (
        data: { id: string; baseRate: number },
        variables: number,
        onMutateResult: unknown,
        context: unknown,
      ) => Promise<void>;
    };

    await mutationConfig.onSuccess(
      { id: tripId, baseRate: 12_500 },
      12_500,
      undefined,
      undefined,
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.detail(tripId),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: tripQueryKeys.lists(),
    });
    expect(invalidateFinanceAnalysisQueries).toHaveBeenCalledTimes(1);
    expect(scheduleFinanceAnalysisRefresh).toHaveBeenCalledTimes(1);

    // Guard against silent drift: helpers must still target the Análisis prefixes.
    expect([
      [...financeQueryKeys.all, "profitability-trips"],
      [...financeQueryKeys.all, "profitability-aggregate"],
      [...financeQueryKeys.all, "monthly-performance"],
    ]).toHaveLength(3);
  });
});
