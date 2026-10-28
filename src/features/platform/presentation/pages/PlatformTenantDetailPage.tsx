import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  MoreHorizontal,
  Route,
  Users,
} from "lucide-react";
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
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { useTabParam, useToast } from "@shared/hooks";
import { resolveDetailQueryErrorState } from "@shared/utils/resolveQueryErrorState";
import { mapBackendError } from "@shared/utils/errorMapper";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  AdminActivationStatus,
  PlatformTenantStatus,
  isPlatformOwner,
  type AdminActivationStatusType,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import {
  usePlatformTenant,
  useResendPlatformTenantActivation,
} from "../../application/hooks/usePlatformTenants";
import { usePlatformTenantSubscription } from "../../application/hooks/usePlatformBilling";
import { usePlatformTenantSaasInvoices } from "../../application/hooks/usePlatformSaasAr";
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
import { TenantCommercialStatusStrip } from "../components/TenantCommercialStatusStrip";
import { TenantHealthDot } from "../components/TenantHealthDot";
import { platformCopy } from "../copy/platformCopy";
import { formatPlatformUsageGranted } from "../utils/platformBillingFormatters";
import { emptyPlatformTenantHealth } from "../../infrastructure/mappers";
import { isPlatformConsoleV1Enabled } from "../ops/platformConsoleV1";
import { PlatformTenantHubPage } from "../ops/PlatformTenantHubPage";

/**
 * Sheet is modal={false}; opening it in the same tick as DropdownMenu dismiss
 * treats the closing pointer event as an outside interact and closes the sheet.
 */
function openOverlayAfterMenuClose(open: () => void) {
  window.setTimeout(open, 0);
}

const DETAIL_TABS = ["summary", "commercial", "activity"] as const;

const TAB = {
  summary: "summary",
  commercial: "commercial",
  activity: "activity",
} as const;

const ACTIVATION_ACTIONABLE: ReadonlySet<AdminActivationStatusType> = new Set([
  AdminActivationStatus.PENDING,
  AdminActivationStatus.EMAIL_FAILED,
  AdminActivationStatus.EXPIRED,
]);

type PrimaryKind =
  | "collections"
  | "reactivate"
  | "resend_activation"
  | "manage_subscription";

function resolvePrimaryKind(input: {
  canMutate: boolean;
  isPastDue: boolean;
  hasOpenInvoices: boolean;
  accessStatus: PlatformTenantStatusType;
  activationStatus: AdminActivationStatusType;
}): PrimaryKind | null {
  if (!input.canMutate) return null;
  if (input.isPastDue || input.hasOpenInvoices) return "collections";
  if (input.accessStatus === PlatformTenantStatus.SUSPENDED) {
    return "reactivate";
  }
  if (ACTIVATION_ACTIONABLE.has(input.activationStatus)) {
    return "resend_activation";
  }
  return "manage_subscription";
}

function scrollToId(id: string) {
  window.setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 80);
}

export function PlatformTenantDetailPage() {
  if (isPlatformConsoleV1Enabled()) {
    return <PlatformTenantHubPage />;
  }

  return <PlatformTenantDetailPageLegacy />;
}

