/**
 * UserManagementActivityPage — bitácora de usuarios (`ListPageShell`).
 *
 * El periodo es la lente (riel). Tipo / persona / actor son recortes del
 * panel «Filtros (n)». No hay «Limpiar filtros» en el riel: quitar recortes
 * no escribe `period=all`.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { History } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  ListingDateRangeFilter,
  LISTING_DATE_RANGE_QUICK_PRESETS,
  type ActiveFilterChip,
} from "@shared/ui/listing";
import { mapBackendError } from "@shared/utils/errorMapper";
import { useUserDirectory, useUserManagementActivity } from "../../application";
import type { UserManagementActivityFilters } from "../../domain";
import { UserActivityFeed, UserActivityFeedSkeleton } from "../components/UserActivityFeed";
import { UserActivityFilters } from "../components/UserActivityFilters";
import {
  findUserActivityActionLabel,
  userActivityPageCopy,
} from "../copy/userActivityPageCopy";
import {
  countUserActivityPanelFilters,
  resolveUserActivityEmptyKind,
} from "../utils/userActivityFilters";

const PAGE_SIZE = 25;
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

  const clearRecortes = useCallback(() => {
    updateParams((next) => {
      next.delete("action");
      next.delete("subjectUserId");
      next.delete("actorUserId");
    });
  }, [updateParams]);

  const personLabel = useCallback(
    (id: string) =>
      namesById.get(id) ?? userActivityPageCopy.filters.unknownPerson,
    [namesById],
  );

  const hasRecortes = !!action || !!subjectUserId || !!actorUserId;
  const isEntireHistory =
    searchParams.get("period") === PERIOD_ALL &&
    !createdFromParam &&
    !createdToParam;
  const emptyKind = resolveUserActivityEmptyKind({
    hasRecortes,
    isEntireHistory,
  });
  const activePanelFilterCount = countUserActivityPanelFilters({
    action,
    subjectUserId,
    actorUserId,
  });

  const directoryOptions = useMemo(
    () => directory.map((entry) => ({ value: entry.id, label: entry.label })),
    [directory],
  );

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];

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
  }, [action, actorUserId, copy.filters, personLabel, setParam, subjectUserId]);

  const emptyCopy =
    emptyKind === "virgin"
      ? {
          title: copy.empty.virginTitle,
          description: copy.empty.virginDescription,
        }
      : emptyKind === "window"
        ? {
            title: copy.empty.windowTitle,
            description: copy.empty.windowDescription,
          }
        : {
            title: copy.empty.recorteTitle,
            description: copy.empty.recorteDescription,
          };

  const emptyCta = isError
    ? {
        label: copy.page.retry,
        onClick: () => void refetch(),
        variant: "outline" as const,
      }
    : emptyKind === "window"
      ? {
          label: copy.filters.viewAllHistory,
          onClick: clearRange,
          variant: "outline" as const,
        }
      : emptyKind === "recorte"
        ? {
            label: copy.filters.clearRecortes,
            onClick: clearRecortes,
            variant: "outline" as const,
          }
        : undefined;

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
            <UserActivityFilters
              key={hasRecortes ? "filters-active" : "filters-idle"}
              action={action}
              subjectUserId={subjectUserId}
              actorUserId={actorUserId}
              directory={directoryOptions}
              activePanelFilterCount={activePanelFilterCount}
              onActionChange={(value) => setParam("action", value)}
              onSubjectChange={(value) => setParam("subjectUserId", value)}
              onActorChange={(value) => setParam("actorUserId", value)}
            />
          </>
        ),
        onRefresh: () => refetch().then(() => undefined),
        isRefreshing: isFetching,
        activeFilterChips,
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
        title: isError ? copy.page.errorTitle : emptyCopy.title,
        description: isError
          ? errorMessage || copy.page.error
          : emptyCopy.description,
        cta: emptyCta,
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
