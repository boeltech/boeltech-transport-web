import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, ClipboardList, Info } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatListingDateRangeLabel } from "@shared/ui/listing";
import { useListingFilters, useToast } from "@shared/hooks";
import { formatDateTime } from "@shared/utils/dateUtils";
import { usePlatformAuditLog } from "../../application/hooks/usePlatformAuditLog";
import {
  usePlatformPlans,
  usePlatformTenant,
} from "../../application/hooks/usePlatformTenants";
import { PlatformAuditListFilters } from "../components/PlatformAuditListFilters";
import { platformCopy } from "../copy/platformCopy";
import {
  getAuditActionLabel,
  getAuditMetadataSummary,
  getAuditOperatorLabel,
  getAuditTenantLabel,
} from "../utils/platformAuditFormatters";
import { isPlatformConsoleV1Enabled } from "../ops/platformConsoleV1";
import { OpsAuditLogPage } from "../ops/OpsAuditLogPage";

function toIsoStartOfDay(date: string): string {
  return new Date(`${date}T00:00:00.000`).toISOString();
}

function toIsoEndOfDay(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

export function PlatformAuditLogPage() {
  if (isPlatformConsoleV1Enabled()) {
    return <OpsAuditLogPage />;
  }
  return <PlatformAuditLogPageConform />;
}

function PlatformAuditLogPageConform() {
  const copy = platformCopy.audit;
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetTenantId = searchParams.get("targetTenantId") || "";
  const { data: plans } = usePlatformPlans();

  const filters = useListingFilters<"action">({
    filters: {
      action: {},
    },
    chipLabels: {
      action: (value) => copy.filters.actionChip(getAuditActionLabel(value)),
    },
  });

  const createdFromParam = searchParams.get("createdFrom") || "";
  const createdToParam = searchParams.get("createdTo") || "";

  const { data: tenantFilter } = usePlatformTenant(targetTenantId);

  const queryParams = useMemo(
    () => ({
      page: filters.page,
      limit: 20,
      action: filters.filters.action || undefined,
      targetTenantId: targetTenantId || undefined,
      createdFrom: createdFromParam
        ? toIsoStartOfDay(createdFromParam)
        : undefined,
      createdTo: createdToParam ? toIsoEndOfDay(createdToParam) : undefined,
    }),
    [
      filters.page,
      filters.filters.action,
      targetTenantId,
      createdFromParam,
      createdToParam,
    ],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    usePlatformAuditLog(queryParams);

  const entries = data?.data ?? [];
  const pagination = data?.pagination;

  const applyDateRange = useCallback(
    (fromDate: string, toDate: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (fromDate) next.set("createdFrom", fromDate);
        else next.delete("createdFrom");
        if (toDate) next.set("createdTo", toDate);
        else next.delete("createdTo");
        next.set("page", "1");
        return next;
      });
      filters.setPage(1);
    },
    [filters, setSearchParams],
  );

  const clearDateRange = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("createdFrom");
      next.delete("createdTo");
      next.set("page", "1");
      return next;
    });
    filters.setPage(1);
  }, [filters, setSearchParams]);

  const clearTenantScope = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("targetTenantId");
      return next;
    });
  }, [setSearchParams]);

  const activeChips = useMemo(() => {
    const chips = [...filters.activeChips];
    if (targetTenantId) {
      chips.push({
        id: "tenant",
        label: copy.filters.tenantChip(
          tenantFilter?.subdomain ?? targetTenantId.slice(0, 8),
        ),
        onRemove: clearTenantScope,
      });
    }
    if (createdFromParam || createdToParam) {
      chips.push({
        id: "date",
        label: copy.filters.dateChip(
          formatListingDateRangeLabel(
            createdFromParam,
            createdToParam,
            copy.filters.datePlaceholder,
          ),
        ),
        onRemove: clearDateRange,
      });
    }
    return chips;
  }, [
    filters.activeChips,
    targetTenantId,
    tenantFilter?.subdomain,
    createdFromParam,
    createdToParam,
    clearTenantScope,
    clearDateRange,
    copy.filters,
  ]);

  const activePanelFilterCount =
    Number(!!filters.filters.action) +
    Number(!!createdFromParam || !!createdToParam);
  const hasPanelFilters = activePanelFilterCount > 0;

  const hasFilters =
    filters.hasFilters ||
    !!targetTenantId ||
    !!createdFromParam ||
    !!createdToParam;

  const clearAllFilters = useCallback(() => {
    filters.clearAll();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("createdFrom");
      next.delete("createdTo");
      next.delete("targetTenantId");
      next.set("page", "1");
      return next;
    });
  }, [filters, setSearchParams]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({
      title: copy.refreshSuccess,
      variant: "success",
    });
  }, [refetch, toast, copy.refreshSuccess]);

  const tenantFilterLabel = tenantFilter?.subdomain ?? null;

  return (
    <PlatformPageShell title={copy.title} description={copy.description}>
      {isError ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-5 w-5" aria-hidden />}
          title={copy.error.title}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
            >
              {copy.error.retry}
            </Button>
          }
        >
          <p>{copy.error.description}</p>
        </DetailAlertCard>
      ) : null}

      {targetTenantId ? (
        <DetailAlertCard
          severity="info"
          icon={<Info className="h-5 w-5" aria-hidden />}
          title={copy.tenantFilter.title}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearTenantScope}
            >
              {copy.tenantFilter.clear}
            </Button>
          }
        >
          <p>
            {copy.tenantFilter.description(
              tenantFilterLabel ?? targetTenantId.slice(0, 8),
            )}
          </p>
        </DetailAlertCard>
      ) : null}

      <ListPageShell
        title={copy.title}
        showHeader={false}
        entityLabelPlural={copy.entityLabelPlural}
        items={entries}
        isLoading={isLoading}
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
        onPageChange={filters.setPage}
        toolbar={{
          filters: (
            <PlatformAuditListFilters
              key={hasPanelFilters ? "filters-active" : "filters-idle"}
              action={filters.filters.action}
              dateFrom={createdFromParam}
              dateTo={createdToParam}
              activePanelFilterCount={activePanelFilterCount}
              onActionChange={(value) => filters.setFilter("action", value)}
              onApplyDateRange={applyDateRange}
              onClearDateRange={clearDateRange}
            />
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips: activeChips,
          hasFilters,
          onClearFilters: clearAllFilters,
        }}
        emptyState={{
          icon: <ClipboardList className="h-10 w-10" />,
          title: hasFilters ? copy.empty.searchTitle : copy.empty.title,
          description: hasFilters
            ? copy.empty.searchDescription
            : copy.empty.description,
        }}
        renderTable={() => (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.columns.date}</TableHead>
                    <TableHead>{copy.columns.operator}</TableHead>
                    <TableHead>{copy.columns.action}</TableHead>
                    <TableHead>{copy.columns.tenant}</TableHead>
                    <TableHead>{copy.columns.details}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(entry.createdAt)}
                      </TableCell>
                      <TableCell>{getAuditOperatorLabel(entry)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getAuditActionLabel(entry.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.targetTenantId ? (
                          <Link
                            to={`/platform/tenants/${entry.targetTenantId}`}
                            className="text-primary hover:underline"
                            aria-label={copy.openTenantAria(
                              getAuditTenantLabel(
                                entry,
                                entry.targetTenantId === targetTenantId
                                  ? tenantFilterLabel
                                  : null,
                              ),
                            )}
                          >
                            {getAuditTenantLabel(
                              entry,
                              entry.targetTenantId === targetTenantId
                                ? tenantFilterLabel
                                : null,
                            )}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="line-clamp-2 text-sm">
                          {getAuditMetadataSummary(entry, plans)}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="space-y-3 md:hidden">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {formatDateTime(entry.createdAt)}
                    </p>
                    <Badge variant="secondary">
                      {getAuditActionLabel(entry.action)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {getAuditOperatorLabel(entry)}
                  </p>
                  {entry.targetTenantId ? (
                    <p className="mt-1 text-sm">
                      <Link
                        to={`/platform/tenants/${entry.targetTenantId}`}
                        className="text-primary hover:underline"
                        aria-label={copy.openTenantAria(
                          getAuditTenantLabel(
                            entry,
                            entry.targetTenantId === targetTenantId
                              ? tenantFilterLabel
                              : null,
                          ),
                        )}
                      >
                        {getAuditTenantLabel(
                          entry,
                          entry.targetTenantId === targetTenantId
                            ? tenantFilterLabel
                            : null,
                        )}
                      </Link>
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm">
                    {getAuditMetadataSummary(entry, plans)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      />
    </PlatformPageShell>
  );
}
