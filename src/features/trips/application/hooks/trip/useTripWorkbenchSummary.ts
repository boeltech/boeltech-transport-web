/**
 * useTripWorkbenchSummary — ADR-0090 workbench de viajes.
 *
 * Workaround v0.5: compone el summary con N queries `limit=1`
 * extrayendo `pagination.total` de cada una. Cuando el API exponga
 * `GET /trips/workbench-summary`, reemplazar por una sola query.
 */

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { tripQueryKeys, type TripWorkbenchSummary } from "@features/trips/domain";
import { tripRepository } from "@features/trips/infrastructure";

const STALE_TIME = 30_000;

function statusCountQuery(status: string) {
  const params = {
    page: 1,
    limit: 1,
    filters: { status: status as "draft" },
  };
  return {
    queryKey: tripQueryKeys.list(params),
    queryFn: () => tripRepository.findAll(params),
    staleTime: STALE_TIME,
  };
}

function fiscalAttentionCountQuery() {
  const params = {
    page: 1,
    limit: 1,
    filters: { requiresFiscalAttention: true as const },
  };
  return {
    queryKey: tripQueryKeys.list(params),
    queryFn: () => tripRepository.findAll(params),
    staleTime: STALE_TIME,
  };
}

function overdueCountQuery() {
  const params = {
    page: 1,
    limit: 1,
    filters: { overdueOnly: true as const },
  };
  return {
    queryKey: tripQueryKeys.list(params),
    queryFn: () => tripRepository.findAll(params),
    staleTime: STALE_TIME,
  };
}

const EMPTY_SUMMARY: TripWorkbenchSummary = {
  draft: 0,
  scheduled: 0,
  inProgress: 0,
  completed: 0,
  cancelled: 0,
  fiscalAttention: 0,
  overdue: 0,
};

export function useTripWorkbenchSummary() {
  const queries = useMemo(
    () => [
      statusCountQuery("draft"),
      statusCountQuery("scheduled"),
      statusCountQuery("in_progress"),
      statusCountQuery("completed"),
      statusCountQuery("cancelled"),
      fiscalAttentionCountQuery(),
      overdueCountQuery(),
    ],
    [],
  );

  const results = useQueries({ queries });

  const summary = useMemo<TripWorkbenchSummary>(() => {
    const [draft, scheduled, inProgress, completed, cancelled, fiscal, overdue] =
      results;

    return {
      draft: draft?.data?.pagination.total ?? 0,
      scheduled: scheduled?.data?.pagination.total ?? 0,
      inProgress: inProgress?.data?.pagination.total ?? 0,
      completed: completed?.data?.pagination.total ?? 0,
      cancelled: cancelled?.data?.pagination.total ?? 0,
      fiscalAttention: fiscal?.data?.pagination.total ?? 0,
      overdue: overdue?.data?.pagination.total ?? 0,
    };
  }, [results]);

  const isLoading = results.some((r) => r.isLoading);
  const isFetching = results.some((r) => r.isFetching);
  const hasError = results.some((r) => r.isError);

  return {
    summary,
    isLoading,
    isFetching,
    hasError,
    refetch: () => {
      results.forEach((r) => void r.refetch());
    },
  };
}
