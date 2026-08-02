import { SettingsPageShell } from "@shared/ui/page-shells/SettingsPageShell";
import { formatDate } from "@shared/utils/dateUtils";
import { useBranches } from "@features/branches";
import {
  useBillingEntitlements,
  useBillingSubscription,
  useBillingUsage,
} from "../../application/hooks/useBilling";
import {
  BillingContactCard,
  BillingCostsCard,
  BillingModulesCard,
  BillingPlanCard,
  BillingStampsCard,
  BillingStatusNotice,
} from "../components";
import { billingCopy } from "../copy/billingCopy";
import { resolveBillingNotice } from "../utils/billingNotice";
import { computeStampUsagePercent } from "../utils/stampUsageThresholds";

export function BillingSubscriptionPage() {
  const copy = billingCopy;
  const subscription = useBillingSubscription();
  const usage = useBillingUsage();
  const entitlements = useBillingEntitlements();
  const { data: branchesResult } = useBranches({
    page: 1,
    limit: 1,
    filters: { isActive: true },
  });

  const sub = subscription.data;
  const use = usage.data;
  const ent = entitlements.data;

  const usagePercent = use
    ? computeStampUsagePercent(use.stampsUsed, use.includedStamps)
    : 0;

  const stampsRemaining = use
    ? Math.max(0, use.includedStamps - use.stampsUsed)
    : 0;

  const notice = resolveBillingNotice({
    isSubscriptionResolved: !subscription.isLoading,
    status: sub?.status,
    trialEndsAt: sub?.trialEndsAt,
    includedStamps: use?.includedStamps,
    stampsUsed: use?.stampsUsed,
    usagePercent,
    branchesOverQuota: branchesResult?.meta?.overQuota ?? false,
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
          includedStamps={use?.includedStamps ?? 0}
          stampsRemaining={stampsRemaining}
          trialEndsAtLabel={formatDate(sub?.trialEndsAt)}
          quotaPolicy={use?.quotaPolicy ?? sub?.quotaPolicy ?? ""}
          branchesMeta={branchesResult?.meta}
        />

        <BillingStampsCard
          usage={use}
          isLoading={usage.isLoading}
          usagePercent={usagePercent}
          stampsRemaining={stampsRemaining}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <BillingPlanCard
            subscription={sub}
            isLoading={subscription.isLoading}
            includedStamps={use?.includedStamps}
          />
          <BillingCostsCard
            summary={ent?.commercialSummary}
            isLoading={entitlements.isLoading}
            billingCycle={sub?.billingCycle}
          />
        </div>

        <BillingModulesCard
          entitlements={ent}
          isLoading={entitlements.isLoading}
          planName={sub?.planName}
          profitabilityLevel={sub?.profitabilityLevel}
        />

        <BillingContactCard />
      </div>
    </SettingsPageShell>
  );
}
