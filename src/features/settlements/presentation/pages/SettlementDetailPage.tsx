import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Banknote,
  Route,
  Printer,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  History,
  Pencil,
  Send,
} from "lucide-react";
import { DetailPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { usePrintIframe, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";

import { useSettlementDetail } from "../../application/hooks";
import { useSubmitSettlement } from "../../application/hooks/useSettlements";
import { settlementCreatePath, settlementDetailPath } from "../../application/settlementsRoutes";
import { useAuth } from "@features/auth";
import {
  resolveApprovalActionUi,
  showsSelfApprovedBadge,
} from "@features/approvals/domain";
import { useSelfApprovalPolicy } from "@features/approvals/application";
import {
  ApprovalFlowLines,
  ApprovalHistorySheet,
  ReturnedAlert,
  SelfApprovedBadge,
} from "@features/approvals/presentation/components";
import { Alert, AlertDescription } from "@shared/ui/alert";
import {
  useCompanyLogoObjectUrl,
  useCompanySettings,
} from "@features/settings/application";
import { resolveCompanyLogoSrc } from "@features/settings/presentation/components";
import {
  SettlementStatusBadge,
  SettlementItemsTable,
  SettlementReceiptPrintView,
  SettlementActions,
  SettlementCorrectionSheet,
  SettlementKindBadge,
  LateReimbursementsAlert,
  SettlementPaymentFormula,
  SettlementTripsRuleTable,
  SettlementDetailInspector,
} from "../components";
import { MissingDataAckGate } from "../components/MissingDataAckGate";
import { ReimbursementsAckGate } from "../components/ReimbursementsAckGate";
import { DetailAlertCard } from "@shared/ui/data-display";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  isReceiptSignable,
  isSettlementCorrectable,
  isSettlementReturned,
} from "../utils/settlementEditing";
import { isSettlementMaker } from "../utils/settlementCta";
import {
  resolveSettlementBackHref,
  resolveSettlementWayfindingBackLabel,
} from "../utils/settlementWayfinding";
import {
  COMPENSATION_CALCULATION_TYPE_LABELS,
  COMPENSATION_SALARY_PERIOD_LABELS,
  TRIP_ROUTE_TYPE_LABELS,
  DISBURSEMENT_METHOD_LABELS,
  type CompensationSalaryPeriod,
  type TripRouteType,
} from "../../domain/enums";
import type { AgreementSnapshot } from "../../domain/entities";
import { isDeductionsExceedGrossError } from "../utils/settlementDeductionCapacity";
import { isMissingDataAckRequiredError } from "../utils/settlementCreateConflicts";
import { missingDataGapsFromItems } from "../utils/missingDataGapsFromItems";

const copy = settlementsCopy;
const missingDataGateCopy = settlementsCopy.createPage.missingDataGate;

export function SettlementDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = location.state?.from as string | undefined;
  const backHref = resolveSettlementBackHref(fromState);
  const backLabel = resolveSettlementWayfindingBackLabel(backHref);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { triggerPrint, isPrinting } = usePrintIframe(printRef);

  useEffect(() => {
    if (printDialogOpen) {
      document.body.classList.add("print-receipt-active");
    } else {
      document.body.classList.remove("print-receipt-active");
    }
    return () => {
      document.body.classList.remove("print-receipt-active");
    };
  }, [printDialogOpen]);

  const { data: settlement, isLoading, refetch } = useSettlementDetail(id);

  const { user } = useAuth();
  const { data: selfApprovalPolicy } = useSelfApprovalPolicy();
  const { data: companySettings } = useCompanySettings();
  // Estable durante la sesión: solo se usa si el API no expone `updatedAt`.
  const [logoFallbackVersion] = useState(() => Date.now());
  const versionedLogoSrc = resolveCompanyLogoSrc(
    companySettings?.logoUrl,
    companySettings?.updatedAt,
    logoFallbackVersion,
  );
  const logoVersion =
    companySettings?.updatedAt?.getTime?.() ?? logoFallbackVersion;
  // Bearer no viaja en <img src>; object URL vía GET autenticado (misma pista que settings).
  const { logoSrc: receiptLogoSrc } = useCompanyLogoObjectUrl(
    Boolean(versionedLogoSrc),
    logoVersion,
  );
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");
  const canCreate = hasPermission("settlements", "create");
  const canReadApprovals = hasPermission("finance_approvals", "read");
  const submitMutation = useSubmitSettlement();
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [acknowledgeMissingData, setAcknowledgeMissingData] = useState(false);
  const [missingDataAckError, setMissingDataAckError] = useState(false);
  const [acknowledgeReimbursements, setAcknowledgeReimbursements] = useState(false);
  const [reimbursementsAckError, setReimbursementsAckError] = useState(false);

  const isReturned = settlement ? isSettlementReturned(settlement) : false;
  const canCorrect = Boolean(
    settlement && canUpdate && isSettlementCorrectable(settlement.status),
  );
  const receiptSignable = settlement ? isReceiptSignable(settlement.status) : false;
  const receiptDialogCopy = copy.detailPage.receiptDialog;
  const receiptDialogMode = !settlement
    ? null
    : !receiptSignable
      ? {
          title: receiptDialogCopy.previewTitle,
          description: receiptDialogCopy.previewDescription,
        }
      : settlement.status === "disbursed"
        ? {
            title: receiptDialogCopy.paidTitle,
            description: receiptDialogCopy.paidDescription,
          }
        : {
            title: receiptDialogCopy.signableTitle,
            description: receiptDialogCopy.signableDescription,
          };
  const flowCopy = copy.settlementFlow;
  const missingDataGaps = useMemo(
    () => missingDataGapsFromItems(settlement?.items),
    [settlement?.items],
  );
  const hasMissingDataGaps = missingDataGaps.length > 0;
  const returnedReimbursements = settlement?.totalReimbursableExpenses ?? 0;
  const hasReturnedReimbursements = returnedReimbursements > 0;
  const resubmitAckBlocked =
    (hasMissingDataGaps && !acknowledgeMissingData) ||
    (hasReturnedReimbursements && !acknowledgeReimbursements);

  const handleResubmitUnchanged = async () => {
    if (!settlement) return;
    if (resubmitAckBlocked) {
      if (hasReturnedReimbursements && !acknowledgeReimbursements) {
        setReimbursementsAckError(true);
      }
      if (hasMissingDataGaps && !acknowledgeMissingData) {
        setMissingDataAckError(true);
      }
      return;
    }
    try {
      const vars =
        hasMissingDataGaps && acknowledgeMissingData
          ? {
              id: settlement.id,
              acknowledgeZeroKmTrips: true,
              acknowledgeZeroFreightTrips: true,
            }
          : settlement.id;
      await submitMutation.mutateAsync(vars);
      setAcknowledgeMissingData(false);
      setMissingDataAckError(false);
      setAcknowledgeReimbursements(false);
      setReimbursementsAckError(false);
      toast({ title: flowCopy.toasts.resubmitted, variant: "success" });
      void refetch();
    } catch (error) {
      if (isMissingDataAckRequiredError(error)) {
        setAcknowledgeMissingData(false);
        setMissingDataAckError(true);
        toast({
          title: copy.toasts.submitSettlementError,
          description: missingDataGateCopy.serverAckRequired,
          variant: "error",
        });
        return;
      }
      const exceedsGross = isDeductionsExceedGrossError(error);
      toast({
        title: exceedsGross
          ? flowCopy.deductionsCap.actionErrorTitle
          : copy.toasts.submitSettlementError,
        description: getErrorMessage(error),
        variant: exceedsGross ? "error" : "destructive",
      });
    }
  };

  const dCopy = copy.detailPage;

  const companyDisplayName =
    companySettings?.legalName ||
    companySettings?.tradeName ||
    user?.tenant?.name ||
    dCopy.fallbacks.companyName;

  const companyRfc = companySettings?.rfc || undefined;

  const handlePrint = () => {
    const folio =
      settlement?.settlementNumber || dCopy.fallbacks.paymentTitle;
    triggerPrint(dCopy.receiptDialog.printDocumentTitle(folio));
  };

  const agreement = settlement?.agreementSnapshot as AgreementSnapshot | undefined;
  const isComposite = Boolean(
    agreement?.hasFixedSalary ||
      (agreement?.rules && agreement.rules.length > 0),
  );

  const rawCalcType = agreement?.calculationType;
  const calculationTypeLabel = isComposite
    ? dCopy.tariff.compositeLabel
    : rawCalcType
      ? COMPENSATION_CALCULATION_TYPE_LABELS[rawCalcType] ?? String(rawCalcType)
      : dCopy.fallbacks.noAgreement;
  const isReimbursementOnly = settlement?.settlementKind === "reimbursement_only";
  /** Rearmar tras rechazo o cancelación: mismo operador y, en pagos normales, mismas fechas. */
  const rebuildPath = settlement
    ? isReimbursementOnly
      ? settlementCreatePath({
          kind: "reimbursements",
          employeeId: settlement.employeeId,
          from: settlement.id,
        })
      : settlementCreatePath({
          employeeId: settlement.employeeId,
          periodStart: settlement.periodStart,
          periodEnd: settlement.periodEnd,
          from: settlement.id,
        })
    : "";
  const expandItemsByDefault =
    settlement?.status === "draft" || settlement?.status === "rejected";
  const isDisbursed = settlement?.status === "disbursed";

  const selfApproveUi =
    settlement && settlement.status === "pending_approval" && canUpdate
      ? resolveApprovalActionUi(settlement.approval, {
          isOwn: isSettlementMaker(settlement, user?.id),
          selfPolicy: selfApprovalPolicy?.settlementApprove,
          canDecide: canUpdate,
          isPending: true,
          userId: user?.id,
        })
      : null;
  const showSelfConfirmNotice =
    selfApproveUi?.kind === "act" && selfApproveUi.selfConfirm;
  const showOwnBlockedNotice = selfApproveUi?.kind === "own_blocked";

  return (
    <>
      <DetailPageShell
        isLoading={isLoading}
        notFound={!settlement}
        notFoundConfig={{
          icon: <Banknote className="h-8 w-8 text-muted-foreground" />,
          title: dCopy.notFound.title,
          description: dCopy.notFound.description,
          backHref,
          backLabel,
        }}
        header={{
          backHref,
          backLabel,
          icon: <Banknote className="h-6 w-6" />,
          title: settlement ? (
            <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
              <span className="shrink-0">{settlement.settlementNumber}</span>
              <SettlementStatusBadge
                status={settlement.status}
                showIcon
                size="sm"
              />
              <SettlementKindBadge kind={settlement.settlementKind} />
            </span>
          ) : (
            dCopy.fallbacks.paymentTitle
          ),
          subtitle: settlement ? (
            <div className="space-y-0.5">
              <p className="truncate text-sm text-muted-foreground">
                {settlement.employeeFullName ?? "—"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {isReimbursementOnly ? (
                  copy.reimbursements.detail.subtitle(formatDate(settlement.createdAt))
                ) : (
                  <>
                    {formatDate(settlement.periodStart)} –{" "}
                    {formatDate(settlement.periodEnd)}
                  </>
                )}
              </p>
            </div>
          ) : undefined,
          actions: settlement ? (
            <SettlementActions
              variant="buttons"
              settlement={settlement}
              onReceiptClick={() => setPrintDialogOpen(true)}
              onCorrect={() => setCorrectionOpen(true)}
              onOpenHistory={() => setHistoryOpen(true)}
              onActionComplete={() => {
                void refetch();
              }}
            />
          ) : undefined,
        }}
      >
        {settlement && (
          <div className="space-y-6">
            {isReturned ? (
              <div className="space-y-3">
                {canUpdate && (hasReturnedReimbursements || hasMissingDataGaps) ? (
                  <div className="space-y-2">
                    <ReimbursementsAckGate
                      amount={returnedReimbursements}
                      acknowledged={acknowledgeReimbursements}
                      onAcknowledgedChange={(value) => {
                        setAcknowledgeReimbursements(value);
                        if (value) setReimbursementsAckError(false);
                      }}
                      errorMessage={
                        reimbursementsAckError
                          ? copy.createPage.reimbursementsAckGate.submitBlockedHint
                          : null
                      }
                      checkboxId="acknowledge-reimbursements-detail"
                    />
                    <MissingDataAckGate
                      gaps={missingDataGaps}
                      acknowledged={acknowledgeMissingData}
                      onAcknowledgedChange={(value) => {
                        setAcknowledgeMissingData(value);
                        if (value) setMissingDataAckError(false);
                      }}
                      errorMessage={
                        missingDataAckError ? missingDataGateCopy.submitBlockedHint : null
                      }
                      checkboxId="acknowledge-missing-data-detail"
                    />
                  </div>
                ) : null}
                <ReturnedAlert
                  approval={settlement.approval}
                  action={
                    canUpdate ? (
                      <>
                        {canCorrect ? (
                          <Button size="sm" onClick={() => setCorrectionOpen(true)}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            {flowCopy.returnedAlert.correctAndResubmit}
                          </Button>
                        ) : null}
                        <div className="flex flex-col items-start gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submitMutation.isPending || resubmitAckBlocked}
                            onClick={() => void handleResubmitUnchanged()}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            {flowCopy.returnedAlert.resubmitUnchanged}
                          </Button>
                          {hasReturnedReimbursements && !acknowledgeReimbursements ? (
                            <p className="text-xs leading-snug text-warning">
                              {copy.createPage.reimbursementsAckGate.submitBlockedHint}
                            </p>
                          ) : hasMissingDataGaps && !acknowledgeMissingData ? (
                            <p className="text-xs leading-snug text-warning">
                              {missingDataGateCopy.submitBlockedHint}
                            </p>
                          ) : null}
                        </div>
                      </>
                    ) : undefined
                  }
                />
              </div>
            ) : null}

            <LateReimbursementsAlert settlement={settlement} canCreate={canCreate} />

            {settlement.status === "cancelled" ? (
              <div data-testid="settlement-cancelled-alert">
                <DetailAlertCard
                  severity="info"
                  icon={<AlertCircle className="h-5 w-5" aria-hidden />}
                  title={copy.reimbursements.cancelled.title}
                  action={
                    canCreate ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(rebuildPath)}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        {isReimbursementOnly
                          ? copy.reimbursements.createAction
                          : copy.reimbursements.cancelled.rebuildAction}
                      </Button>
                    ) : null
                  }
                >
                  <p>{copy.reimbursements.cancelled.body}</p>
                </DetailAlertCard>
              </div>
            ) : null}

            {settlement.status === "rejected" ? (
              <div data-testid="settlement-rejected-alert">
                <DetailAlertCard
                  severity="critical"
                  icon={<AlertCircle className="h-5 w-5" aria-hidden />}
                  title={dCopy.rejection.title}
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(rebuildPath)}
                      className="gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {dCopy.rejection.reopenDraftBtn}
                    </Button>
                  }
                >
                  <p>
                    <span className="font-medium text-foreground/80">
                      {dCopy.rejection.reasonLabel}{" "}
                    </span>
                    {settlement.rejectionReason || dCopy.rejection.reasonFallback}
                  </p>
                </DetailAlertCard>
              </div>
            ) : null}

            {/* C28: aviso R5 before Autorizar (above-the-fold). */}
            {showSelfConfirmNotice ? (
              <Alert data-testid="settlement-self-confirm-notice">
                <AlertDescription>{dCopy.selfConfirmNotice}</AlertDescription>
              </Alert>
            ) : null}
            {showOwnBlockedNotice ? (
              <Alert data-testid="settlement-own-blocked-notice">
                <AlertDescription>{dCopy.ownBlockedNotice}</AlertDescription>
              </Alert>
            ) : null}

            {/* C21: progreso Elaboró / Autorizó / Pagó arriba de la fórmula */}
            <Card data-testid="settlement-workflow-progress">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{dCopy.workflow.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <ol className="relative space-y-3 border-l border-border ml-1.5 pl-4 sm:flex sm:space-y-0 sm:border-l-0 sm:gap-6 sm:pl-0">
                  <li className="relative sm:flex-1">
                    <span
                      className={cn(
                        "absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-card sm:static sm:mb-1",
                        "border-success text-success",
                      )}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {dCopy.workflow.step1}
                    </p>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {settlement.submittedByName ?? settlement.createdByName ?? "—"}
                    </p>
                  </li>
                  <li className="relative sm:flex-1">
                    <span
                      className={cn(
                        "absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-card sm:static sm:mb-1",
                        settlement.approvedByName
                          ? "border-success text-success"
                          : settlement.status === "rejected"
                            ? "border-destructive text-destructive"
                            : "border-muted-foreground/40 text-muted-foreground",
                      )}
                    >
                      {settlement.approvedByName ? (
                        <Check className="h-2.5 w-2.5" />
                      ) : settlement.status === "rejected" ? (
                        <X className="h-2.5 w-2.5" />
                      ) : null}
                    </span>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {dCopy.workflow.step2}
                    </p>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {settlement.approvedByName ??
                        (settlement.status === "rejected"
                          ? dCopy.rejection.title
                          : dCopy.workflow.notApproved)}
                    </p>
                    {showsSelfApprovedBadge({
                      kind: "settlement",
                      status: settlement.status,
                      selfSegregatedApproval: settlement.selfSegregatedApproval,
                    }) ? (
                      <>
                        <div className="mt-1">
                          <SelfApprovedBadge />
                        </div>
                        <p className="mt-0.5 text-xs italic text-muted-foreground">
                          {settlement.approverCountAtApprove != null
                            ? dCopy.workflow.selfSegregatedApprovalCount(
                                settlement.approverCountAtApprove,
                              )
                            : dCopy.workflow.selfSegregatedApproval}
                        </p>
                      </>
                    ) : null}
                  </li>
                  <li className="relative sm:flex-1">
                    <span
                      className={cn(
                        "absolute -left-[21px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-card sm:static sm:mb-1",
                        settlement.disbursedByName
                          ? "border-success text-success"
                          : "border-muted-foreground/40 text-muted-foreground",
                      )}
                    >
                      {settlement.disbursedByName ? <Check className="h-2.5 w-2.5" /> : null}
                    </span>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {dCopy.workflow.step3}
                    </p>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {isDisbursed
                        ? (settlement.disbursedByName ?? "—")
                        : dCopy.workflow.notDisbursed}
                    </p>
                    {isDisbursed && settlement.selfSegregatedDisbursement ? (
                      <p className="mt-0.5 text-xs italic text-muted-foreground">
                        {settlement.executorCountAtDisburse != null
                          ? dCopy.workflow.selfSegregatedDisbursementCount(
                              settlement.executorCountAtDisburse,
                            )
                          : dCopy.workflow.selfSegregatedDisbursement}
                      </p>
                    ) : null}
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* F4: fórmula 5 términos above-the-fold (CA F4.7) */}
            <SettlementPaymentFormula settlement={settlement} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <SettlementTripsRuleTable
                  items={settlement.items ?? []}
                  tripLinkFrom={settlementDetailPath(settlement.id)}
                />

                {/* D3: desglose colapsable según estado */}
                <Collapsible defaultOpen={expandItemsByDefault} className="group">
                  <Card>
                    <CardHeader className="pb-3">
                      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {dCopy.items.title}
                          </CardTitle>
                          <CardDescription>{dCopy.items.subtitle}</CardDescription>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <span className="group-data-[state=open]:hidden">{dCopy.items.expandLabel}</span>
                          <span className="hidden group-data-[state=open]:inline">{dCopy.items.collapseLabel}</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                        </span>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent>
                        <SettlementItemsTable
                          items={settlement.items ?? []}
                          agreementCalculationType={settlement.agreementSnapshot.calculationType}
                          tripLinkFrom={settlementDetailPath(settlement.id)}
                          totals={settlement}
                        />
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {settlement.notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">
                        {dCopy.notes.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground bg-muted/20 p-3 rounded-lg border whitespace-pre-wrap">
                        {settlement.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-4 space-y-4">
                <SettlementDetailInspector settlement={settlement} />

                {(settlement.approval && !isReturned) || (canReadApprovals && settlement.approval) ? (
                  <Card>
                    <CardContent className="space-y-2 pt-4">
                      {settlement.approval && !isReturned ? (
                        <ApprovalFlowLines approval={settlement.approval} />
                      ) : null}
                      {canReadApprovals && settlement.approval ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto gap-1.5 px-0 text-xs"
                          onClick={() => setHistoryOpen(true)}
                        >
                          <History className="h-3.5 w-3.5" />
                          {flowCopy.header.history}
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}

                {/* D4: acuerdo terciario colapsado (un pago de reembolsos no tiene tarifa) */}
                {isReimbursementOnly ? null : (
                <Collapsible defaultOpen={false} className="group">
                  <Card className="bg-muted/15 border-dashed">
                    <CardHeader className="pb-2">
                      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left">
                        <div>
                          <CardTitle className="text-sm font-semibold">
                            {dCopy.tariff.title}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {dCopy.tariff.subtitle}
                          </CardDescription>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-3 text-xs pt-0">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{dCopy.tariff.scheme}</span>
                          <span className="font-semibold text-foreground">{calculationTypeLabel}</span>
                        </div>

                        {isComposite ? (
                          <div className="space-y-2 pt-2 border-t">
                            {Boolean(agreement?.hasFixedSalary) && (
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{dCopy.tariff.fixedSalary}</span>
                                <span className="font-semibold text-foreground tabular-nums">
                                  {formatMxCurrency(agreement?.fixedSalaryAmount ?? 0)}{" "}
                                  <span className="text-xs text-muted-foreground font-normal">
                                    ({COMPENSATION_SALARY_PERIOD_LABELS[agreement?.fixedSalaryPeriod as CompensationSalaryPeriod] ?? dCopy.fallbacks.weeklyPeriod})
                                  </span>
                                </span>
                              </div>
                            )}

                            {agreement?.rules && agreement.rules.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                  <Route className="h-3 w-3" /> {dCopy.tariff.routesTitle}
                                </span>
                                <div className="space-y-1">
                                  {agreement.rules.map((rule, idx) => {
                                    const routeLabel =
                                      TRIP_ROUTE_TYPE_LABELS[rule.routeType as TripRouteType] ??
                                      rule.routeType;
                                    let ruleText: string = dCopy.fallbacks.noCommission;
                                    if (rule.commissionType === "rate_per_km") {
                                      ruleText = `${formatMxCurrency(rule.rateValue)} / km`;
                                    } else if (rule.commissionType === "percentage_of_freight") {
                                      ruleText = `${rule.rateValue}% del flete`;
                                    } else if (rule.commissionType === "fixed_per_trip") {
                                      ruleText = `${formatMxCurrency(rule.rateValue)} por viaje`;
                                    }

                                    return (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center py-1 border-b border-border/50 last:border-b-0"
                                      >
                                        <span className="font-medium text-foreground">{routeLabel}:</span>
                                        <span className="text-foreground font-semibold tabular-nums">
                                          {ruleText}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1.5 pt-2 border-t">
                            {agreement?.ratePerKm ? (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{dCopy.tariff.ratePerKm}</span>
                                <span className="font-medium text-foreground">
                                  {formatMxCurrency(agreement.ratePerKm)} / km
                                </span>
                              </div>
                            ) : null}
                            {agreement?.percentageRate ? (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{dCopy.tariff.percentageRate}</span>
                                <span className="font-medium text-foreground">
                                  {agreement.percentageRate}%
                                </span>
                              </div>
                            ) : null}
                            {agreement?.baseRate ? (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{dCopy.tariff.fixedPerTrip}</span>
                                <span className="font-medium text-foreground">
                                  {formatMxCurrency(agreement.baseRate)}
                                </span>
                              </div>
                            ) : null}
                            {agreement?.helperDailyRate ? (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{dCopy.tariff.helperDailyRate}</span>
                                <span className="font-medium text-foreground">
                                  {formatMxCurrency(agreement.helperDailyRate)} / día
                                </span>
                              </div>
                            ) : null}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground italic pt-1 border-t border-dashed">
                          {dCopy.tariff.disclaimer}
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
                )}
              </div>
            </div>
          </div>
        )}
      </DetailPageShell>

      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 print:border-none print:shadow-none">
          <DialogHeader className="space-y-1.5 p-4 pr-12 text-left border-b print:hidden">
            <DialogTitle>
              {receiptDialogMode?.title ?? receiptDialogCopy.previewTitle}
            </DialogTitle>
            <DialogDescription>
              {receiptDialogMode?.description ?? receiptDialogCopy.previewDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted/10">
            {settlement && (
              <SettlementReceiptPrintView
                ref={printRef}
                settlement={settlement}
                companyName={companyDisplayName}
                rfc={companyRfc}
                logoSrc={receiptLogoSrc}
              />
            )}
          </div>
          <DialogFooter className="border-t p-4 print:hidden sm:space-x-2">
            <Button onClick={handlePrint} disabled={isPrinting} className="gap-1.5">
              <Printer className="h-4 w-4" />
              <span>{isPrinting ? receiptDialogCopy.preparing : receiptDialogCopy.print}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {settlement && canCorrect ? (
        <SettlementCorrectionSheet
          open={correctionOpen}
          onOpenChange={setCorrectionOpen}
          settlement={settlement}
          showAuthorizerHint={!isSettlementMaker(settlement, user?.id)}
          onSaved={() => {
            void refetch();
          }}
        />
      ) : null}

      {settlement?.approval && canReadApprovals ? (
        <ApprovalHistorySheet
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          type="internal_staff_compensation"
          id={settlement.id}
          subtitle={settlement.settlementNumber}
        />
      ) : null}
    </>
  );
}
