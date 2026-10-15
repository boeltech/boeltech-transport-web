import { useCallback, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@features/auth";
import { useBranches } from "@features/branches";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { isSubscriptionPaywallExemptRole } from "@shared/constants/roles";
import { useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { AlertWithIcon } from "@shared/ui/alert";
import { SettingsPageShell } from "@shared/ui/page-shells/SettingsPageShell";
import { formatDate } from "@shared/utils/dateUtils";
import {
  useBillingAccess,
  useBillingArrears,
  useBillingEntitlements,
  useBillingSaasInvoices,
  useBillingSubscription,
  useBillingUsage,
} from "../../application/hooks/useBilling";
import {
  usePaySaasInvoice,
  usePaymentMethods,
} from "../../application/hooks/usePaymentMethods";
import {
  isSaasStripeNotConfiguredError,
  isStripePublishableConfigured,
} from "../../infrastructure/stripeClient";
import {
  BillingArrearsCard,
  BillingCollapsibleSection,
  BillingContactLink,
  BillingCostsCard,
  BillingModulesCard,
  BillingPlanCard,
  BillingPlanSummary,
  BillingSaasInvoiceHistoryCard,
  BillingStampsCard,
  BillingStatusNotice,
  PaymentMethodsCard,
} from "../components";
import { billingCopy } from "../copy/billingCopy";
import { confirmCardPaymentIfRequired } from "../utils/confirmCardPayment";
import { resolveTenantGraceDeadline } from "../utils/billingGrace";
import { resolveBillingNotice } from "../utils/billingNotice";
import { computeStampUsagePercent } from "../utils/stampUsageThresholds";
import { resolveAutoChargeChargedLabel } from "../utils/autoChargeChargedLabel";
import { formatBillingPeriodKey } from "../utils/billingFormatters";

export function BillingSubscriptionPage() {
  const copy = billingCopy;
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { success: toastSuccess, error: toastError } = useToast();
  const canReadBilling = hasPermission("billing", "read");
  const canUpdateBilling = hasPermission("billing", "update");
  const canReadBranches = hasPermission("branches", "read");

  const [stripeGatewayDown, setStripeGatewayDown] = useState(false);
  const stripeConfigured = isStripePublishableConfigured() && !stripeGatewayDown;

  const access = useBillingAccess();
  const subscription = useBillingSubscription({ enabled: canReadBilling });
  const usage = useBillingUsage({ enabled: canReadBilling });
  const entitlements = useBillingEntitlements({ enabled: canReadBilling });
  const arrears = useBillingArrears({ enabled: canReadBilling });
  const saasInvoices = useBillingSaasInvoices({ enabled: canReadBilling });
  const paymentMethods = usePaymentMethods({
    enabled: canReadBilling && stripeConfigured,
  });
  const payInvoice = usePaySaasInvoice();
  const { data: branchesResult } = useBranches(
    {
      page: 1,
      limit: 1,
      filters: { isActive: true },
    },
    { enabled: canReadBranches && canReadBilling },
  );

  const hasDefaultPaymentMethod = (paymentMethods.data ?? []).some(
    (pm) => pm.isDefault,
  );

  const handlePayInvoice = useCallback(
    async (invoiceId: string) => {
      try {
        const result = await payInvoice.mutateAsync(invoiceId);

        if (result.status === "requires_action") {
          const secret = result.clientSecret?.trim();
          if (!secret) {
            toastError(copy.arrears.payFailed);
            return;
          }
          toastSuccess(copy.arrears.payRequiresAction);
          const confirmed = await confirmCardPaymentIfRequired(secret);
          if (!confirmed.ok) {
            toastError(confirmed.message);
            return;
          }
          // Webhook / sync cierra el ledger; refrescar arrears + historial.
          await Promise.all([arrears.refetch(), saasInvoices.refetch()]);
          toastSuccess(copy.arrears.paySuccess);
          return;
        }

        if (result.status === "paid") {
          toastSuccess(copy.arrears.paySuccess);
          return;
        }

        if (result.status === "failed") {
          toastError(copy.arrears.payFailed);
          return;
        }

        toastSuccess(copy.arrears.paySuccess);
      } catch (error) {
        if (isSaasStripeNotConfiguredError(error)) {
          setStripeGatewayDown(true);
          toastError(copy.paymentMethods.gatewayUnavailable);
          return;
        }
        toastError(getErrorMessage(error));
      }
    },
    [
      arrears,
      saasInvoices,
      copy.arrears.payFailed,
      copy.arrears.payRequiresAction,
      copy.arrears.paySuccess,
      copy.paymentMethods.gatewayUnavailable,
      payInvoice,
      toastError,
      toastSuccess,
    ],
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
      usersOverQuota: false,
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
          <BillingContactLink />
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

  const usersOverQuota = sub?.capacity?.users.overQuota ?? false;
  const branchesOverQuota =
    sub?.capacity?.branches.overQuota ??
    branchesResult?.meta?.overQuota ??
    false;

  const notice = resolveBillingNotice({
    isSubscriptionResolved:
      !subscription.isLoading && !subscription.isError,
    status: sub?.status,
    trialEndsAt: sub?.trialEndsAt,
    includedStamps: use?.includedStamps,
    stampsUsed: use?.stampsUsed,
    usagePercent,
    usersOverQuota,
    branchesOverQuota,
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

  const canPayWithStripe = canUpdateBilling && stripeConfigured;

  const periodUntilLabel = sub?.currentPeriodEnd
    ? copy.planStatusStrip.periodUntil(formatDate(sub.currentPeriodEnd))
    : null;

  /**
   * Zona PAGAR (asunción 1): PM visible arriba si hay deuda open o no hay
   * método predeterminado. Si al corriente + hay default → disclosure colapsado.
   */
  const showPayZonePm =
    stripeConfigured && (hasOpenArrears || !hasDefaultPaymentMethod);
  const showPaymentMethodDisclosure =
    stripeConfigured && !hasOpenArrears && hasDefaultPaymentMethod;
  const showPayZoneDisclaimer = showPayZonePm || hasOpenArrears;

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
            {/* Notice + Arrears (D6) */}
            <BillingStatusNotice
              notice={notice}
              includedStamps={use?.includedStamps ?? 0}
              stampsRemaining={stampsRemaining}
              trialEndsAtLabel={formatDate(sub?.trialEndsAt)}
              graceDeadlineLabel={graceDeadlineLabel}
              quotaPolicy={use?.quotaPolicy ?? sub?.quotaPolicy ?? ""}
              usersOverQuota={usersOverQuota}
              branchesOverQuota={branchesOverQuota}
            />

            {hasOpenArrears && arrearsData ? (
              <BillingArrearsCard
                data={arrearsData}
                isLoading={arrears.isLoading}
                graceDeadlineLabel={graceDeadlineLabel}
                canPayWithStripe={canPayWithStripe}
                hasDefaultPaymentMethod={hasDefaultPaymentMethod}
                payingInvoiceId={
                  payInvoice.isPending
                    ? (payInvoice.variables ?? null)
                    : null
                }
                onPayInvoice={
                  canPayWithStripe ? handlePayInvoice : undefined
                }
              />
            ) : null}

            {/* Zona PAGAR: métodos visibles sin scroll por Detalle/Historial (D2) */}
            {showPayZonePm ? (
              <PaymentMethodsCard
                enabled={canReadBilling}
                onGatewayUnavailable={() => setStripeGatewayDown(true)}
              />
            ) : null}

            {showPayZoneDisclaimer ? (
              <p className="text-xs text-muted-foreground">
                {copy.payZone.saasDisclaimer}
              </p>
            ) : null}

            {/* Resumen unificado (D1) */}
            <BillingPlanSummary
              subscription={sub}
              isLoadingSubscription={subscription.isLoading}
              periodLabel={periodUntilLabel}
              chargedLabel={resolveAutoChargeChargedLabel(
                arrearsData?.invoices,
                formatBillingPeriodKey,
              )}
              commercialSummary={ent?.commercialSummary}
              isLoadingCosts={entitlements.isLoading}
              usage={use}
              isLoadingUsage={usage.isLoading}
              usagePercent={usagePercent}
              stampsRemaining={stampsRemaining}
            />

            {/* Método de cobro colapsado si al corriente + default (asunción 1) */}
            {showPaymentMethodDisclosure ? (
              <BillingCollapsibleSection
                title={copy.sections.paymentMethod.title}
                expandLabel={copy.sections.paymentMethod.expand}
                collapseLabel={copy.sections.paymentMethod.collapse}
              >
                <PaymentMethodsCard
                  enabled={canReadBilling}
                  onGatewayUnavailable={() => setStripeGatewayDown(true)}
                />
              </BillingCollapsibleSection>
            ) : null}

            {/* Detalle del plan — cerrado (D4); extras/rentabilidad aquí (asunción 2) */}
            <BillingCollapsibleSection
              title={copy.sections.planDetail.title}
              description={copy.sections.planDetail.description}
              expandLabel={copy.sections.planDetail.expand}
              collapseLabel={copy.sections.planDetail.collapse}
            >
              <div className="space-y-6">
                <BillingPlanCard
                  subscription={sub}
                  isLoading={subscription.isLoading}
                  includedStamps={use?.includedStamps}
                  variant="detail"
                />
                <BillingModulesCard
                  entitlements={ent}
                  isLoading={entitlements.isLoading}
                  planName={sub?.planName}
                  profitabilityLevel={sub?.profitabilityLevel}
                />
                <div className="grid gap-6 xl:grid-cols-2">
                  <BillingStampsCard
                    usage={use}
                    isLoading={usage.isLoading}
                    usagePercent={usagePercent}
                    stampsRemaining={stampsRemaining}
                    stampsPerMotriz={sub?.stampsPerMotriz}
                    qFact={sub?.qFact}
                  />
                  <BillingCostsCard
                    summary={ent?.commercialSummary}
                    isLoading={entitlements.isLoading}
                    billingCycle={sub?.billingCycle}
                    periodKey={periodKey}
                    subscription={sub}
                  />
                </div>
              </div>
            </BillingCollapsibleSection>

            {/* Cargos anteriores — cerrado (D4 / F1) */}
            <BillingCollapsibleSection
              title={copy.sections.history.title}
              description={copy.sections.history.description}
              expandLabel={copy.sections.history.expand}
              collapseLabel={copy.sections.history.collapse}
            >
              <BillingSaasInvoiceHistoryCard
                invoices={saasInvoices.data ?? []}
                isLoading={saasInvoices.isLoading}
                isError={saasInvoices.isError}
              />
            </BillingCollapsibleSection>

            <BillingContactLink />
          </>
        )}
      </div>
    </SettingsPageShell>
  );
}
