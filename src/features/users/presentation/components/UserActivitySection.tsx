import { History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { DetailTimeline } from "@shared/ui/data-display";
import { formatDateTime } from "@shared/utils/dateUtils";
import { userQueryKeys } from "../../domain";
import { usersApi } from "../../infrastructure";
import {
  formatUserActivityAction,
  summarizeUserActivityPayload,
} from "../helpers/userActivityCopy";

const ACTIVITY_PAGE_SIZE = 40;

interface UserActivitySectionProps {
  userId: string;
}

export function UserActivitySection({ userId }: UserActivitySectionProps) {
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: userQueryKeys.activity(userId, 1, ACTIVITY_PAGE_SIZE),
    queryFn: () => usersApi.getActivity(userId, { page: 1, limit: ACTIVITY_PAGE_SIZE }),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const events = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Historial de gestión
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Cargando…</CardContent>
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
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay eventos registrados. Los cambios futuros (alta, edición, estatus)
            aparecerán aquí.
          </p>
        ) : (
          <DetailTimeline
            dotSize="sm"
            items={events.map((ev) => {
              const actorName =
                [ev.actorFirstName, ev.actorLastName].filter(Boolean).join(" ").trim() ||
                ev.actorEmail ||
                "Sistema";
              const summary = summarizeUserActivityPayload(ev.action, ev.payload);
              return {
                id: ev.id,
                icon: <History className="h-4 w-4" />,
                content: (
                  <div className="space-y-1 rounded-md border bg-card/50 p-3 text-sm">
                    <div className="font-medium">{formatUserActivityAction(ev.action)}</div>
                    {summary ? (
                      <div className="text-muted-foreground">{summary}</div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(ev.createdAt)} · {actorName}
                    </div>
                  </div>
                ),
              };
            })}
          />
        )}
        {total > events.length ? (
          <p className="text-xs text-muted-foreground">
            Mostrando los {events.length} más recientes de {total} eventos.
          </p>
        ) : null}
        {events.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" disabled={isFetching} onClick={() => void refetch()}>
            Actualizar historial
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
