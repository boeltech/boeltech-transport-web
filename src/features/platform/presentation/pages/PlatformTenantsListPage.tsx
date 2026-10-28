import { useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Plus } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
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
import { PlatformTenantCard } from "../components/PlatformTenantCard";
import { PlatformTenantListFilters } from "../components/PlatformTenantListFilters";
import { platformCopy } from "../copy/platformCopy";
import { resolvePlanDisplayName } from "../utils/formatPlanLabel";
import { getPlatformSubscriptionStatusLabel } from "../utils/platformBillingFormatters";
import { isPlatformConsoleV1Enabled } from "../ops/platformConsoleV1";
import { OpsTenantsListPage } from "../ops/OpsTenantsListPage";

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

function countTenantPanelFilters(filters: {
  access: string;
  commercial: string;
  plan: string;
  stage: string;
  atRisk: string;
  health: string;
}): number {
  return (
    Number(!!filters.access) +
    Number(!!filters.commercial) +
    Number(!!filters.plan) +
    Number(!!filters.stage) +
    Number(!!filters.atRisk) +
    Number(!!filters.health)
  );
}

export function PlatformTenantsListPage() {
  if (isPlatformConsoleV1Enabled()) {
    return <OpsTenantsListPage />;
  }
  return <PlatformTenantsListPageConform />;
}

function PlatformTenantsListPageConform() {
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

  const activePanelFilterCount = countTenantPanelFilters(filters.filters);
  const hasPanelFilters = activePanelFilterCount > 0;

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
            <PlatformTenantListFilters
              key={hasPanelFilters ? "filters-active" : "filters-idle"}
              access={filters.filters.access}
              commercial={filters.filters.commercial}
              plan={filters.filters.plan}
              stage={filters.filters.stage}
              atRisk={filters.filters.atRisk}
              health={filters.filters.health}
              plans={plans ?? []}
              activePanelFilterCount={activePanelFilterCount}
              onAccessChange={(value) => filters.setFilter("access", value)}
              onCommercialChange={(value) =>
                filters.setFilter("commercial", value)
              }
              onPlanChange={(value) => filters.setFilter("plan", value)}
              onStageChange={(value) => filters.setFilter("stage", value)}
              onAtRiskChange={(value) => filters.setFilter("atRisk", value)}
              onHealthChange={(value) => filters.setFilter("health", value)}
            />
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
                  <PlatformTenantCard tenant={tenant} />
                </li>
              ))}
            </ul>
          </>
        )}
      />
    </PlatformPageShell>
  );
}
