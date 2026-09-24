import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, MoreHorizontal } from "lucide-react";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { InfoRow } from "@shared/ui/data-display";
import { useTabParam } from "@shared/hooks";
import {
  PlatformTenantStatus,
  isPlatformOwner,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import { usePlatformTenant } from "../../application/hooks/usePlatformTenants";
import { usePlatformTenantSubscription } from "../../application/hooks/usePlatformBilling";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { SuspendTenantDialog } from "../components/SuspendTenantDialog";
import { TenantSubscriptionCard } from "../components/TenantSubscriptionCard";
import { TenantThisMonthCard } from "../components/TenantThisMonthCard";
import { TenantGovernanceControls } from "../components/TenantGovernanceControls";
import { ManageSubscriptionSheet } from "../components/ManageSubscriptionSheet";
import { TenantEntitlementsSheet } from "../components/TenantEntitlementsSheet";
import { GrantStampPackSheet } from "../components/GrantStampPackSheet";
import { TenantSaasArCard } from "../components/TenantSaasArCard";
import { TenantAdminActivationCard } from "../components/TenantAdminActivationCard";
import { TenantHealthBreakdownCard } from "../components/TenantHealthBreakdownCard";
import { TenantActivityTab } from "../components/TenantActivityTab";
import { TenantHealthDot } from "../components/TenantHealthDot";
import { platformCopy } from "../copy/platformCopy";
import { formatDateTime } from "@shared/utils/dateUtils";
import { emptyPlatformTenantHealth } from "../../infrastructure/mappers";

/**
 * Sheet is modal={false}; opening it in the same tick as DropdownMenu dismiss
 * treats the closing pointer event as an outside interact and closes the sheet.
 */
function openOverlayAfterMenuClose(open: () => void) {
  window.setTimeout(open, 0);
}

const DETAIL_TABS = [
  "summary",
  "commercial",
  "operation",
  "activity",
] as const;

const TAB = {
  summary: "summary",
  commercial: "commercial",
  operation: "operation",
  activity: "activity",
} as const;

export function PlatformTenantDetailPage() {
  const { id = "" } = useParams();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);
  const { data: tenant, isLoading, isError } = usePlatformTenant(id);
  const { data: subscription } = usePlatformTenantSubscription(id);
  const { activeTab, setActiveTab } = useTabParam(DETAIL_TABS, TAB.summary);

  const [manageSubscriptionOpen, setManageSubscriptionOpen] = useState(false);
  const [entitlementsOpen, setEntitlementsOpen] = useState(false);
  const [stampPackOpen, setStampPackOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] =
    useState<PlatformTenantStatusType | null>(null);

  const isPastDue =
    (subscription?.status ?? tenant?.subscriptionStatus) === "past_due";

  const health = tenant?.health ?? emptyPlatformTenantHealth();

  const actions = useMemo(() => {
    if (!tenant) return undefined;
    const copy = platformCopy.tenants.detail.actions;

    return (
      <div className="flex flex-wrap items-center gap-2">
        {canMutate ? (
          <Button onClick={() => setManageSubscriptionOpen(true)}>
            {copy.manageSubscription}
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              {copy.moreActions}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onSelect={() =>
                openOverlayAfterMenuClose(() => setEntitlementsOpen(true))
              }
            >
              {copy.manageEntitlements}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to={`/platform/audit?targetTenantId=${encodeURIComponent(tenant.id)}`}
              >
                {copy.viewHistory}
              </Link>
            </DropdownMenuItem>
            {canMutate ? (
              <>
                <DropdownMenuItem
                  onSelect={() =>
                    openOverlayAfterMenuClose(() => setStampPackOpen(true))
                  }
                >
                  {copy.grantStampPack}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {tenant.status === PlatformTenantStatus.ACTIVE ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      openOverlayAfterMenuClose(() => {
                        setTargetStatus(PlatformTenantStatus.SUSPENDED);
                        setStatusDialogOpen(true);
                      })
                    }
                  >
                    {copy.suspend}
                  </DropdownMenuItem>
                ) : null}
                {tenant.status === PlatformTenantStatus.SUSPENDED ||
                tenant.status === PlatformTenantStatus.CANCELLED ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      openOverlayAfterMenuClose(() => {
                        setTargetStatus(PlatformTenantStatus.ACTIVE);
                        setStatusDialogOpen(true);
                      })
                    }
                  >
                    {copy.reactivate}
                  </DropdownMenuItem>
                ) : null}
                {tenant.status !== PlatformTenantStatus.CANCELLED ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() =>
                      openOverlayAfterMenuClose(() => {
                        setTargetStatus(PlatformTenantStatus.CANCELLED);
                        setStatusDialogOpen(true);
                      })
                    }
                  >
                    {copy.cancel}
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }, [tenant, canMutate]);

  const tabsCopy = platformCopy.tenants.detail.tabs;

  return (
    <>
      <DetailPageShell
        isLoading={isLoading}
        notFound={!tenant && isError}
        notFoundConfig={{
          icon: <Building2 />,
          title: platformCopy.tenants.detail.notFound.title,
          description: platformCopy.tenants.detail.notFound.description,
          backHref: "/platform/tenants",
          backLabel: platformCopy.tenants.detail.back,
        }}
        header={{
          backHref: "/platform/tenants",
          backLabel: platformCopy.tenants.detail.back,
          icon: <Building2 className="h-5 w-5" />,
          title: tenant?.name ?? platformCopy.tenants.detail.title,
          subtitle: tenant ? (
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-mono">{tenant.subdomain}</span>
              <TenantHealthDot score={tenant.healthScore} />
            </span>
          ) : undefined,
          actions,
        }}
        tabs={
          tenant
            ? {
                defaultValue: TAB.summary,
                value: activeTab,
                onValueChange: setActiveTab,
                items: [
                  {
                    value: TAB.summary,
                    label: tabsCopy.summary,
                    content: (
                      <div className="space-y-6">
                        <TenantHealthBreakdownCard health={health} />
                        <TenantThisMonthCard
                          tenantId={tenant.id}
                          planName={tenant.planName}
                          canExport
                          forceBreakdownOpen={isPastDue}
                        />
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {
                                platformCopy.tenants.detail.sections
                                  .operation
                              }
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">
                              {platformCopy.tenants.detail.sections.capacitySummary(
                                subscription?.capacity?.users.usage ??
                                  tenant.usage.userCount,
                                subscription?.capacity?.branches.usage ??
                                  tenant.usage.branchCount,
                                subscription?.capacity
                                  ? {
                                      users: subscription.capacity.users.granted,
                                      branches:
                                        subscription.capacity.branches.granted,
                                    }
                                  : undefined,
                              )}
                            </p>
                            {subscription?.capacity?.users.status ===
                              "over_limit" ||
                            subscription?.capacity?.branches.status ===
                              "over_limit" ? (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {
                                  platformCopy.tenants.detail.subscription
                                    .overLimitHint
                                }
                              </p>
                            ) : null}
                          </CardContent>
                        </Card>
                        <TenantAdminActivationCard
                          tenantId={tenant.id}
                          activation={tenant.adminActivation}
                          canMutate={canMutate}
                        />
                      </div>
                    ),
                  },
                  {
                    value: TAB.commercial,
                    label: tabsCopy.commercial,
                    content: (
                      <div className="space-y-6">
                        <TenantGovernanceControls
                          tenant={tenant}
                          canMutate={canMutate}
                          onManageSubscription={() =>
                            setManageSubscriptionOpen(true)
                          }
                        />
                        <TenantSaasArCard
                          tenantId={tenant.id}
                          tenantLabel={tenant.name}
                          canMutate={canMutate}
                        />
                        <TenantSubscriptionCard tenantId={tenant.id} />
                      </div>
                    ),
                  },
                  {
                    value: TAB.operation,
                    label: tabsCopy.operation,
                    content: (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {platformCopy.tenants.detail.sections.overview}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <InfoRow
                            variant="inline"
                            label={platformCopy.tenants.detail.usage.users}
                            value={String(
                              subscription?.capacity?.users.usage ??
                                tenant.usage.userCount,
                            )}
                          />
                          <InfoRow
                            variant="inline"
                            label={platformCopy.tenants.detail.usage.branches}
                            value={String(
                              subscription?.capacity?.branches.usage ??
                                tenant.usage.branchCount,
                            )}
                          />
                          <InfoRow
                            variant="inline"
                            label={platformCopy.tenants.detail.usage.trips}
                            value={String(tenant.usage.tripCount)}
                          />
                          <InfoRow
                            variant="inline"
                            label={platformCopy.tenants.detail.usage.createdAt}
                            value={formatDateTime(tenant.createdAt)}
                          />
                          {tenant.suspendedAt ? (
                            <InfoRow
                              variant="inline"
                              label={
                                platformCopy.tenants.detail.usage.suspendedAt
                              }
                              value={formatDateTime(tenant.suspendedAt)}
                            />
                          ) : null}
                        </CardContent>
                      </Card>
                    ),
                  },
                  {
                    value: TAB.activity,
                    label: tabsCopy.activity,
                    content: <TenantActivityTab tenantId={tenant.id} />,
                  },
                ],
              }
            : undefined
        }
      />

      <ManageSubscriptionSheet
        tenant={tenant ?? null}
        open={manageSubscriptionOpen}
        onOpenChange={setManageSubscriptionOpen}
      />
      <TenantEntitlementsSheet
        tenant={tenant ?? null}
        open={entitlementsOpen}
        onOpenChange={setEntitlementsOpen}
        canMutate={canMutate}
      />
      <GrantStampPackSheet
        tenant={tenant ?? null}
        open={stampPackOpen}
        onOpenChange={setStampPackOpen}
      />
      <SuspendTenantDialog
        tenant={tenant ?? null}
        targetStatus={targetStatus}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />
    </>
  );
}
