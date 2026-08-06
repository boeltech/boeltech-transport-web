import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { AlertWithIcon } from "@shared/ui/alert";
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
import { PlatformAuditAction } from "../../domain/entities";
import { usePlatformAuditLog } from "../../application/hooks/usePlatformAuditLog";
import {
  usePlatformPlans,
  usePlatformTenant,
} from "../../application/hooks/usePlatformTenants";
import { platformCopy } from "../copy/platformCopy";
import {
  getAuditActionLabel,
  getAuditMetadataSummary,
  getAuditOperatorLabel,
  getAuditTenantLabel,
} from "../utils/platformAuditFormatters";

function toIsoStartOfDay(date: string): string {
  return new Date(`${date}T00:00:00.000`).toISOString();
}

function toIsoEndOfDay(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

export function PlatformAuditLogPage() {
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

  const tenantFilterName = tenantFilter?.name ?? null;

  return (
    <PlatformPageShell title={copy.title} description={copy.description}>
      {isError ? (
        <AlertWithIcon variant="destructive" title={copy.error.title}>
          {copy.error.description}
        </AlertWithIcon>
      ) : null}

      {targetTenantId ? (
        <AlertWithIcon variant="info" title={copy.tenantFilter.title}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {copy.tenantFilter.description(
                tenantFilterName ?? targetTenantId.slice(0, 8),
              )}
            </span>
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
                  <SelectItem value="all">{copy.filters.allActions}</SelectItem>
                  {Object.values(PlatformAuditAction).map((action) => (
                    <SelectItem key={action} value={action}>
                      {getAuditActionLabel(action)}
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
                          >
                            {getAuditTenantLabel(
                              entry,
                              entry.targetTenantId === targetTenantId
                                ? tenantFilterName
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
                      >
                        {getAuditTenantLabel(
                          entry,
                          entry.targetTenantId === targetTenantId
                            ? tenantFilterName
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
