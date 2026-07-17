import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, GitBranch, Route, Users } from "lucide-react";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { InfoRow } from "@shared/ui/data-display";
import {
  PlatformTenantStatus,
  isPlatformOwner,
} from "../../domain/entities";
import { usePlatformTenant } from "../../application/hooks/usePlatformTenants";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { PlatformTenantStatusBadge } from "../config/platformTenantStatusConfig";
import { SuspendTenantDialog } from "../components/SuspendTenantDialog";
import { TenantStampUsageCard } from "../components/TenantStampUsageCard";
import { TenantSubscriptionCard } from "../components/TenantSubscriptionCard";
import { TenantCommercialSummaryCard } from "../components/TenantCommercialSummaryCard";
import { TenantCommercialOverview } from "../components/TenantCommercialOverview";
import { ManageSubscriptionSheet } from "../components/ManageSubscriptionSheet";
import { TenantEntitlementsSheet } from "../components/TenantEntitlementsSheet";
import { GrantStampPackSheet } from "../components/GrantStampPackSheet";
import { platformCopy } from "../copy/platformCopy";
import { formatDateTime } from "@shared/utils/dateUtils";
import type { PlatformTenantStatusType } from "../../domain/entities";

export function PlatformTenantDetailPage() {
  const { id = "" } = useParams();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);
  const { data: tenant, isLoading, isError } = usePlatformTenant(id);

  const [manageSubscriptionOpen, setManageSubscriptionOpen] = useState(false);
  const [entitlementsOpen, setEntitlementsOpen] = useState(false);
  const [stampPackOpen, setStampPackOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] =
    useState<PlatformTenantStatusType | null>(null);

  const actions = useMemo(() => {
    if (!tenant) return undefined;
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link
            to={`/platform/audit?targetTenantId=${encodeURIComponent(tenant.id)}`}
          >
            {platformCopy.audit.viewTenantAudit}
          </Link>
        </Button>
        <Button variant="outline" onClick={() => setEntitlementsOpen(true)}>
          {platformCopy.tenants.detail.actions.manageEntitlements}
        </Button>
        {canMutate ? (
          <>
            <Button
              variant="outline"
              onClick={() => setManageSubscriptionOpen(true)}
            >
              {platformCopy.tenants.detail.actions.manageSubscription}
            </Button>
            <Button variant="outline" onClick={() => setStampPackOpen(true)}>
              {platformCopy.tenants.detail.actions.grantStampPack}
            </Button>
            {tenant.status !== PlatformTenantStatus.SUSPENDED ? (
              <Button
                variant="outline"
                onClick={() => {
                  setTargetStatus(PlatformTenantStatus.SUSPENDED);
                  setStatusDialogOpen(true);
                }}
              >
                {platformCopy.tenants.detail.actions.suspend}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setTargetStatus(PlatformTenantStatus.ACTIVE);
                  setStatusDialogOpen(true);
                }}
              >
                {platformCopy.tenants.detail.actions.reactivate}
              </Button>
            )}
            {tenant.status !== PlatformTenantStatus.CANCELLED ? (
              <Button
                variant="destructive"
                onClick={() => {
                  setTargetStatus(PlatformTenantStatus.CANCELLED);
                  setStatusDialogOpen(true);
                }}
              >
                {platformCopy.tenants.detail.actions.cancel}
              </Button>
            ) : null}
          </>
        ) : null}
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
          statusBadge: tenant ? (
            <PlatformTenantStatusBadge status={tenant.status} />
          ) : undefined,
          actions,
        }}
      >
        {tenant ? (
          <div className="space-y-6">
            <TenantCommercialOverview
              tenantId={tenant.id}
              tenantName={tenant.name}
              planName={tenant.planName}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <TenantSubscriptionCard tenantId={tenant.id} />
              <TenantStampUsageCard tenantId={tenant.id} canExport />
            </div>

            <TenantCommercialSummaryCard
              tenantId={tenant.id}
              onManageEntitlements={() => setEntitlementsOpen(true)}
            />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {platformCopy.tenants.detail.sections.operation}
              </h3>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {platformCopy.tenants.detail.sections.overview}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow
                      variant="inline"
                      label={platformCopy.tenants.detail.subscription.fields.plan}
                      value={tenant.planName ?? tenant.planCode ?? "—"}
                    />
                    <InfoRow
                      variant="inline"
                      label="Alta"
                      value={formatDateTime(tenant.createdAt)}
                    />
                    {tenant.suspendedAt ? (
                      <InfoRow
                        variant="inline"
                        label="Suspensión"
                        value={platformCopy.tenants.detail.suspendedAt(
                          formatDateTime(tenant.suspendedAt),
                        )}
                      />
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {platformCopy.tenants.detail.sections.usage}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-3">
                    <InfoRow
                      label={platformCopy.tenants.detail.usage.users}
                      value={String(tenant.usage.userCount)}
                      icon={<Users className="h-4 w-4" />}
                    />
                    <InfoRow
                      label={platformCopy.tenants.detail.usage.branches}
                      value={String(tenant.usage.branchCount)}
                      icon={<GitBranch className="h-4 w-4" />}
                    />
                    <InfoRow
                      label={platformCopy.tenants.detail.usage.trips}
                      value={String(tenant.usage.tripCount)}
                      icon={<Route className="h-4 w-4" />}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
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
