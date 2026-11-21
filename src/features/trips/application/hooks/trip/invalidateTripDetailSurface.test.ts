import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import {
  cancelFinanceAnalysisRefresh,
  FINANCE_ANALYSIS_REFRESH_DELAY_MS,
} from "@features/approvals/application/invalidateApprovalsQueries";
import { dashboardQueryKeys } from "@features/dashboard/application/dashboardQueryKeys";
import { financeQueryKeys } from "@features/finance/application/financeQueryKeys";
import { TripStatus, tripQueryKeys } from "@features/trips/domain";

import { invalidateTripDetailSurface } from "./invalidateTripDetailSurface";

describe("invalidateTripDetailSurface", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.useFakeTimers();
    cancelFinanceAnalysisRefresh();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    cancelFinanceAnalysisRefresh();
    vi.useRealTimers();
  });

  it("purges timeline when status is cancelled", async () => {
    const tripId = "trip-1";
    queryClient.setQueryData(tripQueryKeys.detail(tripId), {
      id: tripId,
      status: TripStatus.IN_PROGRESS,
    });
    queryClient.setQueryData(tripQueryKeys.timeline(tripId), {
      trip: { status: TripStatus.IN_PROGRESS },
    });

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.CANCELLED,
    });

    expect(queryClient.getQueryState(tripQueryKeys.detail(tripId))?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryData(tripQueryKeys.timeline(tripId))).toBeUndefined();
  });

  it("purges timeline when status is scheduled (post-confirm)", async () => {
    const tripId = "trip-2";
    queryClient.setQueryData(tripQueryKeys.timeline(tripId), {
      trip: { status: TripStatus.DRAFT },
    });

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.SCHEDULED,
    });

    expect(queryClient.getQueryData(tripQueryKeys.timeline(tripId))).toBeUndefined();
  });

  it("invalidates timeline (keeps cache) when status is in_progress", async () => {
    const tripId = "trip-3";
    const timeline = { trip: { status: TripStatus.IN_PROGRESS } };
    queryClient.setQueryData(tripQueryKeys.timeline(tripId), timeline);

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.IN_PROGRESS,
    });

    expect(queryClient.getQueryData(tripQueryKeys.timeline(tripId))).toEqual(timeline);
    expect(
      queryClient.getQueryState(tripQueryKeys.timeline(tripId))?.isInvalidated,
    ).toBe(true);
  });

  it("purges timeline when status is omitted", async () => {
    const tripId = "trip-4";
    queryClient.setQueryData(tripQueryKeys.timeline(tripId), {
      trip: { status: TripStatus.IN_PROGRESS },
    });

    await invalidateTripDetailSurface(queryClient, tripId);

    expect(queryClient.getQueryData(tripQueryKeys.timeline(tripId))).toBeUndefined();
  });

  it("invalidates revenue-split alongside trip detail (C7)", async () => {
    const tripId = "trip-5";
    queryClient.setQueryData(tripQueryKeys.detail(tripId), { id: tripId });
    queryClient.setQueryData(tripQueryKeys.revenueSplit(tripId), {
      status: "active",
    });

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.CANCELLED,
    });

    expect(
      queryClient.getQueryState(tripQueryKeys.detail(tripId))?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(tripQueryKeys.revenueSplit(tripId))
        ?.isInvalidated,
    ).toBe(true);
  });

  it("invalidates dashboard live queries (Viajes de hoy / en ruta)", async () => {
    const tripId = "trip-6";
    queryClient.setQueryData(dashboardQueryKeys.all, {
      tripsToday: [],
    });

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.IN_PROGRESS,
    });

    expect(
      queryClient.getQueryState(dashboardQueryKeys.all)?.isInvalidated,
    ).toBe(true);
  });

  it("invalidates opsDaySummary and invoiceable-summary prefix (Q01·Q02)", async () => {
    const tripId = "trip-7";
    queryClient.setQueryData(tripQueryKeys.opsDaySummary(), { tripsToday: 1 });
    queryClient.setQueryData(tripQueryKeys.invoiceableSummary(""), {
      ready: 0,
    });
    queryClient.setQueryData(tripQueryKeys.invoiceableSummary("acme"), {
      ready: 2,
    });

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.COMPLETED,
    });

    expect(
      queryClient.getQueryState(tripQueryKeys.opsDaySummary())?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(tripQueryKeys.invoiceableSummary(""))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(tripQueryKeys.invoiceableSummary("acme"))
        ?.isInvalidated,
    ).toBe(true);
  });

  it("invalidates Análisis keys immediately and schedules MV refresh (Q03)", async () => {
    const tripId = "trip-8";
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.COMPLETED,
    });

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

  it("invalidates Análisis on cancel as well (Q03)", async () => {
    const tripId = "trip-9";
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await invalidateTripDetailSurface(queryClient, tripId, {
      status: TripStatus.CANCELLED,
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...financeQueryKeys.all, "profitability-trips"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [...financeQueryKeys.all, "monthly-performance"],
    });
  });
});