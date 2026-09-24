import { useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Plus } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
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
import {
  PLATFORM_LIFECYCLE_STAGE_VALUES,
  PLATFORM_SUBSCRIPTION_STATUS_VALUES,
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformTenantStatus,
  isPlatformOwner,
  type PlatformLifecycleStageType,
  type PlatformSubscriptionStatusType,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import {
  usePlatformPlans,
  usePlatformTenants,
} from "../../application/hooks/usePlatformTenants";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { PlatformTenantStatusBadge } from "../config/platformTenantStatusConfig";
import {
  getLifecycleStageLabel,
  TenantLifecycleBadge,
} from "../config/platformLifecycleConfig";
import { TenantHealthDot } from "../components/TenantHealthDot";
import { platformCopy } from "../copy/platformCopy";
import { resolvePlanDisplayName } from "../utils/formatPlanLabel";
import { getPlatformSubscriptionStatusLabel } from "../utils/platformBillingFormatters";

type HealthBand = "healthy" | "watch" | "risk";

function resolveHealthBand(band: string): {
  healthMin?: number;
  healthMax?: number;
} {
  if (band === "healthy") return { healthMin: 70 };
  if (band === "watch") return { healthMin: 40, healthMax: 69 };
  if (band === "risk") return { healthMax: 39 };
  return {};
}

function healthBandLabel(band: string): string {
  const copy = platformCopy.tenants.list.filters;
  if (band === "healthy") return copy.healthHealthy;
  if (band === "watch") return copy.healthWatch;
  if (band === "risk") return copy.healthRisk;
  return band;
}

export function PlatformTenantsListPage() {
  const copy = platformCopy.tenants.list;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);

  const { data: plans } = usePlatformPlans();

  const filters = useListingFilters<
    "access" | "commercial" | "plan" | "stage" | "atRisk" | "health"
  >({
    filters: {
      access: { paramName: "status" },
      commercial: { paramName: "subscriptionStatus" },
      plan: { paramName: "planCode" },
      stage: { paramName: "lifecycleStage" },
      atRisk: { paramName: "atRisk" },
      health: { paramName: "healthBand" },
    },
    chipLabels: {
      access: (value) =>
        copy.filters.accessChip(
          PLATFORM_TENANT_STATUS_LABELS[value as PlatformTenantStatusType] ??
            value,
        ),
      commercial: (value) =>
        copy.filters.commercialChip(
          getPlatformSubscriptionStatusLabel(value),
        ),
      plan: (value) =>
        copy.filters.planChip(resolvePlanDisplayName(value, plans)),
      stage: (value) =>
        copy.filters.stageChip(getLifecycleStageLabel(value)),
      atRisk: () => copy.filters.atRiskChip,
      health: (value) => copy.filters.healthChip(healthBandLabel(value)),
    },
  });

  const healthRange = useMemo(
    () => resolveHealthBand(filters.filters.health),
    [filters.filters.health],
  );

  const { data, isLoading, isFetching, refetch } = usePlatformTenants({
    page: filters.page,
    limit: 20,
    status: (filters.filters.access as PlatformTenantStatusType) || undefined,
    subscriptionStatus:
      (filters.filters.commercial as PlatformSubscriptionStatusType) ||
      undefined,
    planCode: filters.filters.plan || undefined,
    search: filters.search || undefined,
    lifecycleStage:
      (filters.filters.stage as PlatformLifecycleStageType) || undefined,
    atRisk: filters.filters.atRisk === "true" ? true : undefined,
    healthMin: healthRange.healthMin,
    healthMax: healthRange.healthMax,
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
      {!canMutate ? (
        <AlertWithIcon variant="info" title={copy.readOnlyTitle}>
          {copy.readOnlyHint}
        </AlertWithIcon>
      ) : null}

      <ListPageShell
        title={copy.title}
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
                value={filters.filters.access || "all"}
                onValueChange={(value) =>
                  filters.setFilter("access", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={copy.filters.access} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.allAccess}</SelectItem>
                  {Object.values(PlatformTenantStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {PLATFORM_TENANT_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.filters.commercial || "all"}
                onValueChange={(value) =>
                  filters.setFilter("commercial", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={copy.filters.commercial} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.allCommercial}</SelectItem>
                  {PLATFORM_SUBSCRIPTION_STATUS_VALUES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getPlatformSubscriptionStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.filters.stage || "all"}
                onValueChange={(value) =>
                  filters.setFilter("stage", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={copy.filters.stage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.allStages}</SelectItem>
                  {PLATFORM_LIFECYCLE_STAGE_VALUES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {getLifecycleStageLabel(stage)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.filters.atRisk || "all"}
                onValueChange={(value) =>
                  filters.setFilter("atRisk", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={copy.filters.atRisk} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.allRisk}</SelectItem>
                  <SelectItem value="true">{copy.filters.atRiskOnly}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.filters.health || "all"}
                onValueChange={(value) =>
                  filters.setFilter("health", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={copy.filters.health} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.allHealth}</SelectItem>
                  {(
                    ["healthy", "watch", "risk"] as HealthBand[]
                  ).map((band) => (
                    <SelectItem key={band} value={band}>
                      {healthBandLabel(band)}
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
          extraActions: canMutate ? (
            <Button onClick={() => navigate("/platform/tenants/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {copy.create}
            </Button>
          ) : undefined,
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
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.columns.name}</TableHead>
                    <TableHead>{copy.columns.plan}</TableHead>
                    <TableHead>{copy.columns.health}</TableHead>
                    <TableHead>{copy.columns.stage}</TableHead>
                    <TableHead>{copy.columns.access}</TableHead>
                    <TableHead>{copy.columns.commercial}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <Link
                            to={`/platform/tenants/${tenant.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {tenant.name}
                          </Link>
                          <p className="font-mono text-xs text-muted-foreground">
                            {tenant.subdomain}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.planName ?? tenant.planCode ?? "—"}
                      </TableCell>
                      <TableCell>
                        <TenantHealthDot score={tenant.healthScore} />
                      </TableCell>
                      <TableCell>
                        <TenantLifecycleBadge status={tenant.lifecycleStage} />
                      </TableCell>
                      <TableCell>
                        <PlatformTenantStatusBadge status={tenant.status} />
                      </TableCell>
                      <TableCell>
                        {tenant.subscriptionStatus ? (
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant={
                                tenant.subscriptionStatus === "past_due"
                                  ? "warning"
                                  : "secondary"
                              }
                              tone="soft"
                            >
                              {getPlatformSubscriptionStatusLabel(
                                tenant.subscriptionStatus,
                              )}
                            </Badge>
                            {tenant.subscriptionStatus === "past_due" ? (
                              <Link
                                className="text-xs text-primary underline-offset-2 hover:underline"
                                to={`/platform/billing/ar?status=open&tenant_id=${tenant.id}`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                {platformCopy.ar.actions.viewAr}
                              </Link>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {copy.commercialEmpty}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="space-y-3 md:hidden">
              {tenants.map((tenant) => (
                <li key={tenant.id}>
                  <Link
                    to={`/platform/tenants/${tenant.id}`}
                    className="block w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/40"
                    aria-label={copy.openTenantAria(tenant.name)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{tenant.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {tenant.subdomain}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <TenantHealthDot score={tenant.healthScore} />
                        <TenantLifecycleBadge status={tenant.lifecycleStage} />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <PlatformTenantStatusBadge status={tenant.status} />
                      {tenant.subscriptionStatus ? (
                        <Badge variant="secondary" tone="soft">
                          {getPlatformSubscriptionStatusLabel(
                            tenant.subscriptionStatus,
                          )}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tenant.planName ?? tenant.planCode ?? "—"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      />
    </PlatformPageShell>
  );
}
