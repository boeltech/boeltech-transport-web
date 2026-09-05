import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { usePermissions } from "@shared/permissions";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import { OPEN_ADVANCE_STATUSES } from "../../presentation/config/settlementWorkbenchConfig";
import type { SettlementWorkbenchSummary } from "../../domain/entities";
import { useSettlementWorkbench } from "./useSettlementWorkbench";
import type { ListWorkbenchParams } from "../../infrastructure/settlementsApi";

export type SettlementWorkbenchBucket =
  | "pending"
  | "draft"
  | "approval"
  | "payable"
  | "closed";

function settlementCountQuery(status: string) {
  return {
    queryKey: settlementsQueryKeys.settlementsList({
      status,
      page: 1,
      pageSize: 1,
    }),
    queryFn: () =>
      settlementsApi.listSettlements({
        status,
        page: 1,
        pageSize: 1,
      }),
    staleTime: 30_000,
  };
}

function advanceCountQuery(status: string) {
  return {
    queryKey: settlementsQueryKeys.advancesList({
      status,
      page: 1,
      pageSize: 1,
    }),
    queryFn: () =>
      settlementsApi.listAdvances({
        status,
        page: 1,
        pageSize: 1,
      }),
    staleTime: 30_000,
  };
}

export function useSettlementWorkbenchCounts(
  workbenchParams: ListWorkbenchParams = {},
) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("settlements", "read");

  const workbenchQuery = useSettlementWorkbench(workbenchParams);

  const countQueries = useMemo(
    () =>
      canRead
        ? [
            settlementCountQuery("draft"),
            settlementCountQuery("rejected"),
            settlementCountQuery("pending_approval"),
            settlementCountQuery("approved"),
            settlementCountQuery("disbursed"),
            ...OPEN_ADVANCE_STATUSES.map((status) => advanceCountQuery(status)),
          ]
        : [],
    [canRead],
  );

  const pipelineQueries = useQueries({ queries: countQueries });

  const draftQuery = pipelineQueries[0];
  const rejectedQuery = pipelineQueries[1];
  const approvalQuery = pipelineQueries[2];
  const payableQuery = pipelineQueries[3];
  const closedQuery = pipelineQueries[4];
  const advanceQueries = pipelineQueries.slice(5);

  const summary = useMemo<SettlementWorkbenchSummary>(() => {
    const draft =
      (draftQuery?.data?.pagination.total ?? 0) +
      (rejectedQuery?.data?.pagination.total ?? 0);
    const approval = approvalQuery?.data?.pagination.total ?? 0;
    const payable = payableQuery?.data?.pagination.total ?? 0;
    const closed = closedQuery?.data?.pagination.total ?? 0;
    const openAdvances = advanceQueries.reduce(
      (acc, query) => acc + (query.data?.pagination.total ?? 0),
      0,
    );

    const workbenchSummary = workbenchQuery.data?.summary;
    const pending =
      workbenchSummary?.pending ??
      workbenchQuery.data?.backlog.length ??
      0;

    if (workbenchSummary) {
      return {
        ...workbenchSummary,
        draft: workbenchSummary.draft || draft,
        approval: workbenchSummary.approval || approval,
        payable: workbenchSummary.payable || payable,
        closed: workbenchSummary.closed || closed,
        openAdvances: workbenchSummary.openAdvances || openAdvances,
      };
    }

    return {
      pending,
      draft,
      approval,
      payable,
      closed,
      openAdvances,
    };
  }, [
    advanceQueries,
    approvalQuery?.data?.pagination.total,
    closedQuery?.data?.pagination.total,
    draftQuery?.data?.pagination.total,
    payableQuery?.data?.pagination.total,
    rejectedQuery?.data?.pagination.total,
    workbenchQuery.data?.backlog.length,
    workbenchQuery.data?.summary,
  ]);

  const isLoading =
    workbenchQuery.isLoading ||
    pipelineQueries.some((query) => query.isLoading);

  const isFetching =
    workbenchQuery.isFetching ||
    pipelineQueries.some((query) => query.isFetching);

  return {
    summary,
    isLoading,
    isFetching,
    workbenchError: workbenchQuery.error,
    isWorkbenchAvailable: !workbenchQuery.error,
    refetch: () => {
      void workbenchQuery.refetch();
      pipelineQueries.forEach((query) => {
        void query.refetch();
      });
    },
  };
}
