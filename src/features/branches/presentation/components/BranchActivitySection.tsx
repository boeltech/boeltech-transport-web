import { History } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import { DetailTimeline } from "@shared/ui/data-display";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import { branchQueryKeys } from "../../domain";
import { branchesApi } from "../../infrastructure";
import { branchesCopy } from "../copy/branchesCopy";
import {
  formatBranchActivityAction,
  summarizeBranchActivityPayload,
} from "../helpers/branchActivityCopy";

const PAGE_SIZE = 20;
const copy = branchesCopy.detail.activity;

interface BranchActivitySectionProps {
  readonly branchId: string;
}

export function BranchActivitySection({ branchId }: BranchActivitySectionProps) {
  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: [...branchQueryKeys.activityRoot(branchId), "infinite", PAGE_SIZE] as const,
    queryFn: ({ pageParam }) =>
      branchesApi.getActivity(branchId, {
        page: pageParam as number,
        limit: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!branchId,
    staleTime: 30_000,
  });

  const events = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;
  const errorMessage = isError ? mapBackendError(error).message : "";

  if (isLoading) {
    return (
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            {copy.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Cargando…</CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <AlertWithIcon variant="destructive">
            {errorMessage || copy.error}
          </AlertWithIcon>
        ) : null}

        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <DetailTimeline
            items={events.map((event) => {
              const actorName =
                [event.actorFirstName, event.actorLastName].filter(Boolean).join(" ").trim() ||
                event.actorEmail ||
                "Sistema";
              const summary = summarizeBranchActivityPayload(event.action, event.payload);
              const isSynthetic = event.payload.synthetic === true;

              return {
                id: event.id,
                dotSize: "sm" as const,
                icon: <History className="h-4 w-4" />,
                content: (
                  <div className="space-y-1 rounded-md border bg-card/50 p-3 text-sm">
                    <div className="font-medium">
                      {formatBranchActivityAction(event.action)}
                    </div>
                    {summary ? (
                      <div className="text-muted-foreground">{summary}</div>
                    ) : null}
                    {isSynthetic ? (
                      <div className="text-xs text-muted-foreground">{copy.syntheticHint}</div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(event.createdAt)} · {actorName}
                    </div>
                  </div>
                ),
              };
            })}
          />
        )}

        {total > 0 ? (
          <p className="text-xs text-muted-foreground">
            {events.length === total
              ? `${total} evento${total === 1 ? "" : "s"}.`
              : `Mostrando ${events.length} de ${total} eventos.`}
          </p>
        ) : null}

        {hasNextPage ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? "Cargando…" : copy.loadMore}
          </Button>
        ) : null}

        {isError || events.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {isFetching ? "Actualizando…" : copy.refresh}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
