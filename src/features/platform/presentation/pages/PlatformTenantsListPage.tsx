import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { StatCard } from "@shared/ui/data-display";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import { Card, CardContent } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
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
import {
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformTenantStatus,
  isPlatformOwner,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import {
  usePlatformMetrics,
  usePlatformPlans,
  usePlatformTenants,
} from "../../application/hooks/usePlatformTenants";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { PlatformTenantStatusBadge } from "../config/platformTenantStatusConfig";
import { platformCopy } from "../copy/platformCopy";
import { resolvePlanDisplayName } from "../utils/formatPlanLabel";
import { formatDateTime } from "@shared/utils/dateUtils";

export function PlatformTenantsListPage() {
  const copy = platformCopy.tenants.list;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);

  const { data: plans } = usePlatformPlans();
  const { data: metrics, isLoading: isLoadingMetrics } = usePlatformMetrics();

  const filters = useListingFilters<"status" | "plan">({
    filters: {
      status: {},
      plan: { paramName: "planCode" },
    },
    chipLabels: {
      status: (value) =>
        copy.filters.statusChip(
          PLATFORM_TENANT_STATUS_LABELS[value as PlatformTenantStatusType] ??
            value,
        ),
      plan: (value) =>
        copy.filters.planChip(resolvePlanDisplayName(value, plans)),
    },
  });

  const { data, isLoading, isFetching, refetch } = usePlatformTenants({
    page: filters.page,
    limit: 20,
    status: (filters.filters.status as PlatformTenantStatusType) || undefined,
    planCode: filters.filters.plan || undefined,
    search: filters.search || undefined,
  });

  const tenants = data?.data ?? [];
  const pagination = data?.pagination;
  const hasSearchOrFilters = filters.hasFilters || !!filters.search;

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({
      title: copy.refreshSuccess,
      variant: "success",
    });
  }, [refetch, toast, copy.refreshSuccess]);

  return (
    <PlatformPageShell title={copy.title} description={copy.description}>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="secondary">{copy.hero.badge}</Badge>
            {canMutate ? (
              <Button size="sm" onClick={() => navigate("/platform/tenants/new")}>
                <Plus className="mr-2 h-4 w-4" />
                {copy.create}
              </Button>
            ) : null}
          </div>
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

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoadingMetrics ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              title={copy.metrics.registered}
              value={metrics?.totalTenants ?? 0}
              description={copy.metrics.registeredHint}
              icon={<Building2 className="h-5 w-5" />}
            />
            <StatCard
              title={copy.metrics.active}
              value={metrics?.activeTenants ?? 0}
              description={copy.metrics.activeHint}
              icon={<Building2 className="h-5 w-5" />}
              tone="success"
            />
            <StatCard
              title={copy.metrics.suspended}
              value={metrics?.suspendedTenants ?? 0}
              description={copy.metrics.suspendedHint}
              icon={<Building2 className="h-5 w-5" />}
              tone="warning"
            />
          </>
        )}
      </div>

      {!canMutate ? (
        <AlertWithIcon variant="info" title={copy.readOnlyTitle}>
          {copy.readOnlyHint}
        </AlertWithIcon>
      ) : null}

      <ListPageShell
        showHeader={false}
        entityLabelPlural={copy.entityLabelPlural}
        items={tenants}
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
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
          },
          filters: (
            <>
              <Select
                value={filters.filters.status || "all"}
                onValueChange={(value) =>
                  filters.setFilter("status", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={copy.filters.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.allStatuses}</SelectItem>
                  {Object.values(PlatformTenantStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {PLATFORM_TENANT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.filters.plan || "all"}
                onValueChange={(value) =>
                  filters.setFilter("plan", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={copy.filters.plan} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.allPlans}</SelectItem>
                  {(plans ?? []).map((plan) => (
                    <SelectItem key={plan.code} value={plan.code}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips: filters.activeChips,
          hasFilters: filters.hasFilters,
          onClearFilters: filters.clearAll,
        }}
        emptyState={{
          icon: <Building2 className="h-10 w-10" />,
          title: hasSearchOrFilters ? copy.empty.searchTitle : copy.empty.title,
          description: hasSearchOrFilters
            ? copy.empty.searchDescription
            : copy.empty.description,
          cta: canMutate
            ? {
                label: copy.create,
                onClick: () => navigate("/platform/tenants/new"),
              }
            : undefined,
        }}
        renderTable={() => (
          <>
            <div className="mb-4 space-y-1">
              <p className="text-sm font-medium">{copy.table.title}</p>
              <p className="text-xs text-muted-foreground">
                {copy.table.description}
              </p>
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.columns.name}</TableHead>
                    <TableHead>{copy.columns.subdomain}</TableHead>
                    <TableHead>{copy.columns.plan}</TableHead>
                    <TableHead>{copy.columns.usage}</TableHead>
                    <TableHead>{copy.columns.status}</TableHead>
                    <TableHead>{copy.columns.created}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                    >
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.subdomain}</TableCell>
                      <TableCell>
                        {tenant.planName ?? tenant.planCode ?? "—"}
                      </TableCell>
                      <TableCell>
                        {copy.usageSummary(tenant.userCount, tenant.branchCount)}
                      </TableCell>
                      <TableCell>
                        <PlatformTenantStatusBadge status={tenant.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(tenant.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="space-y-3 md:hidden">
              {tenants.map((tenant) => (
                <li key={tenant.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/40"
                    onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.subdomain}
                        </p>
                      </div>
                      <PlatformTenantStatusBadge status={tenant.status} />
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>{tenant.planName ?? tenant.planCode ?? "—"}</p>
                      <p>
                        {copy.usageSummary(tenant.userCount, tenant.branchCount)}
                      </p>
                      <p className="text-xs">{formatDateTime(tenant.createdAt)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      />
    </PlatformPageShell>
  );
}
