import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { History, SlidersHorizontal } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  formatListingDateRangeLabel,
  ListingDateRangeFilter,
  LISTING_DATE_RANGE_QUICK_PRESETS,
  type ActiveFilterChip,
} from "@shared/ui/listing";
import { mapBackendError } from "@shared/utils/errorMapper";
import { useUserDirectory, useUserManagementActivity } from "../../application";
import type { UserManagementActivityFilters } from "../../domain";
import { UserActivityFeed, UserActivityFeedSkeleton } from "../components";
import {
  findUserActivityActionLabel,
  USER_ACTIVITY_ACTION_GROUPS,
  userActivityPageCopy,
} from "../copy/userActivityPageCopy";

const PAGE_SIZE = 25;
const ALL_OPTION = "__all__";
/** Marca «todo el historial»: distingue quitar el periodo de no haberlo tocado nunca. */
const PERIOD_ALL = "all";

export function UserManagementActivityPage() {
  const copy = userActivityPageCopy;
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const action = searchParams.get("action") ?? "";
  const subjectUserId = searchParams.get("subjectUserId") ?? "";
  const actorUserId = searchParams.get("actorUserId") ?? "";
  const createdFromParam = searchParams.get("createdFrom") ?? "";
  const createdToParam = searchParams.get("createdTo") ?? "";
  const hasExplicitPeriod =
    searchParams.get("period") === PERIOD_ALL ||
    !!createdFromParam ||
    !!createdToParam;

  // Por defecto solo se consulta el último mes: la bitácora crece sin límite.
  const defaultRange = useMemo(
    () => LISTING_DATE_RANGE_QUICK_PRESETS.lastMonth(),
    [],
  );
  const range = hasExplicitPeriod
    ? { fromDate: createdFromParam, toDate: createdToParam }
    : defaultRange;

  const { entries: directory, namesById } = useUserDirectory();

  const filters = useMemo<UserManagementActivityFilters>(
    () => ({
      ...(action ? { action } : {}),
      ...(subjectUserId ? { subjectUserId } : {}),
      ...(actorUserId ? { actorUserId } : {}),
      ...(range.fromDate ? { createdFrom: range.fromDate } : {}),
      ...(range.toDate ? { createdTo: range.toDate } : {}),
      includeUnassigned: true,
    }),
    [action, subjectUserId, actorUserId, range.fromDate, range.toDate],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useUserManagementActivity({ page, limit: PAGE_SIZE, filters });

  const events = data?.data ?? [];
  const pagination = data?.pagination;
  const errorMessage = isError ? mapBackendError(error).message : "";

  const updateParams = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      updateParams((next) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
    },
    [updateParams],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(searchParams);
      if (nextPage > 1) next.set("page", String(nextPage));
      else next.delete("page");
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const applyRange = useCallback(
    (fromDate: string, toDate: string) => {
      updateParams((next) => {
        next.delete("period");
        if (fromDate) next.set("createdFrom", fromDate);
        else next.delete("createdFrom");
        if (toDate) next.set("createdTo", toDate);
        else next.delete("createdTo");
        if (!fromDate && !toDate) next.set("period", PERIOD_ALL);
      });
    },
    [updateParams],
  );

  const clearRange = useCallback(() => {
    updateParams((next) => {
      next.delete("createdFrom");
      next.delete("createdTo");
      next.set("period", PERIOD_ALL);
    });
  }, [updateParams]);

  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams({ period: PERIOD_ALL }), {
      replace: true,
    });
  }, [setSearchParams]);

  const personLabel = useCallback(
    (id: string) =>
      namesById.get(id) ?? userActivityPageCopy.filters.unknownPerson,
    [namesById],
  );

  const hasFilters =
    !!action || !!subjectUserId || !!actorUserId || !!range.fromDate || !!range.toDate;

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

    if (range.fromDate || range.toDate) {
      chips.push({
        id: "period",
        label: copy.filters.chip.period(
          formatListingDateRangeLabel(
            range.fromDate,
            range.toDate,
            copy.filters.periodPlaceholder,
          ),
        ),
        onRemove: clearRange,
      });
    }
    if (action) {
      chips.push({
        id: "action",
        label: copy.filters.chip.action(findUserActivityActionLabel(action)),
        onRemove: () => setParam("action", ""),
      });
    }
    if (subjectUserId) {
      chips.push({
        id: "subject",
        label: copy.filters.chip.person(personLabel(subjectUserId)),
        onRemove: () => setParam("subjectUserId", ""),
      });
    }
    if (actorUserId) {
      chips.push({
        id: "actor",
        label: copy.filters.chip.actor(personLabel(actorUserId)),
        onRemove: () => setParam("actorUserId", ""),
      });
    }

    return chips;
  }, [
    action,
    actorUserId,
    clearRange,
    copy.filters,
    personLabel,
    range.fromDate,
    range.toDate,
    setParam,
    subjectUserId,
  ]);

  return (
    <ListPageShell
      title={copy.page.title}
      description={copy.page.description}
      beforeToolbar={
        // Con datos previos en pantalla el fallo no llega al estado vacío: se avisa arriba.
        isError && events.length > 0 ? (
          <AlertWithIcon variant="destructive">
            {errorMessage || copy.page.error}
          </AlertWithIcon>
        ) : undefined
      }
      toolbar={{
        filters: (
          <>
            <ListingDateRangeFilter
              fromDate={range.fromDate}
              toDate={range.toDate}
              onApply={applyRange}
              onClear={clearRange}
              heading={copy.filters.periodHeading}
              placeholder={copy.filters.periodPlaceholder}
              idPrefix="user-activity-date"
            />

            <Select
              value={action || ALL_OPTION}
              onValueChange={(value) =>
                setParam("action", value === ALL_OPTION ? "" : value)
              }
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder={copy.filters.actionPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION}>
                  {copy.filters.actionAll}
                </SelectItem>
                {USER_ACTIVITY_ACTION_GROUPS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={subjectUserId || ALL_OPTION}
              onValueChange={(value) =>
                setParam("subjectUserId", value === ALL_OPTION ? "" : value)
              }
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={copy.filters.personPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTION}>
                  {copy.filters.personAll}
                </SelectItem>
                {directory.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant={actorUserId ? "secondary" : "outline"}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {copy.filters.more}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-3 p-4" align="start">
                <p className="text-sm font-medium">{copy.filters.moreHeading}</p>
                <div className="space-y-1.5">
                  <Label htmlFor="user-activity-actor">
                    {copy.filters.actorLabel}
                  </Label>
                  <Select
                    value={actorUserId || ALL_OPTION}
                    onValueChange={(value) =>
                      setParam("actorUserId", value === ALL_OPTION ? "" : value)
                    }
                  >
                    <SelectTrigger id="user-activity-actor">
                      <SelectValue placeholder={copy.filters.actorAll} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_OPTION}>
                        {copy.filters.actorAll}
                      </SelectItem>
                      {directory.map((entry) => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {entry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
          </>
        ),
        onRefresh: () => refetch().then(() => undefined),
        isRefreshing: isFetching,
        activeFilterChips,
        hasFilters,
        onClearFilters: clearAllFilters,
      }}
      isLoading={isLoading}
      items={events}
      entityLabelPlural={copy.page.entityLabelPlural}
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
      onPageChange={handlePageChange}
      emptyState={{
        icon: <History />,
        title: isError
          ? copy.page.errorTitle
          : hasFilters
            ? copy.empty.filteredTitle
            : copy.empty.title,
        description: isError
          ? errorMessage || copy.page.error
          : hasFilters
            ? copy.empty.filteredDescription
            : copy.empty.description,
        cta: isError
          ? {
              label: copy.page.retry,
              onClick: () => void refetch(),
              variant: "outline",
            }
          : hasFilters
            ? {
                label: copy.filters.clearAll,
                onClick: clearAllFilters,
                variant: "outline",
              }
            : undefined,
      }}
      renderTable={() =>
        isLoading ? (
          <UserActivityFeedSkeleton />
        ) : (
          <UserActivityFeed events={events} subjectNames={namesById} />
        )
      }
    />
  );
}
