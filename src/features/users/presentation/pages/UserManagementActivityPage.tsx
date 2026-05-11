import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, RefreshCw } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { DetailTimeline } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { AlertWithIcon } from "@shared/ui/alert";
import { formatDateTime } from "@shared/utils/dateUtils";
import { mapBackendError } from "@shared/utils/errorMapper";
import { userQueryKeys } from "../../domain";
import { usersApi } from "../../infrastructure";
import {
  formatUserActivityAction,
  summarizeUserActivityPayload,
} from "../helpers/userActivityCopy";

const PAGE_SIZE = 25;

const ACTION_OPTIONS = [
  { value: "__all__", label: "Todas las acciones" },
  { value: "user_created", label: "Usuario creado" },
  { value: "user_updated", label: "Datos actualizados" },
  { value: "status_changed", label: "Estatus actualizado" },
  { value: "invitation_sent", label: "Invitación enviada" },
  { value: "invitation_resent", label: "Invitación reenviada" },
  { value: "invitation_cancelled", label: "Invitación cancelada" },
  { value: "password_changed_self", label: "Contraseña actualizada" },
  { value: "onboarding_completed_product", label: "Onboarding completado" },
] as const;

export function UserManagementActivityPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("__all__");

  const activeFilters = useMemo(
    () => ({
      ...(actionFilter !== "__all__" ? { action: actionFilter } : {}),
      includeUnassigned: true,
    }),
    [actionFilter],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: userQueryKeys.managementActivity(page, PAGE_SIZE, activeFilters),
    queryFn: () =>
      usersApi.getManagementActivity({
        page,
        limit: PAGE_SIZE,
        filters: activeFilters,
      }),
    staleTime: 30_000,
  });

  const events = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;
  const errorMessage = isError ? mapBackendError(error).message : "";

  return (
    <ListPageShell
      title="Auditoría de usuarios"
      description="Actividad global de gestión (tenant)"
      toolbar={{
        filters: (
          <Select
            value={actionFilter}
            onValueChange={(value) => {
              setActionFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
        extraActions: (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
        ),
      }}
      isLoading={isLoading}
      items={events}
      entityLabelPlural="eventos"
      pagination={
        pagination
          ? {
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              limit: pagination.limit,
            }
          : undefined
      }
      onPageChange={setPage}
      emptyState={{
        icon: <History className="h-10 w-10 text-muted-foreground" />,
        title: "Sin eventos para el filtro actual",
        description: "Ajusta filtros o actualiza para recargar la auditoría.",
      }}
      renderTable={() => (
        <div className="space-y-4">
          {isError ? (
            <AlertWithIcon variant="destructive">
              {errorMessage || "No se pudo cargar la auditoría global."}
            </AlertWithIcon>
          ) : null}

          {events.length > 0 ? (
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
                    <div className="space-y-1 rounded-md border bg-card/50 p-3 text-sm">
                      <div className="font-medium">{formatUserActivityAction(ev.action)}</div>
                      {summary ? (
                        <div className="text-muted-foreground">{summary}</div>
                      ) : null}
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(ev.createdAt)} · {actorName}
                        {ev.subjectUserId ? ` · Usuario: ${ev.subjectUserId.slice(0, 8)}…` : ""}
                      </div>
                    </div>
                  ),
                };
              })}
            />
          ) : null}

          {!isLoading && !isError && total > 0 ? (
            <p className="text-xs text-muted-foreground">
              Página {page} de {totalPages} · {total} evento{total === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      )}
    />
  );
}
