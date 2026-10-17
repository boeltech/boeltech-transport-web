/**
 * FleetDocumentsListPage — tablero de documentos de flota por vencer.
 * ListPageShell + filtros ventana 30/15/7 · tipo · estado.
 */
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { FileWarning } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { useDocumentExpiries } from "../../application";
import {
  DOCUMENT_EXPIRY_DEFAULT_WITHIN_DAYS,
  DOCUMENT_EXPIRY_WITHIN_DAYS_OPTIONS,
  type DocumentExpiryDocTypeValue,
  type DocumentExpiryItem,
  type DocumentExpiryStatusValue,
  type DocumentExpiryWithinDays,
} from "../../domain";
import {
  FleetDocumentsFilters,
  FleetDocumentsTable,
} from "../components";
import { fleetDocumentsCopy } from "../copy";
import { countFleetDocumentsPanelFilters } from "../utils/countFleetDocumentsPanelFilters";
import { navigateToDocumentExpiryDetail } from "../utils/documentExpiryNavigation";

const copy = fleetDocumentsCopy;

function resolveWithinDays(raw: string): DocumentExpiryWithinDays {
  const n = Number(raw);
  if (
    DOCUMENT_EXPIRY_WITHIN_DAYS_OPTIONS.includes(
      n as DocumentExpiryWithinDays,
    )
  ) {
    return n as DocumentExpiryWithinDays;
  }
  return DOCUMENT_EXPIRY_DEFAULT_WITHIN_DAYS;
}

function isForbiddenError(error: unknown): boolean {
  if (isAxiosError(error) && error.response?.status === 403) return true;
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: number }).status === 403
  ) {
    return true;
  }
  return false;
}

export function FleetDocumentsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const filters = useListingFilters<"withinDays" | "docType" | "status">({
    filters: {
      withinDays: { paramName: "within_days" },
      docType: { paramName: "doc_type" },
      status: {},
    },
    defaultFilterValues: {
      withinDays: String(DOCUMENT_EXPIRY_DEFAULT_WITHIN_DAYS),
    },
    chipLabels: {
      withinDays: (value) => copy.filter.chip.withinDays(value),
      docType: (value) =>
        copy.filter.chip.docType(
          copy.docType[value as DocumentExpiryDocTypeValue] ?? value,
        ),
      status: (value) =>
        copy.filter.chip.status(
          copy.status[value as DocumentExpiryStatusValue] ?? value,
        ),
    },
    initialViewMode: "table",
  });

  const withinDays = resolveWithinDays(filters.filters.withinDays);
  const docTypeFilter = filters.filters.docType as
    | DocumentExpiryDocTypeValue
    | "";
  const statusFilter = filters.filters.status as DocumentExpiryStatusValue | "";
  const activePanelFilterCount = countFleetDocumentsPanelFilters({
    docType: docTypeFilter,
    status: statusFilter,
  });

  const queryParams = useMemo(
    () => ({
      page: filters.page,
      limit: 20,
      withinDays,
      docType: docTypeFilter || undefined,
      status: statusFilter || undefined,
    }),
    [filters.page, withinDays, docTypeFilter, statusFilter],
  );

  const { data, isLoading, isFetching, refetch, error, isError } =
    useDocumentExpiries(queryParams);

  useEffect(() => {
    if (!isError || !error) return;
    if (isForbiddenError(error)) {
      toast({
        title: copy.page.forbiddenToast,
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const items = useMemo(() => data?.data ?? [], [data?.data]);

  const handleOpen = useCallback(
    (item: DocumentExpiryItem) => {
      navigateToDocumentExpiryDetail(item, navigate);
    },
    [navigate],
  );

  const handleWithinDaysChange = useCallback(
    (days: DocumentExpiryWithinDays) => {
      filters.setFilter(
        "withinDays",
        days === DOCUMENT_EXPIRY_DEFAULT_WITHIN_DAYS ? "" : String(days),
      );
    },
    [filters],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.page.refreshSuccess, variant: "success" });
  }, [refetch, toast]);

  return (
    <ListPageShell
      title={copy.page.title}
      description={copy.page.description}
      toolbar={{
        filters: (
          <FleetDocumentsFilters
            withinDays={withinDays}
            docType={docTypeFilter}
            status={statusFilter}
            activePanelFilterCount={activePanelFilterCount}
            onWithinDaysChange={handleWithinDaysChange}
            onDocTypeChange={(value) => filters.setFilter("docType", value)}
            onStatusChange={(value) => filters.setFilter("status", value)}
          />
        ),
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: filters.activeChips,
        hasFilters: filters.hasFilters,
        onClearFilters: filters.clearAll,
      }}
      isLoading={isLoading}
      items={items}
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
      entityLabelPlural={copy.page.entityLabelPlural}
      emptyState={{
        icon: <FileWarning className="h-10 w-10 text-muted-foreground" />,
        title: copy.page.emptyTitle,
        description: copy.page.emptyDescription,
      }}
      renderTable={() => (
        <FleetDocumentsTable
          items={items}
          isLoading={isLoading}
          onOpen={handleOpen}
        />
      )}
    />
  );
}
