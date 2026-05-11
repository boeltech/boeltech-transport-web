import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Filter, Mail, Plus, Search, UserCog, X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { ROLE_OPTIONS, ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { Button } from "@shared/ui/button";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import type { ActiveFilterChip } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { formatDate } from "@shared/utils/dateUtils";
import {
  UserStatus,
  USER_STATUS_LABELS,
  type UserSortOptions,
  type UserStatusType,
} from "../../domain";
import { useUpdateUserStatus, useUsers } from "../../application";
import {
  InviteUserDialog,
  PendingInvitationsPanel,
  UserCard,
  UserCardSkeleton,
  UserTable,
  invitationsPendingQueryKey,
  type UserSortableColumn,
} from "../components";

type DateDraftState = {
  createdFrom: string;
  createdTo: string;
  lastLoginFrom: string;
  lastLoginTo: string;
};

const EMPTY_DATE_DRAFT: DateDraftState = {
  createdFrom: "",
  createdTo: "",
  lastLoginFrom: "",
  lastLoginTo: "",
};

export function UsersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const filters = useListingFilters<
    "status" | "role" | "createdFrom" | "createdTo" | "lastLoginFrom" | "lastLoginTo"
  >({
    filters: {
      status: {},
      role: {},
      createdFrom: { paramName: "created_from" },
      createdTo: { paramName: "created_to" },
      lastLoginFrom: { paramName: "last_login_from" },
      lastLoginTo: { paramName: "last_login_to" },
    },
    chipLabels: {
      status: (value) =>
        `Estado: ${USER_STATUS_LABELS[value as UserStatusType] ?? value}`,
      role: (value) => `Rol: ${ROLE_LABELS[value as UserRole] ?? value}`,
    },
  });

  const statusFilter = filters.filters.status as UserStatusType | "";
  const roleFilter = filters.filters.role as UserRole | "";
  const createdFrom = filters.filters.createdFrom;
  const createdTo = filters.filters.createdTo;
  const lastLoginFrom = filters.filters.lastLoginFrom;
  const lastLoginTo = filters.filters.lastLoginTo;
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [dateDraft, setDateDraft] = useState<DateDraftState>(EMPTY_DATE_DRAFT);

  const syncDateDraftFromUrl = useCallback(() => {
    setDateDraft({
      createdFrom,
      createdTo,
      lastLoginFrom,
      lastLoginTo,
    });
  }, [createdFrom, createdTo, lastLoginFrom, lastLoginTo]);

  const handleDatePopoverOpenChange = useCallback(
    (open: boolean) => {
      setIsDateFilterOpen(open);
      if (open) {
        syncDateDraftFromUrl();
      }
    },
    [syncDateDraftFromUrl],
  );

  const dateDraftMatchesApplied = useMemo(
    () =>
      dateDraft.createdFrom === createdFrom &&
      dateDraft.createdTo === createdTo &&
      dateDraft.lastLoginFrom === lastLoginFrom &&
      dateDraft.lastLoginTo === lastLoginTo,
    [dateDraft, createdFrom, createdTo, lastLoginFrom, lastLoginTo],
  );

  const handleApplyDateFilters = useCallback(() => {
    filters.setFilters({
      createdFrom: dateDraft.createdFrom,
      createdTo: dateDraft.createdTo,
      lastLoginFrom: dateDraft.lastLoginFrom,
      lastLoginTo: dateDraft.lastLoginTo,
    });
    setIsDateFilterOpen(false);
  }, [filters, dateDraft]);

  const handleCancelDatePopover = useCallback(() => {
    setIsDateFilterOpen(false);
  }, []);

  const [sort, setSort] = useState<UserSortOptions>({
    field: "created_at",
    direction: "desc",
  });

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const handleSortChange = useCallback(
    (field: UserSortableColumn) => {
      setSort((prev) => {
        if (prev.field === field) {
          return { field, direction: prev.direction === "asc" ? "desc" : "asc" };
        }
        return { field, direction: "asc" };
      });
      filters.setPage(1);
    },
    [filters],
  );

  const { data, isLoading, isFetching, refetch } = useUsers({
    page: filters.page,
    limit: 10,
    filters: {
      status: statusFilter || undefined,
      role: roleFilter || undefined,
      search: filters.search || undefined,
      createdFrom: createdFrom || undefined,
      createdTo: createdTo || undefined,
      lastLoginFrom: lastLoginFrom || undefined,
      lastLoginTo: lastLoginTo || undefined,
    },
    sort,
  });

  const updateStatusMutation = useUpdateUserStatus({
    onSuccess: () => {
      toast({
        title: "Usuario actualizado",
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const users = data?.data ?? [];
  const canCreate = hasPermission("users", "create");
  const canUpdateStatus = hasPermission("users", "delete");

  const handleCreate = useCallback(() => navigate("/users/new"), [navigate]);

  const handleView = useCallback(
    (id: string) => {
      navigate(`/users/${id}`);
    },
    [navigate],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({
      title: "Lista actualizada",
      variant: "success",
    });
  }, [refetch, toast]);

  const handleStatusChange = useCallback(
    (id: string, status: UserStatusType) => {
      if (!canUpdateStatus) return;
      updateStatusMutation.mutate({
        id,
        data: { status },
      });
    },
    [canUpdateStatus, updateStatusMutation],
  );

  const hasCreatedDateFilter = Boolean(createdFrom || createdTo);
  const hasLastLoginDateFilter = Boolean(lastLoginFrom || lastLoginTo);
  const hasDateFilter = hasCreatedDateFilter || hasLastLoginDateFilter;

  const formatRange = useCallback((from: string, to: string) => {
    if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
    if (from) return `Desde ${formatDate(from)}`;
    if (to) return `Hasta ${formatDate(to)}`;
    return "Sin filtro";
  }, []);

  const dateFilterText = hasDateFilter
    ? [
        hasCreatedDateFilter
          ? `Alta: ${formatRange(createdFrom, createdTo)}`
          : null,
        hasLastLoginDateFilter
          ? `Acceso: ${formatRange(lastLoginFrom, lastLoginTo)}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Filtrar por fecha";

  const handleClearDateFilter = useCallback(() => {
    filters.setFilters({
      createdFrom: "",
      createdTo: "",
      lastLoginFrom: "",
      lastLoginTo: "",
    });
    setDateDraft({ ...EMPTY_DATE_DRAFT });
    setIsDateFilterOpen(false);
  }, [filters]);

  const activeFilterChips: ActiveFilterChip[] = [
    ...filters.activeChips,
    ...(hasDateFilter
      ? [
          {
            id: "date",
            label: `Fechas: ${dateFilterText}`,
            onRemove: handleClearDateFilter,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
    <PendingInvitationsPanel />
    <ListPageShell
      title="Usuarios"
      description="Administración de usuarios del tenant"
      primaryAction={{
        label: "Nuevo usuario",
        icon: <Plus className="h-4 w-4" />,
        onClick: handleCreate,
        visible: canCreate,
      }}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: "Buscar usuario...",
        },
        filters: (
          <>
            {canCreate ? (
              <Button
                type="button"
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={() => setInviteDialogOpen(true)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Invitar
              </Button>
            ) : null}
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => filters.setFilter("status", value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value={UserStatus.ACTIVE}>
                  {USER_STATUS_LABELS[UserStatus.ACTIVE]}
                </SelectItem>
                <SelectItem value={UserStatus.INACTIVE}>
                  {USER_STATUS_LABELS[UserStatus.INACTIVE]}
                </SelectItem>
                <SelectItem value={UserStatus.SUSPENDED}>
                  {USER_STATUS_LABELS[UserStatus.SUSPENDED]}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={roleFilter || "all"}
              onValueChange={(value) => filters.setFilter("role", value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {ROLE_OPTIONS.map((roleOption) => (
                  <SelectItem key={roleOption.value} value={roleOption.value}>
                    {roleOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={isDateFilterOpen} onOpenChange={handleDatePopoverOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant={hasDateFilter ? "secondary" : "outline"}
                  className={cn(
                    "w-auto justify-start text-left font-normal",
                    hasDateFilter && "pr-2",
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span className="max-w-[260px] truncate">{dateFilterText}</span>
                  {hasDateFilter ? (
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-2 rounded p-1 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearDateFilter();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          handleClearDateFilter();
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[24rem] p-4" align="start">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Filter className="h-4 w-4" />
                    Filtros por fecha
                  </div>

                  <div className="space-y-2 border-b pb-3">
                    <p className="text-xs font-medium text-muted-foreground">Fecha de alta</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="users-created-from">Desde</Label>
                        <Input
                          id="users-created-from"
                          type="date"
                          value={dateDraft.createdFrom}
                          max={dateDraft.createdTo || undefined}
                          onChange={(e) =>
                            setDateDraft((d) => ({ ...d, createdFrom: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="users-created-to">Hasta</Label>
                        <Input
                          id="users-created-to"
                          type="date"
                          value={dateDraft.createdTo}
                          min={dateDraft.createdFrom || undefined}
                          onChange={(e) =>
                            setDateDraft((d) => ({ ...d, createdTo: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Último acceso
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="users-login-from">Desde</Label>
                        <Input
                          id="users-login-from"
                          type="date"
                          value={dateDraft.lastLoginFrom}
                          max={dateDraft.lastLoginTo || undefined}
                          onChange={(e) =>
                            setDateDraft((d) => ({ ...d, lastLoginFrom: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="users-login-to">Hasta</Label>
                        <Input
                          id="users-login-to"
                          type="date"
                          value={dateDraft.lastLoginTo}
                          min={dateDraft.lastLoginFrom || undefined}
                          onChange={(e) =>
                            setDateDraft((d) => ({ ...d, lastLoginTo: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                    {hasDateFilter ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="justify-start text-muted-foreground sm:order-1"
                        onClick={handleClearDateFilter}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Limpiar fechas
                      </Button>
                    ) : (
                      <span className="hidden sm:block sm:order-1" />
                    )}
                    <div className="flex w-full gap-2 sm:order-2 sm:w-auto sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={handleCancelDatePopover}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        disabled={dateDraftMatchesApplied}
                        onClick={handleApplyDateFilters}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        ),
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: activeFilterChips,
        onClearFilters: filters.clearAll,
        hasFilters: filters.hasFilters || hasDateFilter,
        viewMode: filters.viewModeProps,
      }}
      isLoading={isLoading}
      items={users}
      pagination={
        data?.pagination
          ? {
              page: filters.page,
              totalPages: data.pagination.totalPages,
              total: data.pagination.total,
              limit: data.pagination.limit,
            }
          : undefined
      }
      onPageChange={filters.setPage}
      entityLabelPlural="usuarios"
      renderTable={() => (
        <UserTable
          users={users}
          isLoading={isLoading}
          onView={handleView}
          onStatusChange={canUpdateStatus ? handleStatusChange : undefined}
          sortField={sort.field}
          sortDirection={sort.direction}
          onSortChange={handleSortChange}
        />
      )}
      renderCards={() =>
        users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onView={handleView}
            onStatusChange={canUpdateStatus ? handleStatusChange : undefined}
          />
        ))
      }
      renderCardSkeleton={() => <UserCardSkeleton />}
      emptyState={{
        icon: <Search className="h-10 w-10 text-muted-foreground" />,
        title: "No se encontraron usuarios",
        description: filters.hasFilters || hasDateFilter
          ? "Intenta ajustar los filtros de búsqueda."
          : "Comienza registrando el primer usuario de tu equipo.",
        cta: canCreate
          ? {
              label: "Nuevo usuario",
              icon: <UserCog className="h-4 w-4" />,
              onClick: handleCreate,
            }
          : undefined,
        secondaryCta: filters.hasFilters || hasDateFilter
          ? {
              label: "Limpiar filtros",
              onClick: filters.clearAll,
              variant: "outline",
            }
          : undefined,
      }}
    />
    <InviteUserDialog
      open={inviteDialogOpen}
      onOpenChange={setInviteDialogOpen}
      onInvited={() => {
        void refetch();
        void queryClient.invalidateQueries({
          queryKey: invitationsPendingQueryKey,
        });
      }}
    />
    </div>
  );
}
