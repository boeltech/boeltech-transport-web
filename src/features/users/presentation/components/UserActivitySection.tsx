import { History } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import { DetailTimeline } from "@shared/ui/data-display";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import { userQueryKeys } from "../../domain";
import { usersApi } from "../../infrastructure";
import {
  formatUserActivityAction,
  summarizeUserActivityPayload,
} from "../helpers/userActivityCopy";

const PAGE_SIZE = 20;

interface UserActivitySectionProps {
  userId: string;
}

export function UserActivitySection({ userId }: UserActivitySectionProps) {
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Historial de gestión
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">Cargando…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Historial de gestión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <AlertWithIcon variant="destructive">
            {errorMessage || "No se pudo cargar el historial de actividad."}
          </AlertWithIcon>
        ) : null}
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aún no hay eventos registrados. Los cambios (alta, edición, estatus, contraseña,
            onboarding) aparecerán aquí.
          </p>
        ) : (
          <DetailTimeline
            items={events.map((ev) => {
              const actorName =
                [ev.actorFirstName, ev.actorLastName].filter(Boolean).join(" ").trim() ||
                ev.actorEmail ||
                "Sistema";
              const summary = summarizeUserActivityPayload(ev.action, ev.payload);
              return {
                id: ev.id,
                dotSize: "sm" as const,
                icon: <History className="h-4 w-4" />,
                content: (
                  <div className="bg-card/50 space-y-1 rounded-md border p-3 text-sm">
                    <div className="font-medium">{formatUserActivityAction(ev.action)}</div>
                    {summary ? (
                      <div className="text-muted-foreground">{summary}</div>
                    ) : null}
                    <div className="text-muted-foreground text-xs">
                      {formatDateTime(ev.createdAt)} · {actorName}
                    </div>
                  </div>
                ),
              };
            })}
          />
        )}
        {total > 0 ? (
          <p className="text-muted-foreground text-xs">
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
            {isFetchingNextPage ? "Cargando…" : "Cargar más"}
          </Button>
        ) : null}
        {isError || events.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" disabled={isFetching} onClick={() => void refetch()}>
            {isFetching ? "Actualizando…" : "Actualizar historial"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
