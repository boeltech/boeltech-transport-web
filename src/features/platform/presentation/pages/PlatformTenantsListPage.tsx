import { useCallback } from "react";
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
  PLATFORM_SUBSCRIPTION_STATUS_VALUES,
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformTenantStatus,
  isPlatformOwner,
  type PlatformSubscriptionStatusType,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import {
  usePlatformPlans,
  usePlatformTenants,
} from "../../application/hooks/usePlatformTenants";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { PlatformTenantStatusBadge } from "../config/platformTenantStatusConfig";
import { platformCopy } from "../copy/platformCopy";
import { resolvePlanDisplayName } from "../utils/formatPlanLabel";
import { getPlatformSubscriptionStatusLabel } from "../utils/platformBillingFormatters";

export function PlatformTenantsListPage() {
  const copy = platformCopy.tenants.list;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);

  const { data: plans } = usePlatformPlans();

  const filters = useListingFilters<"access" | "commercial" | "plan">({
    filters: {
      access: { paramName: "status" },
      commercial: { paramName: "subscriptionStatus" },
      plan: { paramName: "planCode" },
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
    },
  });

  const { data, isLoading, isFetching, refetch } = usePlatformTenants({
    page: filters.page,
    limit: 20,
    status: (filters.filters.access as PlatformTenantStatusType) || undefined,
    subscriptionStatus:
      (filters.filters.commercial as PlatformSubscriptionStatusType) ||
      undefined,
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
                    <TableHead>{copy.columns.access}</TableHead>
                    <TableHead>{copy.columns.commercial}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                    >
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {tenant.subdomain}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.planName ?? tenant.planCode ?? "—"}
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
                  <button
                    type="button"
                    className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/40"
                    onClick={() => navigate(`/platform/tenants/${tenant.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.subdomain}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <PlatformTenantStatusBadge status={tenant.status} />
                        {tenant.subscriptionStatus ? (
                          <Badge variant="secondary" tone="soft">
                            {getPlatformSubscriptionStatusLabel(
                              tenant.subscriptionStatus,
                            )}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {tenant.planName ?? tenant.planCode ?? "—"}
                    </p>
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
