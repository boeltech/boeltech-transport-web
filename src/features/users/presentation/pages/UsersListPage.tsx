import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Filter, Search, SlidersHorizontal, UserPlus, X } from "lucide-react";
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
import { Label } from "@shared/ui/label";
import { DateField, preventCloseIfDateCalendar } from "@shared/ui/form";
import { formatDate } from "@shared/utils/dateUtils";
import {
  UserStatus,
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
  UserPlanLimitNotice,
  UserTable,
  invitationsPendingQueryKey,
  type UserSortableColumn,
} from "../components";
import { usersCopy } from "../copy/usersCopy";
import { capacityFromUserListMeta } from "../helpers/userPlanCapacity";

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
  const copy = usersCopy.list;

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
        copy.filters.chipStatus(
          USER_STATUS_LABELS[value as UserStatusType] ?? value,
        ),
      role: (value) =>
        copy.filters.chipRole(ROLE_LABELS[value as UserRole] ?? value),
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
      navigate(`/users/${id}`);
    },
    [navigate],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({
      title: copy.refreshSuccess,
      variant: "success",
    });
  }, [refetch, toast, copy.refreshSuccess]);

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

  const formatRange = useCallback(
    (from: string, to: string) => {
      if (from && to) {
        return copy.filters.rangeBoth(formatDate(from), formatDate(to));
      }
      if (from) return copy.filters.rangeFrom(formatDate(from));
      if (to) return copy.filters.rangeTo(formatDate(to));
      return "";
    },
    [copy.filters],
  );

  const dateFilterText = hasDateFilter
    ? [
        hasCreatedDateFilter
          ? copy.filters.createdPrefix(formatRange(createdFrom, createdTo))
          : null,
        hasLastLoginDateFilter
          ? copy.filters.accessPrefix(formatRange(lastLoginFrom, lastLoginTo))
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : copy.filters.dateButton;

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
            label: copy.filters.chipDates(dateFilterText),
            onRemove: handleClearDateFilter,
          },
        ]
      : []),
  ];

  return (
    <>
      <ListPageShell
        title={copy.title}
        description={copy.description}
        primaryAction={{
          label: copy.primaryAction,
          icon: <UserPlus className="h-4 w-4" />,
          onClick: () => setAddUserSheetOpen(true),
          visible: canCreate,
          disabled: userLimitReached,
          disabledTitle:
            userLimitReached
              ? usersCopy.limitReached.inviteDisabled
              : undefined,
        }}
        beforeToolbar={
          <div className="space-y-4">
            <UserCapacityBanner capacity={capacity} />
            <UserPlanLimitNotice capacity={capacity} />
            <PendingInvitationsPanel />
          </div>
        }
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
          },
          filters: (
            <>
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) => filters.setFilter("status", value)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={copy.filters.statusPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.statusAll}</SelectItem>
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
                  <SelectValue placeholder={copy.filters.rolePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.roleAll}</SelectItem>
                  {ROLE_OPTIONS.map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover
                open={isDateFilterOpen}
                onOpenChange={handleDatePopoverOpenChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={hasDateFilter ? "secondary" : "outline"}
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {copy.filters.more}
                    {hasDateFilter ? (
                      <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                        ·
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[24rem] p-4"
                  align="start"
                  onPointerDownOutside={preventCloseIfDateCalendar}
                  onFocusOutside={preventCloseIfDateCalendar}
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Filter className="h-4 w-4" />
                      {copy.filters.moreHeading}
                    </div>

                    <div className="space-y-2 border-b pb-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        {copy.filters.createdHeading}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="users-created-from">
                            {copy.filters.from}
                          </Label>
                          <DateField
                            id="users-created-from"
                            value={dateDraft.createdFrom}
                            max={dateDraft.createdTo || undefined}
                            onChange={(createdFrom) =>
                              setDateDraft((d) => ({
                                ...d,
                                createdFrom,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="users-created-to">
                            {copy.filters.to}
                          </Label>
                          <DateField
                            id="users-created-to"
                            value={dateDraft.createdTo}
                            min={dateDraft.createdFrom || undefined}
                            onChange={(createdTo) =>
                              setDateDraft((d) => ({
                                ...d,
                                createdTo,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {copy.filters.lastLoginHeading}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="users-login-from">
                            {copy.filters.from}
                          </Label>
                          <DateField
                            id="users-login-from"
                            value={dateDraft.lastLoginFrom}
                            max={dateDraft.lastLoginTo || undefined}
                            onChange={(lastLoginFrom) =>
                              setDateDraft((d) => ({
                                ...d,
                                lastLoginFrom,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="users-login-to">
                            {copy.filters.to}
                          </Label>
                          <DateField
                            id="users-login-to"
                            value={dateDraft.lastLoginTo}
                            min={dateDraft.lastLoginFrom || undefined}
                            onChange={(lastLoginTo) =>
                              setDateDraft((d) => ({
                                ...d,
                                lastLoginTo,
                              }))
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
                          {copy.filters.clearDates}
                        </Button>
                      ) : (
                        <span className="hidden sm:order-1 sm:block" />
                      )}
                      <div className="flex w-full gap-2 sm:order-2 sm:w-auto sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={handleCancelDatePopover}
                        >
                          {copy.filters.cancel}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          disabled={dateDraftMatchesApplied}
                          onClick={handleApplyDateFilters}
                        >
                          {copy.filters.apply}
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
          title:
            filters.hasFilters || hasDateFilter
              ? copy.empty.filteredTitle
              : copy.empty.title,
          description:
            filters.hasFilters || hasDateFilter
              ? copy.empty.filteredDescription
              : copy.empty.description,
          cta: canCreate
            ? {
                label: userLimitReached
                  ? usersCopy.limitReached.inviteDisabled
                  : copy.primaryAction,
                icon: <UserPlus className="h-4 w-4" />,
                onClick: userLimitReached
                  ? () => undefined
                  : () => setAddUserSheetOpen(true),
              }
            : undefined,
          secondaryCta:
            filters.hasFilters || hasDateFilter
              ? {
                  label: copy.empty.clearFilters,
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
