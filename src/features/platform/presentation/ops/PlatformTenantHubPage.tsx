import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { useTabParam, useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import { resolveDetailQueryErrorState } from "@shared/utils/resolveQueryErrorState";
import {
  AdminActivationStatus,
  PlatformTenantStatus,
  isPlatformOwner,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import {
  usePlatformTenant,
  useResendPlatformTenantActivation,
} from "../../application/hooks/usePlatformTenants";
import { usePlatformTenantSubscription } from "../../application/hooks/usePlatformBilling";
import { usePlatformTenantSaasInvoices } from "../../application/hooks/usePlatformSaasAr";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { OpsTenantSaasArPanel } from "./OpsTenantSaasArPanel";
import { OpsTenantHealthPanel } from "./OpsTenantHealthPanel";
import { OpsTenantSubscriptionPanel } from "./OpsTenantSubscriptionPanel";
import { OpsTenantUsagePanel } from "./OpsTenantUsagePanel";
import { OpsTenantActivationPanel } from "./OpsTenantActivationPanel";
import { OpsTenantActivityPanel } from "./OpsTenantActivityPanel";
import { OpsManageSubscriptionSheet } from "./OpsManageSubscriptionSheet";
import { OpsSuspendTenantDialog } from "./OpsSuspendTenantDialog";
import { RotateAdminCredentialsDialog } from "../components/RotateAdminCredentialsDialog";
import { emptyPlatformTenantHealth } from "../../infrastructure/mappers";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { resolvePastDueGraceDeadline } from "@features/billing/presentation/utils/billingGrace";
import { platformCopy } from "../copy/platformCopy";
import { opsCopy } from "./opsCopy";
import { OpsRegisterPaymentSheet } from "./OpsRegisterPaymentSheet";
import { OpsChangePlanSheet } from "./OpsChangePlanSheet";
import { OpsAttachAddonSheet } from "./OpsAttachAddonSheet";
import {
  clearHubPreviewParams,
  readHubPreviewModuleCode,
  readHubPreviewPlanCode,
} from "./hubPreviewParams";
import { resolveHubPrimaryKind } from "./hubPrimaryCta";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsHubHeader } from "./patterns/OpsHubHeader";
import { OpsAlert } from "./ui/OpsAlert";
import { OpsButton } from "./ui/OpsButton";

const HUB_TABS = [
  "resumen",
  "suscripcion",
  "uso",
  "cobranza",
  "activacion",
  "auditoria",
] as const;

const TAB = {
  resumen: "resumen",
  suscripcion: "suscripcion",
  uso: "uso",
  cobranza: "cobranza",
  activacion: "activacion",
  auditoria: "auditoria",
} as const;

/**
 * Hub de la empresa: un título, sellos y como máximo un sólido.
 * Salud y timbres no se reconstruyen aquí (oleada 3).
 */
export function PlatformTenantHubPage() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const { activeTab, setActiveTab } = useTabParam(HUB_TABS, TAB.resumen);

  const [manageOpen, setManageOpen] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] =
    useState<PlatformTenantStatusType | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [previewPlanCode, setPreviewPlanCode] = useState<string | null>(null);
  const [previewModuleCode, setPreviewModuleCode] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!canMutate) return;
    const planCode = readHubPreviewPlanCode(searchParams);
    const moduleCode = readHubPreviewModuleCode(searchParams);
    if (!planCode && !moduleCode) return;

    if (planCode) {
      setPreviewPlanCode(planCode);
      setChangePlanOpen(true);
    } else if (moduleCode) {
      setPreviewModuleCode(moduleCode);
      setAttachOpen(true);
    }
    setSearchParams(clearHubPreviewParams(searchParams), { replace: true });
  }, [canMutate, searchParams, setSearchParams]);

  const subscriptionStatus =
    subscription?.status ?? tenant?.subscriptionStatus ?? null;
  const hasOpenInvoices = Boolean(
    saasInvoices?.some((invoice) => invoice.status === "open"),
  );
  const activationStatus =
    tenant?.adminActivation?.status ?? AdminActivationStatus.NONE;

  const primaryKind = resolveHubPrimaryKind({
    canMutate,
    accessStatus: tenant?.status ?? PlatformTenantStatus.ACTIVE,
    subscriptionStatus,
    activationStatus,
    hasOpenInvoices,
    lifecycleStage: tenant?.lifecycleStage,
  });

  const resendMutation = useResendPlatformTenantActivation({
    onSuccess: () => {
      toast({
        title: platformCopy.tenants.detail.adminActivation.resendSuccess,
        variant: "success",
      });
      setActiveTab(TAB.activacion);
    },
    onError: (err) => {
      toast({
        title: platformCopy.tenants.detail.adminActivation.resendError,
        description: mapBackendError(err).message,
        variant: "error",
      });
    },
  });

  const goCobranza = useCallback(() => {
    setActiveTab(TAB.cobranza);
  }, [setActiveTab]);

  const openRegisterPayment = useCallback(() => {
    setActiveTab(TAB.cobranza);
    setPaymentOpen(true);
  }, [setActiveTab]);

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

  if (isLoadError || isNotFound) {
    return (
      <div className="space-y-3" data-testid="platform-tenant-hub">
        <Link to="/platform/tenants" className="text-xs ops-text-accent">
          ← {opsCopy.hub.back}
        </Link>
        <OpsEmptyState
          variant={isNotFound ? "empty" : "error"}
          title={
            isNotFound ? opsCopy.hub.notFound : opsCopy.hub.loadError.title
          }
          description={
            isNotFound ? undefined : opsCopy.hub.loadError.description
          }
          action={
            !isNotFound ? (
              <OpsButton
                variant="ghost"
                size="sm"
                onClick={() => void refetch()}
              >
                {opsCopy.hub.loadError.retry}
              </OpsButton>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (isLoading || !tenant) {
    return (
      <div data-testid="platform-tenant-hub">
        <OpsEmptyState variant="loading" title="Cargando…" panel />
      </div>
    );
  }

  const health = tenant.health ?? emptyPlatformTenantHealth();
  const tabs = opsCopy.hub.tabs;
  const isPastDue = subscriptionStatus === "past_due";
  const graceDeadline = isPastDue
    ? resolvePastDueGraceDeadline(subscription?.currentPeriodStart)
    : null;
  const pastDueLabel = isPastDue
    ? graceDeadline
      ? `${opsCopy.hub.strip.pastDueOperating} · ${formatDate(graceDeadline.toISOString())}`
      : opsCopy.hub.strip.pastDueOperating
    : null;
  const trialEndsLabel =
    subscriptionStatus === "trialing" && subscription?.trialEndsAt
      ? `Fin de prueba: ${formatDateTime(subscription.trialEndsAt)}`
      : null;

  return (
    <div data-testid="platform-tenant-hub" className="space-y-3">
      <OpsHubHeader
        tenantName={tenant.name}
        subdomain={tenant.subdomain}
        tenantIdShort={tenant.id.slice(0, 8)}
        accessStatus={tenant.status}
        lifecycleStage={tenant.lifecycleStage}
        planCode={tenant.planCode}
        planName={tenant.planName ?? subscription?.planName ?? null}
        trialEndsLabel={trialEndsLabel}
        pastDueLabel={pastDueLabel}
        onViewCollections={goCobranza}
        actions={
          canMutate ? (
            <>
              {primaryKind === "resend_activation" ? (
                <OpsButton
                  variant="primary"
                  disabled={resendMutation.isPending}
                  onClick={() => resendMutation.mutate({ id: tenant.id })}
                >
                  {opsCopy.hub.primary.resendActivation}
                </OpsButton>
              ) : null}
              {primaryKind === "continue_onboarding" ? (
                <OpsButton variant="primary" asChild>
                  <Link to="/platform/tenants/new">
                    {opsCopy.hub.primary.continueOnboarding}
                  </Link>
                </OpsButton>
              ) : null}
              {primaryKind === "register_payment" ? (
                <OpsButton variant="primary" onClick={openRegisterPayment}>
                  {opsCopy.hub.primary.registerPayment}
                </OpsButton>
              ) : null}
              {primaryKind === "reactivate" ? (
                <OpsButton
                  variant="primary"
                  onClick={() => {
                    setTargetStatus(PlatformTenantStatus.ACTIVE);
                    setStatusDialogOpen(true);
                  }}
                >
                  {opsCopy.hub.primary.reactivate}
                </OpsButton>
              ) : null}
              <OpsButton
                variant="ghost"
                onClick={() => {
                  setPreviewPlanCode(null);
                  setChangePlanOpen(true);
                }}
              >
                {opsCopy.hub.primary.changePlan}
              </OpsButton>
              <OpsButton
                variant="ghost"
                aria-expanded={overflowOpen}
                aria-haspopup="menu"
                onClick={() => setOverflowOpen((v) => !v)}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
                {opsCopy.hub.overflow.more}
              </OpsButton>
              {overflowOpen ? (
                <div
                  role="menu"
                  className="ops-rounded ops-hairline ops-bg-elevated absolute right-0 top-full z-20 mt-1 min-w-[12rem] py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="ops-menu-item"
                    onClick={() => {
                      setOverflowOpen(false);
                      setPreviewModuleCode(null);
                      setAttachOpen(true);
                    }}
                  >
                    {opsCopy.hub.overflow.attachAddon}
                  </button>
                  {primaryKind !== "resend_activation" ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="ops-menu-item"
                      onClick={() => {
                        setOverflowOpen(false);
                        void resendMutation.mutate({ id: tenant.id });
                      }}
                    >
                      {opsCopy.hub.overflow.resend}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    className="ops-menu-item"
                    onClick={() => {
                      setOverflowOpen(false);
                      setRotateOpen(true);
                    }}
                  >
                    {opsCopy.hub.overflow.rotate}
                  </button>
                  {tenant.status === PlatformTenantStatus.ACTIVE ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="ops-menu-item"
                      onClick={() => {
                        setOverflowOpen(false);
                        setTargetStatus(PlatformTenantStatus.SUSPENDED);
                        setStatusDialogOpen(true);
                      }}
                    >
                      {opsCopy.hub.overflow.suspend}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    className="ops-menu-item"
                    onClick={() => {
                      setOverflowOpen(false);
                      setManageOpen(true);
                    }}
                  >
                    {platformCopy.tenants.detail.actions.manageSubscription}
                  </button>
                </div>
              ) : null}
            </>
          ) : undefined
        }
      />
      {!canMutate ? (
        <OpsAlert tone="notice">{opsCopy.tenants.readOnly}</OpsAlert>
      ) : null}

      <div
        className="ops-border flex flex-wrap gap-0 border-b"
        role="tablist"
        aria-label="Hub"
      >
        {(
          [
            [TAB.resumen, tabs.resumen],
            [TAB.suscripcion, tabs.suscripcion],
            [TAB.uso, tabs.uso],
            [TAB.cobranza, tabs.cobranza],
            [TAB.activacion, tabs.activacion],
            [TAB.auditoria, tabs.auditoria],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            className="ops-tab"
            data-active={activeTab === value}
            aria-selected={activeTab === value}
            onClick={() => setActiveTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {activeTab === TAB.resumen ? (
          <>
            <OpsTenantHealthPanel health={health} />
            <OpsTenantUsagePanel
              tenantId={tenant.id}
              planName={tenant.planName}
            />
          </>
        ) : null}
        {activeTab === TAB.suscripcion ? (
          <OpsTenantSubscriptionPanel tenantId={tenant.id} />
        ) : null}
        {activeTab === TAB.uso ? (
          <OpsTenantUsagePanel
            tenantId={tenant.id}
            planName={tenant.planName}
            canExport={canMutate}
          />
        ) : null}
        {activeTab === TAB.cobranza ? (
          <OpsTenantSaasArPanel tenantId={tenant.id} canMutate={canMutate} />
        ) : null}
        {activeTab === TAB.activacion ? (
          <OpsTenantActivationPanel
            tenantId={tenant.id}
            activation={tenant.adminActivation}
            canMutate={canMutate}
          />
        ) : null}
        {activeTab === TAB.auditoria ? (
          <OpsTenantActivityPanel tenantId={tenant.id} />
        ) : null}
      </div>

      <OpsManageSubscriptionSheet
        open={manageOpen}
        onOpenChange={setManageOpen}
        tenant={tenant}
      />
      <RotateAdminCredentialsDialog
        open={rotateOpen}
        onOpenChange={setRotateOpen}
        tenantId={tenant.id}
      />
      <OpsSuspendTenantDialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          setStatusDialogOpen(open);
          if (!open) setTargetStatus(null);
        }}
        tenant={tenant}
        targetStatus={targetStatus}
        urgePayment={
          targetStatus === PlatformTenantStatus.ACTIVE &&
          (subscriptionStatus === "past_due" || hasOpenInvoices)
        }
        onRegisterPayment={openRegisterPayment}
      />
      <OpsRegisterPaymentSheet
        tenantId={tenant.id}
        tenantLabel={tenant.name}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
      <OpsChangePlanSheet
        tenant={tenant}
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        initialPlanCode={previewPlanCode}
      />
      <OpsAttachAddonSheet
        tenant={tenant}
        open={attachOpen}
        onOpenChange={setAttachOpen}
        initialModuleCode={previewModuleCode}
      />
    </div>
  );
}
