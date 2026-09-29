/**
 * UsersListPage — padrón de usuarios (`ListPageShell`).
 *
 * Dictamen toolbar: search = lookup; estado / rol / alta / último acceso
 * en «Filtros (n)». Cupo e invitaciones se quedan encima del riel.
 */
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useListQueueFromState } from "@shared/utils/listQueueFrom";
import { useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import type { ActiveFilterChip } from "@shared/ui/listing";
import { formatDate } from "@shared/utils/dateUtils";
import {
  USER_STATUS_LABELS,
  type UserSortOptions,
  type UserStatusType,
} from "../../domain";
import { useUpdateUserStatus, useUsers } from "../../application";
import {
  AddUserSheet,
  PendingInvitationsPanel,
  UserCapacityBanner,
  UserCard,
  UserCardSkeleton,
  UserListFilters,
  UserPlanLimitNotice,
  UserTable,
  invitationsPendingQueryKey,
  type UserSortableColumn,
} from "../components";
import { AdminUsersOrientationAlert } from "../components/AdminUsersOrientationAlert";
import { usersCopy } from "../copy/usersCopy";
import { capacityFromUserListMeta } from "../helpers/userPlanCapacity";
import { countUserPanelFilters } from "../utils/userListFilters";

const copy = usersCopy.list;

export function UsersListPage() {
  const navigate = useNavigate();
  const fromState = useListQueueFromState();
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
        copy.chip.status(USER_STATUS_LABELS[value as UserStatusType] ?? value),
      role: (value) =>
        copy.chip.role(ROLE_LABELS[value as UserRole] ?? value),
    },
  });

  const statusFilter = filters.filters.status as UserStatusType | "";
  const roleFilter = filters.filters.role as UserRole | "";
  const createdFrom = filters.filters.createdFrom;
  const createdTo = filters.filters.createdTo;
  const lastLoginFrom = filters.filters.lastLoginFrom;
  const lastLoginTo = filters.filters.lastLoginTo;
  const activePanelFilterCount = countUserPanelFilters({
    status: statusFilter,
    role: roleFilter,
    createdFrom,
    createdTo,
    lastLoginFrom,
    lastLoginTo,
  });
  const hasPanelFilters = activePanelFilterCount > 0;
  const hasCreatedDateFilter = Boolean(createdFrom || createdTo);
  const hasLastLoginDateFilter = Boolean(lastLoginFrom || lastLoginTo);

  const [sort, setSort] = useState<UserSortOptions>({
    field: "created_at",
    direction: "desc",
  });
  const [addUserSheetOpen, setAddUserSheetOpen] = useState(false);

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

  const canCreate = hasPermission("users", "create");
  const capacity = capacityFromUserListMeta(data?.meta);
  const userLimitReached = !capacity.canAdd;

  const updateStatusMutation = useUpdateUserStatus({
    onSuccess: () => {
      toast({
        title: usersCopy.status.updateSuccess,
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        title: usersCopy.status.updateError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const users = data?.data ?? [];
  const canUpdateStatus = hasPermission("users", "delete");

  const handleView = useCallback(
    (id: string) => {
      navigate(`/users/${id}`, { state: fromState });
    },
    [fromState, navigate],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({
      title: copy.refreshSuccess,
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

  const formatRange = useCallback((from: string, to: string) => {
    if (from && to) {
      return copy.filters.rangeBoth(formatDate(from), formatDate(to));
    }
    if (from) return copy.filters.rangeFrom(formatDate(from));
    if (to) return copy.filters.rangeTo(formatDate(to));
    return "";
  }, []);

  const handleClearCreatedFilter = useCallback(() => {
    filters.setFilters({
      createdFrom: "",
      createdTo: "",
    });
  }, [filters]);

  const handleClearLastLoginFilter = useCallback(() => {
    filters.setFilters({
      lastLoginFrom: "",
      lastLoginTo: "",
    });
  }, [filters]);

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    const chips = [...filters.activeChips];
    if (hasCreatedDateFilter) {
      chips.push({
        id: "created",
        label: copy.chip.created(formatRange(createdFrom, createdTo)),
        onRemove: handleClearCreatedFilter,
      });
    }
    if (hasLastLoginDateFilter) {
      chips.push({
        id: "last-login",
        label: copy.chip.lastLogin(formatRange(lastLoginFrom, lastLoginTo)),
        onRemove: handleClearLastLoginFilter,
      });
    }
    return chips;
  }, [
    createdFrom,
    createdTo,
    filters.activeChips,
    formatRange,
    handleClearCreatedFilter,
    handleClearLastLoginFilter,
    hasCreatedDateFilter,
    hasLastLoginDateFilter,
    lastLoginFrom,
    lastLoginTo,
  ]);

  return (
    <>
      <ListPageShell
        title={copy.title}
        description={copy.description}
        primaryAction={{
          label: copy.actions.create,
          icon: <UserPlus className="h-4 w-4" />,
          onClick: () => setAddUserSheetOpen(true),
          visible: canCreate,
          disabled: userLimitReached,
          disabledTitle: userLimitReached
            ? usersCopy.limitReached.inviteDisabled
            : undefined,
        }}
        beforeToolbar={
          <div className="space-y-4">
            <AdminUsersOrientationAlert />
            <UserCapacityBanner capacity={capacity} />
            <UserPlanLimitNotice capacity={capacity} />
            <PendingInvitationsPanel />
          </div>
        }
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.filter.searchPlaceholder,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          filters: (
            <UserListFilters
              key={hasPanelFilters ? "filters-active" : "filters-idle"}
              status={statusFilter}
              role={roleFilter}
              createdFrom={createdFrom}
              createdTo={createdTo}
              lastLoginFrom={lastLoginFrom}
              lastLoginTo={lastLoginTo}
              activePanelFilterCount={activePanelFilterCount}
              onStatusChange={(value) => filters.setFilter("status", value)}
              onRoleChange={(value) => filters.setFilter("role", value)}
              onCreatedFromChange={(value) =>
                filters.setFilter("createdFrom", value)
              }
              onCreatedToChange={(value) =>
                filters.setFilter("createdTo", value)
              }
              onLastLoginFromChange={(value) =>
                filters.setFilter("lastLoginFrom", value)
              }
              onLastLoginToChange={(value) =>
                filters.setFilter("lastLoginTo", value)
              }
            />
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
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
        entityLabelPlural={copy.entityLabelPlural}
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
          title: copy.empty.title,
          description: filters.hasFilters
            ? copy.empty.descriptionFiltered
            : copy.empty.descriptionClear,
          cta: canCreate
            ? {
                label: userLimitReached
                  ? usersCopy.limitReached.inviteDisabled
                  : copy.actions.create,
                icon: <UserPlus className="h-4 w-4" />,
                onClick: userLimitReached
                  ? () => undefined
                  : () => setAddUserSheetOpen(true),
              }
            : undefined,
          secondaryCta: filters.hasFilters
            ? {
                label: copy.actions.clearFilters,
                onClick: filters.clearAll,
                variant: "outline",
              }
            : undefined,
        }}
      />
      <AddUserSheet
        open={addUserSheetOpen}
        onOpenChange={setAddUserSheetOpen}
        onCompleted={() => {
          void refetch();
          void queryClient.invalidateQueries({
            queryKey: invitationsPendingQueryKey,
          });
        }}
      />
    </>
  );
}