function PlatformTenantDetailPageLegacy() {
  const { id = "" } = useParams();
  const { user } = usePlatformAuth();
  const { toast } = useToast();
  const canMutate = isPlatformOwner(user?.platformRole);
  const {
    data: tenant,
    isLoading,
    isError,
    error,
    refetch,
  } = usePlatformTenant(id);
  const { data: subscription } = usePlatformTenantSubscription(id);
  const { data: saasInvoices } = usePlatformTenantSaasInvoices(id);
  const { activeTab, setActiveTab } = useTabParam(DETAIL_TABS, TAB.summary);

  const [manageSubscriptionOpen, setManageSubscriptionOpen] = useState(false);
  const [entitlementsOpen, setEntitlementsOpen] = useState(false);
  const [stampPackOpen, setStampPackOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] =
    useState<PlatformTenantStatusType | null>(null);

  const subscriptionStatus =
    subscription?.status ?? tenant?.subscriptionStatus ?? null;
  const isPastDue = subscriptionStatus === "past_due";
  const hasOpenInvoices = Boolean(
    saasInvoices?.some((invoice) => invoice.status === "open"),
  );
  const activationStatus =
    tenant?.adminActivation?.status ?? AdminActivationStatus.NONE;

  const health = tenant?.health ?? emptyPlatformTenantHealth();

  const goToCollections = useCallback(() => {
    setActiveTab(TAB.commercial);
    scrollToId("tenant-saas-ar");
  }, [setActiveTab]);

  const focusActivation = useCallback(() => {
    setActiveTab(TAB.summary);
    scrollToId("tenant-admin-activation");
  }, [setActiveTab]);

  const resendMutation = useResendPlatformTenantActivation({
    onSuccess: () => {
      toast({
        title: platformCopy.tenants.detail.adminActivation.resendSuccess,
        variant: "success",
      });
      focusActivation();
    },
    onError: (err) => {
      toast({
        title: platformCopy.tenants.detail.adminActivation.resendError,
        description: mapBackendError(err).message,
        variant: "error",
      });
      focusActivation();
    },
  });

  const primaryKind = resolvePrimaryKind({
    canMutate,
    isPastDue,
    hasOpenInvoices,
    accessStatus: tenant?.status ?? PlatformTenantStatus.ACTIVE,
    activationStatus,
  });

  const queryState = resolveDetailQueryErrorState({
    missingId: !id,
    isError,
    error,
    hasData: Boolean(tenant),
  });
  const isLoadError =
    !isLoading &&
    !tenant &&
    (queryState === "serverError" ||
      queryState === "unknownError" ||
      queryState === "missingId");
  const isNotFound =
    !isLoading &&
    !tenant &&
    (queryState === "notFound" || queryState === "forbidden");

  const actionsCopy = platformCopy.tenants.detail.actions;
  const showManageAsSecondary =
    canMutate &&
    primaryKind != null &&
    primaryKind !== "manage_subscription";
  const actions = tenant ? (
    <div className="flex flex-wrap items-center gap-2">
      {primaryKind === "collections" ? (
        <Button onClick={goToCollections}>{actionsCopy.viewCollections}</Button>
      ) : null}
      {primaryKind === "reactivate" ? (
        <Button
          onClick={() => {
            setTargetStatus(PlatformTenantStatus.ACTIVE);
            setStatusDialogOpen(true);
          }}
        >
          {actionsCopy.reactivate}
        </Button>
      ) : null}
      {primaryKind === "resend_activation" ? (
        <Button
          isLoading={resendMutation.isPending}
          onClick={() => resendMutation.mutate({ id: tenant.id })}
        >
          {resendMutation.isPending
            ? platformCopy.tenants.detail.adminActivation.resending
            : platformCopy.tenants.detail.adminActivation.resend}
        </Button>
      ) : null}
      {primaryKind === "manage_subscription" ? (
        <Button onClick={() => setManageSubscriptionOpen(true)}>
          {actionsCopy.manageSubscription}
        </Button>
      ) : null}
      {showManageAsSecondary ? (
        <Button
          variant="outline"
          onClick={() => setManageSubscriptionOpen(true)}
        >
          {actionsCopy.manageSubscription}
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            {actionsCopy.moreActions}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={() =>
              openOverlayAfterMenuClose(() => setEntitlementsOpen(true))
            }
          >
            {actionsCopy.manageEntitlements}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to={`/platform/audit?targetTenantId=${encodeURIComponent(tenant.id)}`}
            >
              {actionsCopy.viewHistory}
            </Link>
          </DropdownMenuItem>
          {canMutate ? (
            <>
              <DropdownMenuItem
                onSelect={() =>
                  openOverlayAfterMenuClose(() => setStampPackOpen(true))
                }
              >
                {actionsCopy.grantStampPack}
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
                  {actionsCopy.suspend}
                </DropdownMenuItem>
              ) : null}
              {(tenant.status === PlatformTenantStatus.SUSPENDED ||
                tenant.status === PlatformTenantStatus.CANCELLED) &&
              primaryKind !== "reactivate" ? (
                <DropdownMenuItem
                  onSelect={() =>
                    openOverlayAfterMenuClose(() => {
                      setTargetStatus(PlatformTenantStatus.ACTIVE);
                      setStatusDialogOpen(true);
                    })
                  }
                >
                  {actionsCopy.reactivate}
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
                  {actionsCopy.cancel}
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : undefined;

  const tabsCopy = platformCopy.tenants.detail.tabs;
  const usageCopy = platformCopy.tenants.detail.usage;
  const usersUsage =
    subscription?.capacity?.users.usage ?? tenant?.usage.userCount ?? 0;
  const branchesUsage =
    subscription?.capacity?.branches.usage ?? tenant?.usage.branchCount ?? 0;
  const tripsUsage = tenant?.usage.tripCount ?? 0;
  const isOverLimit =
    subscription?.capacity?.users.status === "over_limit" ||
    subscription?.capacity?.branches.status === "over_limit";

  if (isLoadError) {
    return (
      <DetailPageShell
        isLoading={false}
        header={{
          backHref: "/platform/tenants",
          backLabel: platformCopy.tenants.detail.back,
          icon: <Building2 className="h-5 w-5" />,
          title: platformCopy.tenants.detail.title,
        }}
        alerts={
          <DetailAlertCard
            severity="critical"
            icon={<AlertCircle className="h-5 w-5" aria-hidden />}
            title={platformCopy.tenants.detail.loadError.title}
            action={
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void refetch()}
              >
                {platformCopy.tenants.detail.loadError.retry}
              </Button>
            }
          >
            <p>{platformCopy.tenants.detail.loadError.description}</p>
          </DetailAlertCard>
        }
      />
    );
  }

  return (
    <>
      <DetailPageShell
        isLoading={isLoading}
        notFound={isNotFound}
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
              {tenant.planName ? (
                <span className="text-muted-foreground">· {tenant.planName}</span>
              ) : null}
              <TenantHealthDot score={tenant.healthScore} />
            </span>
          ) : undefined,
          actions,
        }}
        alerts={
          tenant ? (
            <TenantCommercialStatusStrip
              accessStatus={tenant.status}
              subscriptionStatus={subscriptionStatus}
              planName={subscription?.planName ?? tenant.planName}
              lifecycleStage={tenant.lifecycleStage}
              currentPeriodStart={subscription?.currentPeriodStart}
              trialEndsAt={subscription?.trialEndsAt}
              onViewCollections={goToCollections}
            />
          ) : undefined
        }
        stats={
          tenant
            ? [
                {
                  title: usageCopy.users,
                  value: String(usersUsage),
                  icon: <Users className="h-4 w-4" />,
                  tone: subscription?.capacity?.users.status === "over_limit"
                    ? "warning"
                    : "neutral",
                },
                {
                  title: usageCopy.branches,
                  value: String(branchesUsage),
                  icon: <Building2 className="h-4 w-4" />,
                  tone:
                    subscription?.capacity?.branches.status === "over_limit"
                      ? "warning"
                      : "neutral",
                },
                {
                  title: usageCopy.trips,
                  value: String(tripsUsage),
                  icon: <Route className="h-4 w-4" />,
                  tone: "neutral",
                },
                {
                  title: usageCopy.createdAt,
                  value: formatDateTime(tenant.createdAt),
                  icon: <CalendarDays className="h-4 w-4" />,
                  tone: "neutral",
                },
              ]
            : undefined
        }
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
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                              {
                                platformCopy.tenants.detail.sections
                                  .capacity
                              }
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <InfoRow
                              variant="inline"
                              label={usageCopy.users}
                              value={
                                subscription?.capacity
                                  ? formatPlatformUsageGranted(
                                      usersUsage,
                                      subscription.capacity.users.granted,
                                    )
                                  : String(usersUsage)
                              }
                              alert={
                                subscription?.capacity?.users.status ===
                                "over_limit"
                                  ? "warning"
                                  : undefined
                              }
                            />
                            <InfoRow
                              variant="inline"
                              label={usageCopy.branches}
                              value={
                                subscription?.capacity
                                  ? formatPlatformUsageGranted(
                                      branchesUsage,
                                      subscription.capacity.branches.granted,
                                    )
                                  : String(branchesUsage)
                              }
                              alert={
                                subscription?.capacity?.branches.status ===
                                "over_limit"
                                  ? "warning"
                                  : undefined
                              }
                            />
                            <InfoRow
                              variant="inline"
                              label={usageCopy.trips}
                              value={String(tripsUsage)}
                            />
                            <InfoRow
                              variant="inline"
                              label={usageCopy.createdAt}
                              value={formatDateTime(tenant.createdAt)}
                            />
                            {tenant.suspendedAt ? (
                              <InfoRow
                                variant="inline"
                                label={usageCopy.suspendedAt}
                                value={formatDateTime(tenant.suspendedAt)}
                              />
                            ) : null}
                            {isOverLimit ? (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">
                                  {
                                    platformCopy.tenants.detail.subscription
                                      .overLimitHint
                                  }
                                </p>
                                {canMutate ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEntitlementsOpen(true)}
                                  >
                                    {
                                      platformCopy.tenants.detail.actions
                                        .manageEntitlementsFromCapacity
                                    }
                                  </Button>
                                ) : null}
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                        <TenantHealthBreakdownCard
                          health={health}
                          defaultCollapsed
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
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEntitlementsOpen(true)}
                          >
                            {
                              platformCopy.tenants.detail.actions
                                .manageEntitlements
                            }
                          </Button>
                          {canMutate ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setStampPackOpen(true)}
                            >
                              {
                                platformCopy.tenants.detail.actions
                                  .grantStampPack
                              }
                            </Button>
                          ) : null}
                        </div>
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
