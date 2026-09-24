import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { EmptyState } from "@shared/ui/feedback-states";
import { AlertWithIcon } from "@shared/ui/alert";
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
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/platformBillingFormatters";
import {
  getLastClosedMexicoCityPeriodKey,
  isClosedBillingPeriodKey,
  isValidBillingPeriodKey,
  resolveClosedPeriodKeyForCloseRun,
} from "../utils/billingPeriod";
import { formatDate } from "@shared/utils/dateUtils";
import { IssueSaasInvoiceSheet } from "./IssueSaasInvoiceSheet";
import { MarkSaasInvoicePaidSheet } from "./MarkSaasInvoicePaidSheet";
import { ChargeSaasInvoiceStripeSheet } from "./ChargeSaasInvoiceStripeSheet";
import { VoidSaasInvoiceDialog } from "./VoidSaasInvoiceDialog";
import { PlatformArRowActions } from "./PlatformArRowActions";
import { SaasInvoiceOriginBadge } from "./SaasInvoiceOriginBadge";
import { SaasAutoChargeChip } from "./SaasAutoChargeChip";
import { resolveAutoChargeChip } from "../utils/autoChargeChip";

interface TenantSaasArCardProps {
  tenantId: string;
  tenantLabel?: string;
  canMutate: boolean;
  /** Export CSV cierre (owner + support). Default true. */
  canExport?: boolean;
}

export function TenantSaasArCard({
  tenantId,
  tenantLabel,
  canMutate,
  canExport = true,
}: TenantSaasArCardProps) {
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
      : `/platform/billing/ar?status=open&tenant_id=${tenantId}`;

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
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">{copy.card.title}</CardTitle>
            <CardDescription className="mt-1">
              {copy.card.description}
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              {openCount > 0 ? (
                <Badge tone="soft" variant="warning">
                  {copy.card.openBadge(openCount)}
                </Badge>
              ) : null}
              {canUseStripe ? (
                paymentMethods.isLoading ? (
                  <Badge tone="soft" variant="secondary">
                    {copy.card.cardLoading}
                  </Badge>
                ) : hasDefaultPaymentMethod && defaultPm?.last4 ? (
                  <Badge tone="soft" variant="secondary">
                    {copy.card.cardOnFile(defaultPm.last4)}
                  </Badge>
                ) : (
                  <Badge tone="soft" variant="secondary">
                    {copy.card.cardMissing}
                  </Badge>
                )
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={viewArHref}>{copy.actions.viewAr}</Link>
            </Button>
            {showIssueCta ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => setIssueOpen(true)}
              >
                {copy.actions.issue}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {closeRunItem ? (
            <AlertWithIcon
              variant={isPolicySkip ? "info" : "warning"}
              title={
                isPolicySkip
                  ? copy.card.skipBannerPolicy
                  : copy.card.skipBannerTitle
              }
            >
              {copy.skipReasons[closeRunItem.skipReason]}
            </AlertWithIcon>
          ) : null}

          {canExport ? (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">{copy.card.closeExportTitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {copy.card.closeExportDescription}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`close-period-${tenantId}`}>
                    {copy.card.closePeriodLabel}
                  </Label>
                  <Input
                    id={`close-period-${tenantId}`}
                    className="w-[130px]"
                    placeholder={copy.card.closePeriodPlaceholder}
                    value={closePeriodKey}
                    onChange={(e) => setClosePeriodKey(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={exporting}
                  onClick={() => void handleExportClose()}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {copy.card.exportClose}
                </Button>
              </div>
            </div>
          ) : null}

          {canUseStripe &&
          !paymentMethods.isLoading &&
          !hasDefaultPaymentMethod &&
          openCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {copy.card.chargeNeedsCard}
            </p>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">{copy.card.loading}</p>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-10 w-10" />}
              title={copy.card.emptyTitle}
              description={copy.card.empty}
              size="sm"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.columns.period}</TableHead>
                  <TableHead>{copy.columns.status}</TableHead>
                  <TableHead>{copy.columns.total}</TableHead>
                  <TableHead>{copy.columns.dueAndOverdue}</TableHead>
                  {canMutate ? (
                    <TableHead>{copy.columns.actions}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const isOverdue =
                    invoice.status === "open" && invoice.daysOverdue > 0;
                  const showCharge =
                    canUseStripe &&
                    hasDefaultPaymentMethod &&
                    invoice.status === "open";
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {formatBillingPeriodKey(invoice.periodKey)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            tone="soft"
                            variant={
                              invoice.status === "open"
                                ? "warning"
                                : invoice.status === "paid"
                                  ? "success"
                                  : "secondary"
                            }
                          >
                            {copy.status[invoice.status]}
                          </Badge>
                          <SaasInvoiceOriginBadge origin={invoice.origin} />
                          <SaasAutoChargeChip
                            kind={resolveAutoChargeChip({
                              invoiceId: invoice.id,
                              latestAttempts: chargeAttempts,
                              runItems: chargeRunItems,
                            })}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatBillingPriceCents(invoice.totalCents)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>
                            {invoice.dueDate
                              ? formatDate(invoice.dueDate)
                              : "—"}
                          </span>
                          {isOverdue ? (
                            <Badge
                              tone="soft"
                              variant="warning"
                              className="w-fit"
                            >
                              {copy.card.daysOverdue(invoice.daysOverdue)}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      {canMutate ? (
                        <TableCell>
                          {invoice.status === "draft" ? (
                            <PlatformArRowActions
                              variant="buttons"
                              isDraft
                              onIssueDraft={() => handleIssueDraft(invoice)}
                              issueDraftPending={
                                issuingDraftId === invoice.id &&
                                issueDraftMutation.isPending
                              }
                            />
                          ) : invoice.status === "open" ? (
                            <PlatformArRowActions
                              variant="buttons"
                              canChargeStripe={showCharge}
                              onCharge={() => setChargeInvoice(invoice)}
                              onMarkPaid={() => setPayInvoice(invoice)}
                              onVoid={() => setVoidInvoice(invoice)}
                            />
                          ) : null}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <IssueSaasInvoiceSheet
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
      <MarkSaasInvoicePaidSheet
        invoice={payInvoice}
        open={!!payInvoice}
        onOpenChange={(open) => {
          if (!open) setPayInvoice(null);
        }}
      />
      <ChargeSaasInvoiceStripeSheet
        invoice={chargeInvoice}
        open={!!chargeInvoice}
        onOpenChange={(open) => {
          if (!open) setChargeInvoice(null);
        }}
        onGatewayUnavailable={() => setStripeGatewayDown(true)}
      />
      <VoidSaasInvoiceDialog
        invoice={voidInvoice}
        open={!!voidInvoice}
        onOpenChange={(open) => {
          if (!open) setVoidInvoice(null);
        }}
      />
    </>
  );
}
