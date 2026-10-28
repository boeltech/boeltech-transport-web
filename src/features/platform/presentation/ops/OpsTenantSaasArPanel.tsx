import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { useToast } from "@shared/hooks";
import {
  isSaasStripeNotConfiguredError,
  isStripePublishableConfigured,
} from "@features/billing";
import type { PlatformSaasInvoice } from "../../domain/entities";
import {
  useIssueSaasInvoiceDraft,
  usePlatformArChargeRun,
  usePlatformArCloseRun,
  usePlatformTenantPaymentMethods,
  usePlatformTenantSaasInvoices,
} from "../../application/hooks/usePlatformSaasAr";
import { platformApi } from "../../infrastructure/platformApi";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPeriodKey } from "../utils/platformBillingFormatters";
import {
  getLastClosedMexicoCityPeriodKey,
  isClosedBillingPeriodKey,
  isPeriodKeyInLastMonths,
  isValidBillingPeriodKey,
  resolveClosedPeriodKeyForCloseRun,
} from "../utils/billingPeriod";
import { formatDate } from "@shared/utils/dateUtils";
import { OpsIssueSaasInvoiceSheet } from "./OpsIssueSaasInvoiceSheet";
import { OpsMarkSaasInvoicePaidSheet } from "./OpsMarkSaasInvoicePaidSheet";
import { OpsChargeSaasInvoiceStripeSheet } from "./OpsChargeSaasInvoiceStripeSheet";
import { OpsVoidSaasInvoiceDialog } from "./OpsVoidSaasInvoiceDialog";
import { resolveAutoChargeChip } from "../utils/autoChargeChip";
import { OpsArRowActions } from "./OpsArRowActions";
import {
  OpsArStatusCluster,
  OpsMoneyAmount,
  OpsMoneyTable,
  OpsMoneyTableBody,
  OpsMoneyTableCell,
  OpsMoneyTableHead,
  OpsMoneyTableHeader,
  OpsMoneyTableRow,
} from "./patterns/OpsMoneyTable";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsBadge } from "./ui/OpsBadge";
import { OpsButton } from "./ui/OpsButton";
import { OpsInput } from "./ui/OpsInput";
import { OpsPanel, OpsPanelBody } from "./ui/OpsPanel";

interface OpsTenantSaasArPanelProps {
  tenantId: string;
  tenantLabel?: string;
  canMutate: boolean;
  canExport?: boolean;
}

function lastPaymentMethodLabel(invoice: PlatformSaasInvoice): string {
  if (invoice.status !== "paid" && invoice.status !== "void") {
    return "—";
  }
  const method = invoice.lastPayment?.method;
  if (!method) return "—";
  return platformCopy.ar.markPaid.methods[method] ?? "—";
}

/**
 * Hub Cobranza Money (flag ON). Fork de TenantSaasArCard — Conform intacta (DS-D5).
 */
