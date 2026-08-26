import { Navigate } from "react-router-dom";
import { useAuth } from "@features/auth";
import { useBranches } from "@features/branches";
import { isSubscriptionPaywallExemptRole } from "@shared/constants/roles";
import { usePermissions } from "@shared/permissions";
import { AlertWithIcon } from "@shared/ui/alert";
import { SettingsPageShell } from "@shared/ui/page-shells/SettingsPageShell";
import { formatDate } from "@shared/utils/dateUtils";
import {
  useBillingAccess,
  useBillingArrears,
  useBillingEntitlements,
  useBillingSubscription,
  useBillingUsage,
} from "../../application/hooks/useBilling";
import {
  BillingArrearsCard,
  BillingContactCard,
  BillingCostsCard,
  BillingModulesCard,
  BillingPlanCard,
  BillingStampsCard,
  BillingStatusNotice,
} from "../components";
import { billingCopy } from "../copy/billingCopy";
import { resolveTenantGraceDeadline } from "../utils/billingGrace";
import { resolveBillingNotice } from "../utils/billingNotice";
import { computeStampUsagePercent } from "../utils/stampUsageThresholds";

export function BillingSubscriptionPage() {
  const copy = billingCopy;
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canReadBilling = hasPermission("billing", "read");
  const canReadBranches = hasPermission("branches", "read");

  const access = useBillingAccess();
  const subscription = useBillingSubscription({ enabled: canReadBilling });
  const usage = useBillingUsage({ enabled: canReadBilling });
  const entitlements = useBillingEntitlements({ enabled: canReadBilling });
  const arrears = useBillingArrears({ enabled: canReadBilling });
  const { data: branchesResult } = useBranches(
    {
      page: 1,
      limit: 1,
      filters: { isActive: true },
    },
    { enabled: canReadBranches && canReadBilling },
  );

  if (isSubscriptionPaywallExemptRole(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  /** Staff without billing.read: status notices from slim access + contact. */
  if (!canReadBilling) {
    if (access.isError) {
      return (
        <SettingsPageShell
          sectionTitle={copy.page.sectionTitle}
          title={copy.page.title}
          description={copy.page.description}
        >
          <AlertWithIcon
            variant="destructive"
            title={copy.notices.accessDenied.title}
          >
            <p>{copy.notices.accessDenied.description}</p>
          </AlertWithIcon>
        </SettingsPageShell>
      );
    }

    const notice = resolveBillingNotice({
      isSubscriptionResolved: !access.isLoading && !access.isError,
      status: access.data?.subscriptionStatus,
      trialEndsAt: access.data?.trialEndsAt,
      usagePercent: 0,
      branchesOverQuota: false,
      hasOpenArrears: false,
    });

    return (
      <SettingsPageShell
        sectionTitle={copy.page.sectionTitle}
        title={copy.page.title}
        description={copy.page.description}
      >
        <div className="space-y-6">
          <BillingStatusNotice
            notice={notice}
            includedStamps={0}
            stampsRemaining={0}
            trialEndsAtLabel={formatDate(access.data?.trialEndsAt)}
            graceDeadlineLabel=""
            quotaPolicy=""
          />
          <BillingContactCard />
        </div>
      </SettingsPageShell>
    );
  }

  const sub = subscription.data;
  const use = usage.data;
  const ent = entitlements.data;
  const arrearsData = arrears.data;

  const usagePercent = use
    ? computeStampUsagePercent(use.stampsUsed, use.includedStamps)
    : 0;

  const stampsRemaining = use
    ? Math.max(0, use.includedStamps - use.stampsUsed)
    : 0;

  const hasOpenArrears = (arrearsData?.totalOpenCents ?? 0) > 0;

  const notice = resolveBillingNotice({
    isSubscriptionResolved:
      !subscription.isLoading && !subscription.isError,
    status: sub?.status,
    trialEndsAt: sub?.trialEndsAt,
    includedStamps: use?.includedStamps,
    stampsUsed: use?.stampsUsed,
    usagePercent,
    branchesOverQuota: branchesResult?.meta?.overQuota ?? false,
    hasOpenArrears,
  });

  const graceDeadline = resolveTenantGraceDeadline({
    oldestDueDate: arrearsData?.oldestDueDate,
    currentPeriodStart: sub?.currentPeriodStart,
  });
  const graceDeadlineLabel = graceDeadline
    ? formatDate(graceDeadline.toISOString())
    : "";

  /** Prefer usage period_key so stamps + costs share the same CDMX month label. */
  const periodKey = use?.periodKey ?? ent?.commercialSummary.periodKey ?? null;

  return (
    <SettingsPageShell
      sectionTitle={copy.page.sectionTitle}
      title={copy.page.title}
      description={copy.page.description}
    >
      <div className="space-y-6">
        {subscription.isError ? (
          <AlertWithIcon
            variant="destructive"
            title={copy.notices.accessDenied.title}
          >
            <p>{copy.notices.accessDenied.description}</p>
          </AlertWithIcon>
        ) : (
          <>
            {/* Zona 1 — Avisos críticos (saldo open → card, no notice) */}
            <BillingStatusNotice
              notice={notice}
              includedStamps={use?.includedStamps ?? 0}
              stampsRemaining={stampsRemaining}
              trialEndsAtLabel={formatDate(sub?.trialEndsAt)}
              graceDeadlineLabel={graceDeadlineLabel}
              quotaPolicy={use?.quotaPolicy ?? sub?.quotaPolicy ?? ""}
              branchesMeta={branchesResult?.meta}
            />

            {hasOpenArrears && arrearsData ? (
              <BillingArrearsCard
                data={arrearsData}
                isLoading={arrears.isLoading}
              />
            ) : null}

            {/* Zona 2 — Above-the-fold: cupo + estimado */}
            <div className="grid gap-6 xl:grid-cols-2">
              <BillingStampsCard
                usage={use}
                isLoading={usage.isLoading}
                usagePercent={usagePercent}
                stampsRemaining={stampsRemaining}
              />
              <BillingCostsCard
                summary={ent?.commercialSummary}
                isLoading={entitlements.isLoading}
                billingCycle={sub?.billingCycle}
                periodKey={periodKey}
              />
            </div>

            {/* Zona 3 — Contexto: plan, extras, contacto */}
            <div className="grid gap-6 xl:grid-cols-2">
              <BillingPlanCard
                subscription={sub}
                isLoading={subscription.isLoading}
                includedStamps={use?.includedStamps}
              />
              <BillingModulesCard
                entitlements={ent}
                isLoading={entitlements.isLoading}
                planName={sub?.planName}
                profitabilityLevel={sub?.profitabilityLevel}
              />
            </div>

            <BillingContactCard />
          </>
        )}
      </div>
    </SettingsPageShell>
  );
}
