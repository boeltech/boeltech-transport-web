import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, ChevronDown, MoreHorizontal } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import {
  PlatformTenantStatus,
  isPlatformOwner,
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
import { platformCopy } from "../copy/platformCopy";
import { formatDateTime } from "@shared/utils/dateUtils";
import type { PlatformTenantStatusType } from "../../domain/entities";

export function PlatformTenantDetailPage() {
  const { id = "" } = useParams();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);
  const { data: tenant, isLoading, isError } = usePlatformTenant(id);
  const { data: subscription } = usePlatformTenantSubscription(id);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [manageSubscriptionOpen, setManageSubscriptionOpen] = useState(false);
  const [entitlementsOpen, setEntitlementsOpen] = useState(false);
  const [stampPackOpen, setStampPackOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] =
    useState<PlatformTenantStatusType | null>(null);

  const isPastDue =
    (subscription?.status ?? tenant?.subscriptionStatus) === "past_due";

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
            <DropdownMenuItem onClick={() => setEntitlementsOpen(true)}>
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
                <DropdownMenuItem onClick={() => setStampPackOpen(true)}>
                  {copy.grantStampPack}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {tenant.status !== PlatformTenantStatus.SUSPENDED ? (
                  <DropdownMenuItem
                    onClick={() => {
                      setTargetStatus(PlatformTenantStatus.SUSPENDED);
                      setStatusDialogOpen(true);
                    }}
                  >
                    {copy.suspend}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => {
                      setTargetStatus(PlatformTenantStatus.ACTIVE);
                      setStatusDialogOpen(true);
                    }}
                  >
                    {copy.reactivate}
                  </DropdownMenuItem>
                )}
                {tenant.status !== PlatformTenantStatus.CANCELLED ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      setTargetStatus(PlatformTenantStatus.CANCELLED);
                      setStatusDialogOpen(true);
                    }}
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
          icon: <Building2 className="h-5 w-5" />,
          title: tenant?.name ?? platformCopy.tenants.detail.title,
          subtitle: tenant?.subdomain,
          actions,
        }}
      >
        {tenant ? (
          <div className="space-y-6">
            <TenantGovernanceControls
              tenant={tenant}
              canMutate={canMutate}
              onManageSubscription={() => setManageSubscriptionOpen(true)}
            />

            <TenantAdminActivationCard
              tenantId={tenant.id}
              activation={tenant.adminActivation}
              canMutate={canMutate}
            />

            <TenantThisMonthCard
              tenantId={tenant.id}
              planName={tenant.planName}
              canExport
              forceBreakdownOpen={isPastDue}
            />

            <TenantSaasArCard
              tenantId={tenant.id}
              tenantLabel={tenant.name}
              canMutate={canMutate}
            />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {platformCopy.tenants.detail.sections.operation}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {platformCopy.tenants.detail.sections.capacitySummary(
                    tenant.usage.userCount,
                    tenant.usage.branchCount,
                  )}
                </p>
                {tenant.suspendedAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {platformCopy.tenants.detail.suspendedAt(
                      formatDateTime(tenant.suspendedAt),
                    )}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto px-0 hover:bg-transparent"
                >
                  {advancedOpen
                    ? platformCopy.tenants.detail.sections.advancedHide
                    : platformCopy.tenants.detail.sections.advancedShow}
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "ml-1.5 h-4 w-4 transition-transform",
                      advancedOpen && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <TenantSubscriptionCard tenantId={tenant.id} />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {platformCopy.tenants.detail.sections.overview}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow
                      variant="inline"
                      label={platformCopy.tenants.detail.usage.createdAt}
                      value={formatDateTime(tenant.createdAt)}
                    />
                    <InfoRow
                      variant="inline"
                      label={platformCopy.tenants.detail.usage.trips}
                      value={String(tenant.usage.tripCount)}
                    />
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : null}
      </DetailPageShell>

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