export function OpsTenantSaasArPanel({
  tenantId,
  tenantLabel,
  canMutate,
  canExport = true,
}: OpsTenantSaasArPanelProps) {
  const copy = platformCopy.ar;
  const { toast } = useToast();
  const lastClosed = getLastClosedMexicoCityPeriodKey();
  const [closePeriodKey, setClosePeriodKey] = useState(lastClosed);
  const { data: invoices = [], isLoading } =
    usePlatformTenantSaasInvoices(tenantId);
  const closePeriodForRun = resolveClosedPeriodKeyForCloseRun(closePeriodKey);
  const closeRunQuery = usePlatformArCloseRun({
    periodKey: closePeriodForRun,
    tenantId,
    include: "all",
    page: 1,
    pageSize: 25,
  });
  const chargeRunQuery = usePlatformArChargeRun({
    tenantId,
    page: 1,
    pageSize: 25,
  });
  const chargeAttempts = chargeRunQuery.data?.data.latestAttempts ?? [];
  const chargeRunItems = chargeRunQuery.data?.data.items ?? [];
  const closeRunItem = closeRunQuery.data?.data.items[0] ?? null;
  const isPolicySkip = closeRunItem?.skipGroup === "policy";
  const hasNonVoidForPeriod = invoices.some(
    (invoice) =>
      invoice.periodKey === closePeriodForRun && invoice.status !== "void",
  );
  const showIssueCta =
    canMutate &&
    !closeRunQuery.isLoading &&
    !isPolicySkip &&
    !hasNonVoidForPeriod &&
    !closeRunItem?.nonVoidInvoiceId &&
    (closeRunItem
      ? closeRunItem.canIssueOverride && closeRunItem.hasFrozenAmount
      : true);
  const viewArHref =
    closeRunItem?.skipGroup === "actionable"
      ? `/platform/billing/ar?view=exceptions&tenant_id=${tenantId}`
      : `/platform/billing/ar?tenant_id=${tenantId}&view=all`;

  const stripeConfigured = isStripePublishableConfigured();
  const [stripeGatewayDown, setStripeGatewayDown] = useState(false);
  const canUseStripe = canMutate && stripeConfigured && !stripeGatewayDown;

  const paymentMethods = usePlatformTenantPaymentMethods(tenantId, {
    enabled: canUseStripe,
  });

  useEffect(() => {
    if (
      paymentMethods.isError &&
      isSaasStripeNotConfiguredError(paymentMethods.error)
    ) {
      setStripeGatewayDown(true);
    }
  }, [paymentMethods.isError, paymentMethods.error]);

  const defaultPm = useMemo(() => {
    const items = paymentMethods.data ?? [];
    return items.find((pm) => pm.isDefault) ?? null;
  }, [paymentMethods.data]);

  const hasDefaultPaymentMethod = Boolean(defaultPm);

  const [issueOpen, setIssueOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [payInvoice, setPayInvoice] = useState<PlatformSaasInvoice | null>(
    null,
  );
  const [chargeInvoice, setChargeInvoice] =
    useState<PlatformSaasInvoice | null>(null);
  const [voidInvoice, setVoidInvoice] = useState<PlatformSaasInvoice | null>(
    null,
  );
  const [issuingDraftId, setIssuingDraftId] = useState<string | null>(null);

  const issueDraftMutation = useIssueSaasInvoiceDraft({
    onSuccess: () => {
      toast({
        title: copy.actions.issueDraftSuccess,
        variant: "success",
      });
      setIssuingDraftId(null);
    },
    onError: (error) => {
      toast({
        title: copy.actions.issueDraftError,
        description: error.message,
        variant: "error",
      });
      setIssuingDraftId(null);
    },
  });

  const openCount = useMemo(
    () => invoices.filter((i) => i.status === "open").length,
    [invoices],
  );
  const visibleInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.status === "open" ||
          invoice.status === "draft" ||
          isPeriodKeyInLastMonths(invoice.periodKey, 12),
      ),
    [invoices],
  );

  const handleIssueDraft = (invoice: PlatformSaasInvoice) => {
    setIssuingDraftId(invoice.id);
    void issueDraftMutation.mutateAsync({
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
    });
  };

  const handleExportClose = async () => {
    const periodKey = closePeriodKey.trim();
    if (!isValidBillingPeriodKey(periodKey)) {
      toast({
        title: copy.card.exportCloseError,
        description: copy.card.exportCloseInvalidPeriod,
        variant: "destructive",
      });
      return;
    }
    if (!isClosedBillingPeriodKey(periodKey)) {
      toast({
        title: copy.card.exportCloseError,
        description: copy.card.exportCloseNotClosed,
        variant: "destructive",
      });
      return;
    }
    setExporting(true);
    try {
      await platformApi.downloadTenantReconciliationCsv(tenantId, periodKey);
      toast({ title: copy.card.exportCloseSuccess, variant: "success" });
    } catch (error) {
      toast({
        title: copy.card.exportCloseError,
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div id="tenant-saas-ar" data-testid="ops-tenant-saas-ar" className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="ops-panel-title">{copy.card.title}</h2>
            <p className="ops-panel-description">{copy.card.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {openCount > 0 ? (
                <OpsBadge tone="warn">{copy.card.openBadge(openCount)}</OpsBadge>
              ) : null}
              {canUseStripe ? (
                paymentMethods.isLoading ? (
                  <OpsBadge tone="muted">{copy.card.cardLoading}</OpsBadge>
                ) : hasDefaultPaymentMethod && defaultPm?.last4 ? (
                  <OpsBadge tone="muted">
                    {copy.card.cardOnFile(defaultPm.last4)}
                  </OpsBadge>
                ) : (
                  <OpsBadge tone="muted">{copy.card.cardMissing}</OpsBadge>
                )
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <OpsButton variant="ghost" size="sm" asChild>
              <Link to={viewArHref}>{copy.card.viewAll}</Link>
            </OpsButton>
            {showIssueCta ? (
              <OpsButton
                size="sm"
                variant="primary"
                onClick={() => setIssueOpen(true)}
              >
                {copy.actions.issue}
              </OpsButton>
            ) : null}
          </div>
        </div>

        {closeRunItem ? (
          <OpsPanel
            className={
              isPolicySkip ? undefined : "ops-bg-warn-soft"
            }
            data-testid="ops-ar-skip-banner"
          >
            <OpsPanelBody>
              <p className="ops-type-body font-medium ops-text">
                {isPolicySkip
                  ? copy.card.skipBannerPolicy
                  : copy.card.skipBannerTitle}
              </p>
              <p className="mt-1 ops-type-caption ops-text-muted">
                {copy.skipReasons[closeRunItem.skipReason]}
              </p>
            </OpsPanelBody>
          </OpsPanel>
        ) : null}

        {canExport ? (
          <div className="ops-hairline ops-rounded px-3 py-3 space-y-2">
            <div>
              <p className="ops-type-caption font-medium ops-text">
                {copy.card.closeExportTitle}
              </p>
              <p className="mt-0.5 ops-type-caption ops-text-muted">
                {copy.card.closeExportDescription}
              </p>
            </div>
            <div className="ops-money-toolbar">
              <div className="ops-money-filter-field">
                <label
                  className="ops-label"
                  htmlFor={`ops-close-period-${tenantId}`}
                >
                  {copy.card.closePeriodLabel}
                </label>
                <OpsInput
                  id={`ops-close-period-${tenantId}`}
                  className="w-[130px]"
                  placeholder={copy.card.closePeriodPlaceholder}
                  value={closePeriodKey}
                  onChange={(e) => setClosePeriodKey(e.target.value)}
                />
              </div>
              <OpsButton
                type="button"
                variant="ghost"
                size="sm"
                disabled={exporting}
                onClick={() => void handleExportClose()}
              >
                <Download className="h-3.5 w-3.5" />
                {copy.card.exportClose}
              </OpsButton>
            </div>
          </div>
        ) : null}

        {canUseStripe &&
        !paymentMethods.isLoading &&
        !hasDefaultPaymentMethod &&
        openCount > 0 ? (
          <p className="ops-type-caption ops-text-muted">
            {copy.card.chargeNeedsCard}
          </p>
        ) : null}

        {isLoading ? (
          <OpsEmptyState variant="loading" title={copy.card.loading} panel />
        ) : visibleInvoices.length === 0 ? (
          <OpsEmptyState
            title={copy.card.emptyTitle}
            description={copy.card.empty}
          />
        ) : (
          <OpsMoneyTable>
            <OpsMoneyTableHeader>
              <OpsMoneyTableRow>
                <OpsMoneyTableHead>{copy.columns.period}</OpsMoneyTableHead>
                <OpsMoneyTableHead>{copy.columns.status}</OpsMoneyTableHead>
                <OpsMoneyTableHead>{copy.columns.total}</OpsMoneyTableHead>
                <OpsMoneyTableHead>
                  {copy.columns.dueAndOverdue}
                </OpsMoneyTableHead>
                <OpsMoneyTableHead>{copy.columns.method}</OpsMoneyTableHead>
                {canMutate ? (
                  <OpsMoneyTableHead>{copy.columns.actions}</OpsMoneyTableHead>
                ) : null}
              </OpsMoneyTableRow>
            </OpsMoneyTableHeader>
            <OpsMoneyTableBody>
              {visibleInvoices.map((invoice) => {
                const isDueStatus =
                  invoice.status === "open" || invoice.status === "draft";
                const isOverdue = isDueStatus && invoice.daysOverdue > 0;
                const showCharge =
                  canUseStripe &&
                  hasDefaultPaymentMethod &&
                  invoice.status === "open";
                return (
                  <OpsMoneyTableRow
                    key={invoice.id}
                    data-ops-tick={isOverdue ? "warn" : undefined}
                  >
                    <OpsMoneyTableCell>
                      {formatBillingPeriodKey(invoice.periodKey)}
                    </OpsMoneyTableCell>
                    <OpsMoneyTableCell>
                      <OpsArStatusCluster
                        status={invoice.status}
                        origin={invoice.origin}
                        chargeKind={resolveAutoChargeChip({
                          invoiceId: invoice.id,
                          latestAttempts: chargeAttempts,
                          runItems: chargeRunItems,
                        })}
                      />
                    </OpsMoneyTableCell>
                    <OpsMoneyTableCell>
                      <OpsMoneyAmount cents={invoice.totalCents} />
                    </OpsMoneyTableCell>
                    <OpsMoneyTableCell>
                      {invoice.status === "paid" ? (
                        <span>
                          {copy.card.paidCaption}{" "}
                          {invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
                        </span>
                      ) : invoice.status === "void" ? (
                        <span>—</span>
                      ) : (
                        <span>
                          {invoice.dueDate
                            ? formatDate(invoice.dueDate)
                            : "—"}
                        </span>
                      )}
                    </OpsMoneyTableCell>
                    <OpsMoneyTableCell>
                      {lastPaymentMethodLabel(invoice)}
                    </OpsMoneyTableCell>
                    {canMutate ? (
                      <OpsMoneyTableCell>
                        {invoice.status === "draft" ? (
                          <OpsArRowActions
                            isDraft
                            onIssueDraft={() => handleIssueDraft(invoice)}
                            issueDraftPending={
                              issuingDraftId === invoice.id &&
                              issueDraftMutation.isPending
                            }
                          />
                        ) : invoice.status === "open" ? (
                          <OpsArRowActions
                            canChargeStripe={showCharge}
                            onCharge={() => setChargeInvoice(invoice)}
                            onMarkPaid={() => setPayInvoice(invoice)}
                            onVoid={() => setVoidInvoice(invoice)}
                          />
                        ) : null}
                      </OpsMoneyTableCell>
                    ) : null}
                  </OpsMoneyTableRow>
                );
              })}
            </OpsMoneyTableBody>
          </OpsMoneyTable>
        )}
      </div>

      <OpsIssueSaasInvoiceSheet
        tenantId={tenantId}
        tenantLabel={tenantLabel}
        open={issueOpen}
        onOpenChange={setIssueOpen}
        defaultPeriodKey={
          isValidBillingPeriodKey(closePeriodKey.trim()) &&
          isClosedBillingPeriodKey(closePeriodKey.trim())
            ? closePeriodKey.trim()
            : lastClosed
        }
      />
      <OpsMarkSaasInvoicePaidSheet
        invoice={payInvoice}
        open={!!payInvoice}
        onOpenChange={(open) => {
          if (!open) setPayInvoice(null);
        }}
      />
      <OpsChargeSaasInvoiceStripeSheet
        invoice={chargeInvoice}
        open={!!chargeInvoice}
        onOpenChange={(open) => {
          if (!open) setChargeInvoice(null);
        }}
        onGatewayUnavailable={() => setStripeGatewayDown(true)}
      />
      <OpsVoidSaasInvoiceDialog
        invoice={voidInvoice}
        open={!!voidInvoice}
        onOpenChange={(open) => {
          if (!open) setVoidInvoice(null);
        }}
      />
    </>
  );
}
