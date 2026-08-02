import { History } from "lucide-react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import { mapBackendError } from "@shared/utils/errorMapper";
import { userQueryKeys } from "../../domain";
import { usersApi } from "../../infrastructure";
import { userActivityPageCopy } from "../copy/userActivityPageCopy";
import { UserActivityFeed } from "./UserActivityFeed";

const PAGE_SIZE = 20;

interface UserActivitySectionProps {
  userId: string;
}

export function UserActivitySection({ userId }: UserActivitySectionProps) {
  const copy = userActivityPageCopy.card;
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
    queryKey: [...userQueryKeys.activityRoot(userId), "infinite", PAGE_SIZE] as const,
    queryFn: ({ pageParam }) =>
      usersApi.getActivity(userId, { page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  const events = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;
  const errorMessage = isError ? mapBackendError(error).message : "";

  const header = (
    <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <History className="h-4 w-4" />
        {copy.title}
      </CardTitle>
      <Button asChild variant="link" size="sm" className="h-auto p-0">
        {/* `period=all` evita heredar el filtro de fecha por defecto de la página. */}
        <Link to={`/users/activity?subjectUserId=${userId}&period=all`}>
          {copy.fullHistory}
        </Link>
      </Button>
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card>
        {header}
        <CardContent className="text-muted-foreground text-sm">
          {copy.loading}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent className="space-y-4">
        {isError ? (
          <AlertWithIcon variant="destructive">
            {errorMessage || copy.error}
          </AlertWithIcon>
        ) : null}

        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">{copy.empty}</p>
        ) : (
          <UserActivityFeed
            events={events}
            includeSubject={false}
            linkPeople={false}
          />
        )}

        {total > 0 ? (
          <p className="text-muted-foreground text-xs">
            {copy.showing(events.length, total)}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? copy.loadingMore : copy.loadMore}
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
              {isFetching ? copy.refreshing : copy.refresh}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
