/**
 * TrailerListPage — padrón de remolques (`ListPageShell`).
 *
 * Dictamen toolbar: search = lookup de placa; estado en «Filtros (n)».
 * `isActive: true` es invariante de consulta. Alta/edición siguen en sheet.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Container, Plus } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { ROLES } from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import {
  TRAILER_STATUS_LABELS,
  type Trailer,
  type TrailerStatusType,
} from "../../domain";
import { useTrailer, useTrailers } from "../../application";
import {
  TrailerCard,
  TrailerCardSkeleton,
  TrailerCatalogSheet,
  TrailerListFilters,
  TrailerTable,
} from "../components";
import { trailersCopy } from "../copy/trailersCopy";
import { useTrailerTypeLabels } from "../hooks/useTrailerTypeLabels";
import {
  TRAILER_CATALOG_CREATE_PARAM,
  TRAILER_CATALOG_EDIT_PARAM,
  readTrailerCatalogEditId,
} from "../trailerCatalogSheetParams";
import { countTrailerPanelFilters } from "../utils/trailerListFilters";

const copy = trailersCopy.list;

export function TrailerListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isManager = role === ROLES.MANAGER;
  const canCreate = hasPermission("trailers", "create");
  const canEdit = hasPermission("trailers", "update");
  const typeLabels = useTrailerTypeLabels();

  const filters = useListingFilters<"status">({
    filters: {
      status: {},
    },
    chipLabels: {
      status: (value) =>
        copy.chip.status(
          TRAILER_STATUS_LABELS[value as TrailerStatusType] ?? value,
        ),
    },
    preserveParamsOnClear: [
      TRAILER_CATALOG_CREATE_PARAM,
      TRAILER_CATALOG_EDIT_PARAM,
    ],
  });
  const statusFilter = filters.filters.status as TrailerStatusType | "";
  const activePanelFilterCount = countTrailerPanelFilters({
    status: statusFilter,
  });
  const hasPanelFilters = activePanelFilterCount > 0;

  const [sheetMode, setSheetMode] = useState<"closed" | "create" | "edit">(
    "closed",
  );
  const [editingTrailer, setEditingTrailer] = useState<Trailer | undefined>();

  const deepLinkConsumed = useRef(false);
  const deepLinkCreateParam = searchParams.get(TRAILER_CATALOG_CREATE_PARAM);
  const deepLinkEditParam = readTrailerCatalogEditId(
    searchParams.get(TRAILER_CATALOG_EDIT_PARAM),
  );

  const queryParams = useMemo(
    () => ({
      page: filters.page,
      limit: 10,
      filters: {
        search: filters.search || undefined,
        isActive: true,
        status: statusFilter || undefined,
      },
      sort: {
        field: "license_plate" as const,
        direction: "asc" as const,
      },
    }),
    [filters.page, filters.search, statusFilter],
  );

  const { data, isLoading, isFetching, refetch } = useTrailers(queryParams);
  const trailers = data?.data ?? [];

  const { data: deepLinkTrailer } = useTrailer(deepLinkEditParam, {
    enabled:
      Boolean(deepLinkEditParam) &&
      !deepLinkConsumed.current &&
      sheetMode === "closed",
  });

  useEffect(() => {
    if (deepLinkConsumed.current) return;
    if (deepLinkCreateParam === "true" && canCreate) {
      deepLinkConsumed.current = true;
      setSheetMode("create");
      return;
    }
    if (deepLinkEditParam && canEdit) {
      const fromList = trailers.find((t) => t.id === deepLinkEditParam);
      const trailer = fromList ?? deepLinkTrailer;
      if (trailer) {
        deepLinkConsumed.current = true;
        setEditingTrailer(trailer);
        setSheetMode("edit");
      }
    }
  }, [
    deepLinkCreateParam,
    deepLinkEditParam,
    canCreate,
    canEdit,
    trailers,
    deepLinkTrailer,
  ]);

  const handleCreate = useCallback(() => {
    setEditingTrailer(undefined);
    setSheetMode("create");
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      const trailer = trailers.find((t) => t.id === id);
      if (trailer) {
        setEditingTrailer(trailer);
        setSheetMode("edit");
      }
    },
    [trailers],
  );

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setSheetMode("closed");
        setEditingTrailer(undefined);
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete(TRAILER_CATALOG_CREATE_PARAM);
            next.delete(TRAILER_CATALOG_EDIT_PARAM);
            return next;
          },
          { replace: true },
        );
      }
    },
    [setSearchParams],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.toast.refreshed, variant: "success" });
  }, [refetch, toast]);

  const catalogOpen = sheetMode !== "closed";

  return (
    <>
      <ListPageShell
        title={copy.title}
        description={
          isManager && canCreate
            ? copy.descriptionManager
            : copy.description
        }
        primaryAction={{
          label: copy.create,
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreate,
          visible: canCreate,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.filter.searchPlaceholder,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          filters: (
            <TrailerListFilters
              key={hasPanelFilters ? "filters-active" : "filters-idle"}
              status={statusFilter}
              activePanelFilterCount={activePanelFilterCount}
              onStatusChange={(value) => filters.setFilter("status", value)}
            />
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips: filters.activeChips,
          hasFilters: filters.hasFilters,
          onClearFilters: filters.clearAll,
          viewMode: filters.viewModeProps,
        }}
        isLoading={isLoading}
        items={trailers}
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
        entityLabelPlural="remolques"
        renderTable={() => (
          <TrailerTable
            trailers={trailers}
            isLoading={isLoading}
            typeLabelFor={typeLabels.labelFor}
            typeLabelsLoading={typeLabels.isLoading}
            onEdit={handleEdit}
          />
        )}
        renderCards={() =>
          trailers.map((trailer) => (
            <TrailerCard
              key={trailer.id}
              trailer={trailer}
              typeLabel={
                typeLabels.labelFor(trailer.satSubTipoRemCode) ??
                copy.table.typeMissing
              }
              onEdit={handleEdit}
            />
          ))
        }
        renderCardSkeleton={() => <TrailerCardSkeleton />}
        emptyState={{
          icon: <Container className="h-10 w-10 text-muted-foreground" />,
          title: copy.empty.title,
          description: filters.hasFilters
            ? copy.empty.descriptionFiltered
            : canCreate
              ? isManager
                ? copy.empty.descriptionClearManager
                : copy.empty.descriptionClear
              : copy.empty.descriptionReadonly,
          cta: canCreate
            ? {
                label: copy.create,
                icon: <Plus className="h-4 w-4" />,
                onClick: handleCreate,
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

      <TrailerCatalogSheet
        open={catalogOpen}
        onOpenChange={handleSheetOpenChange}
        trailer={editingTrailer}
      />
    </>
  );
}
