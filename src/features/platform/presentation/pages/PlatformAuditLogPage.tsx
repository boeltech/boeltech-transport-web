import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardList, Filter } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { StatCard } from "@shared/ui/data-display";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { AlertWithIcon } from "@shared/ui/alert";
import { Card, CardContent } from "@shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { useListingFilters, useToast } from "@shared/hooks";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  PlatformAuditAction,
  type PlatformAuditLogItem,
} from "../../domain/entities";
import { usePlatformAuditLog } from "../../application/hooks/usePlatformAuditLog";
import { usePlatformTenant } from "../../application/hooks/usePlatformTenants";
import { platformCopy } from "../copy/platformCopy";

function toIsoStartOfDay(date: string): string {
  return new Date(`${date}T00:00:00.000`).toISOString();
}

function toIsoEndOfDay(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

function getActionLabel(action: string): string {
  const labels = platformCopy.audit.actions as Record<string, string>;
  return labels[action] ?? action;
}

function getMetadataSummary(item: PlatformAuditLogItem): string {
  const metadata = item.metadata;
  switch (item.action) {
    case PlatformAuditAction.TENANT_STATUS_CHANGED:
      return platformCopy.audit.metadata.statusChanged(
        String(metadata.previous_status ?? "—"),
        String(metadata.status ?? "—"),
        typeof metadata.reason === "string" ? metadata.reason : null,
      );
    case PlatformAuditAction.TENANT_PLAN_ASSIGNED:
      return platformCopy.audit.metadata.planAssigned(
        String(metadata.plan_code ?? metadata.new_plan_code ?? "—"),
      );
    case PlatformAuditAction.TENANT_CREATED:
      return platformCopy.audit.metadata.tenantCreated(
        String(metadata.subdomain ?? "—"),
        typeof metadata.plan_code === "string" ? metadata.plan_code : null,
      );
    case PlatformAuditAction.CATALOG_IMPORT:
      return platformCopy.audit.metadata.catalogImport(
        typeof metadata.type_code === "string" ? metadata.type_code : null,
        typeof metadata.version === "string" ? metadata.version : null,
      );
    case PlatformAuditAction.SUBSCRIPTION_ASSIGNED:
      return platformCopy.audit.metadata.subscriptionAssigned(
        String(metadata.plan_code ?? "—"),
        typeof metadata.status === "string" ? metadata.status : null,
      );
    case PlatformAuditAction.MODULE_ENTITLED:
      return platformCopy.audit.metadata.moduleEntitled(
        String(metadata.module_code ?? "—"),
      );
    case PlatformAuditAction.MODULE_REVOKED:
      return platformCopy.audit.metadata.moduleRevoked(
        String(metadata.module_code ?? "—"),
      );
    default:
      return Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : "—";
  }
}

function getTenantLabel(item: PlatformAuditLogItem): string {
  const subdomain = item.metadata.subdomain;
  if (typeof subdomain === "string" && subdomain.length > 0) {
    return subdomain;
  }
  return item.targetTenantId ? item.targetTenantId.slice(0, 8) : "—";
}

export function PlatformAuditLogPage() {
  const copy = platformCopy.audit;
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetTenantId = searchParams.get("targetTenantId") || "";

  const filters = useListingFilters<"action">({
    filters: {
      action: {},
    },
    chipLabels: {
      action: (value) => copy.filters.actionChip(getActionLabel(value)),
    },
  });

  const createdFromParam = searchParams.get("createdFrom") || "";
  const createdToParam = searchParams.get("createdTo") || "";
  const [dateDraft, setDateDraft] = useState({
    from: createdFromParam,
    to: createdToParam,
  });

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

  const activeChips = useMemo(() => {
    const chips = [...filters.activeChips];
    if (targetTenantId) {
      chips.push({
        id: "tenant",
        label: copy.filters.tenantChip(
          tenantFilter?.name ?? targetTenantId.slice(0, 8),
        ),
        onRemove: () => {
          const next = new URLSearchParams(searchParams);
          next.delete("targetTenantId");
          setSearchParams(next);
        },
      });
    }
    if (createdFromParam) {
      chips.push({
        id: "createdFrom",
        label: copy.filters.dateFromChip(createdFromParam),
        onRemove: () => {
          const next = new URLSearchParams(searchParams);
          next.delete("createdFrom");
          setSearchParams(next);
          setDateDraft((draft) => ({ ...draft, from: "" }));
        },
      });
    }
    if (createdToParam) {
      chips.push({
        id: "createdTo",
        label: copy.filters.dateToChip(createdToParam),
        onRemove: () => {
          const next = new URLSearchParams(searchParams);
          next.delete("createdTo");
          setSearchParams(next);
          setDateDraft((draft) => ({ ...draft, to: "" }));
        },
      });
    }
    return chips;
  }, [
    filters.activeChips,
    targetTenantId,
    tenantFilter?.name,
    createdFromParam,
    createdToParam,
    searchParams,
    setSearchParams,
    copy.filters,
  ]);

  const hasFilters =
    filters.hasFilters ||
    !!targetTenantId ||
    !!createdFromParam ||
    !!createdToParam;

  const activeFilterCount = activeChips.length;

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({
      title: copy.refreshSuccess,
      variant: "success",
    });
  }, [refetch, toast, copy.refreshSuccess]);

  const applyDateFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (dateDraft.from) next.set("createdFrom", dateDraft.from);
    else next.delete("createdFrom");
    if (dateDraft.to) next.set("createdTo", dateDraft.to);
    else next.delete("createdTo");
    next.set("page", "1");
    setSearchParams(next);
    filters.setPage(1);
  }, [dateDraft.from, dateDraft.to, filters, searchParams, setSearchParams]);

  const clearAllFilters = useCallback(() => {
    filters.clearAll();
    setDateDraft({ from: "", to: "" });
    const next = new URLSearchParams(searchParams);
    next.delete("targetTenantId");
    next.delete("createdFrom");
    next.delete("createdTo");
    setSearchParams(next);
  }, [filters, searchParams, setSearchParams]);

  const tenantFilterName = tenantFilter?.name ?? targetTenantId.slice(0, 8);

  return (
    <PlatformPageShell title={copy.title} description={copy.description}>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <Badge variant="secondary">{copy.hero.badge}</Badge>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {copy.hero.title}
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {copy.hero.description}
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {copy.hero.steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-lg border bg-background/80 p-3"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.hero.stepPrefix(index + 1)}
                </p>
                <p className="mt-1 text-sm font-medium">{step.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {isError ? (
        <AlertWithIcon variant="destructive" title={copy.error.title}>
          {copy.error.description}
        </AlertWithIcon>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={copy.metrics.totalEvents}
          value={pagination?.total ?? 0}
          description={copy.metrics.totalEventsHint}
          icon={<ClipboardList className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <StatCard
          title={copy.metrics.pageResults}
          value={entries.length}
          description={copy.metrics.pageResultsHint}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="info"
          isLoading={isLoading}
        />
        <StatCard
          title={copy.metrics.activeFilters}
          value={activeFilterCount}
          description={copy.metrics.activeFiltersHint}
          icon={<Filter className="h-5 w-5" />}
          tone={activeFilterCount > 0 ? "warning" : "neutral"}
        />
      </div>

      {targetTenantId ? (
        <AlertWithIcon variant="info" title={copy.tenantFilter.title}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{copy.tenantFilter.description(tenantFilterName)}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("targetTenantId");
                setSearchParams(next);
              }}
            >
              {copy.tenantFilter.clear}
            </Button>
          </div>
        </AlertWithIcon>
      ) : null}

      <ListPageShell
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
            <div className="w-full space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{copy.filtersCard.title}</p>
                <p className="text-xs text-muted-foreground">
                  {copy.filtersCard.description}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <Select
                  value={filters.filters.action || "all"}
                  onValueChange={(value) =>
                    filters.setFilter("action", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder={copy.filters.action} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {copy.filters.allActions}
                    </SelectItem>
                    {Object.values(PlatformAuditAction).map((action) => (
                      <SelectItem key={action} value={action}>
                        {getActionLabel(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-1">
                  <Label htmlFor="audit-date-from" className="text-xs">
                    {copy.filters.dateFrom}
                  </Label>
                  <Input
                    id="audit-date-from"
                    type="date"
                    value={dateDraft.from}
                    onChange={(event) =>
                      setDateDraft((draft) => ({
                        ...draft,
                        from: event.target.value,
                      }))
                    }
                    className="w-[160px]"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="audit-date-to" className="text-xs">
                    {copy.filters.dateTo}
                  </Label>
                  <Input
                    id="audit-date-to"
                    type="date"
                    min={dateDraft.from || undefined}
                    value={dateDraft.to}
                    onChange={(event) =>
                      setDateDraft((draft) => ({
                        ...draft,
                        to: event.target.value,
                      }))
                    }
                    className="w-[160px]"
                  />
                </div>

                <Button type="button" variant="outline" onClick={applyDateFilters}>
                  {copy.filters.applyDates}
                </Button>
              </div>
            </div>
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
                      <TableCell>{entry.platformUserEmail ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getActionLabel(entry.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.targetTenantId ? (
                          <Link
                            to={`/platform/tenants/${entry.targetTenantId}`}
                            className="text-primary hover:underline"
                          >
                            {getTenantLabel(entry)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="line-clamp-2 text-sm">
                          {getMetadataSummary(entry)}
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
                      {getActionLabel(entry.action)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {entry.platformUserEmail ?? "—"}
                  </p>
                  {entry.targetTenantId ? (
                    <p className="mt-1 text-sm">
                      <Link
                        to={`/platform/tenants/${entry.targetTenantId}`}
                        className="text-primary hover:underline"
                      >
                        {getTenantLabel(entry)}
                      </Link>
                    </p>
                  ) : null}
                  <p className="mt-2 text-sm">{getMetadataSummary(entry)}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      />
    </PlatformPageShell>
  );
}
