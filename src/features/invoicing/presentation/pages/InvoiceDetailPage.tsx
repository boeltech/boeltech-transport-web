import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Receipt, AlertCircle, FileText, Clock } from "lucide-react";
import { canRegisterFinancialPayment } from "@boeltech/cfdi-domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { NotFoundState } from "@shared/ui/feedback-states";
import { useToast } from "@shared/hooks";
import { usePermissions, useRole } from "@shared/permissions";
import { isClientPortalRole, ROLES } from "@shared/constants/roles";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { resolveDetailQueryErrorState } from "@shared/utils/resolveQueryErrorState";
import {
  useInvoice,
  useRetryRepStamp,
} from "@features/invoicing/application";
import {
  getInvoiceDisplayAmounts,
  parseInvoiceBillingScope,
  resolveGenericReceiverAdjustment,
  toInvoiceLike,
  type Invoice,
} from "@features/invoicing/domain";
import { useTrip } from "@features/trips/application";
import { shouldShowFalseTripCancelCfdiBanner } from "@features/trips/presentation/helpers/shouldShowFalseTripCancelCfdiBanner";
import {
  InvoiceStatusBadge,
  InvoiceEmailDispatchBadge,
  InvoiceActions,
  InvoiceDetailHeaderSubtitle,
  buildInvoiceStats,
  InvoiceDetailContextStrip,
  InvoiceDetailAmountsPanel,
  InvoicePaymentRepRow,
  InvoiceBillingScopeBadge,
  resolveInvoiceBillingScope,
} from "../components";
import { InvoiceDetailConceptsCard } from "../components/InvoiceDetailConceptsCard";
import { InvoiceDetailPaymentTermsCard } from "../components/InvoiceDetailFiscalLabels";
import { InvoiceDetailFiscalDossier } from "../components/InvoiceDetailFiscalDossier";
import {
  getInvoiceFilesReadyStorageKey,
  InvoiceFilesReadyAlert,
  readInvoiceFilesReadyCollapsed,
} from "../components/InvoiceFilesReadyAlert";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  hasRepFiscalDeadlineAlert,
  getWorstRepFiscalDeadlineStatus,
  formatRepFiscalDeadlineLabel,
  getRepFiscalDeadlineForPayment,
} from "../helpers/repFiscalDeadlineUx";
import { resolveInvoiceFollowThrough } from "../helpers/resolveInvoiceFollowThrough";
import { resolveInvoicePortalStatusLabel } from "../utils/invoicePortalStatus";
import {
  resolveInvoiceAccessDeniedCopy,
  resolveInvoiceBackHref,
  resolveInvoiceWayfindingBackLabel,
} from "../utils/invoiceWayfinding";

const copy = invoicingCopy.detail;
/** Sin max-w propio: mismo techo que el listado (`LayoutShell` max-w-7xl). */
const DETAIL_SHELL_CLASS = "w-full p-4 sm:p-6";

function invoiceBackHref(
  from: string | undefined,
  invoice: Invoice | undefined,
): string {
  return resolveInvoiceBackHref(from, {
    tripId: invoice?.trips?.[0]?.tripId,
  });
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isClientPortal = isClientPortalRole(role);
  const canAdminManagerFiscal =
    role === ROLES.ADMIN || role === ROLES.MANAGER;
  // Lockstep with API: GET pdf/xml require invoices.read (no separate export).
  const canExportFiles = hasPermission("invoices", "read");
  const canExecuteInvoice = hasPermission("invoices", "execute");
  const canRetryRep = canExecuteInvoice;
  const canEditInvoice = hasPermission("invoices", "update");
  const fromState = location.state?.from as string | undefined;
  const [retryingPaymentId, setRetryingPaymentId] = useState<string | null>(
    null,
  );
  const [interactionBusy, setInteractionBusy] = useState(false);
  const [openSubstituteRequestKey, setOpenSubstituteRequestKey] = useState(0);
  const [openCancelRequestKey, setOpenCancelRequestKey] = useState(0);
  const [openSendRequestKey, setOpenSendRequestKey] = useState(0);
  const [openPaymentRequestKey, setOpenPaymentRequestKey] = useState(0);
  const [openResumeCancelRequestKey, setOpenResumeCancelRequestKey] =
    useState(0);

  const filesReadyStorageKey = getInvoiceFilesReadyStorageKey(id ?? "");
  const [filesReadyCollapsed, setFilesReadyCollapsed] = useState(() =>
    readInvoiceFilesReadyCollapsed(filesReadyStorageKey),
  );
  useEffect(() => {
    setFilesReadyCollapsed(
      readInvoiceFilesReadyCollapsed(filesReadyStorageKey),
    );
  }, [filesReadyStorageKey]);

  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
  } = useInvoice(id ?? "", { pausePolling: interactionBusy });

  const linkedPrimaryTrip = invoice?.trips.find(
    (trip) => parseInvoiceBillingScope(trip.billingScope) === "primary_transport",
  );
  const linkedTripIdForFiscal = linkedPrimaryTrip?.tripId ?? invoice?.trips[0]?.tripId;
  const { data: linkedTripForFiscal } = useTrip(linkedTripIdForFiscal ?? "", {
    enabled: Boolean(
      !isClientPortal &&
        invoice &&
        invoice.status === "stamped" &&
        linkedTripIdForFiscal,
    ),
  });

  const parentInvoiceIdForPartial = invoice?.parentInvoiceId ?? null;
  const { data: parentInvoiceForPartial } = useInvoice(
    parentInvoiceIdForPartial ?? "",
    {
      enabled: Boolean(
        !isClientPortal &&
          invoice &&
          invoice.status === "stamped" &&
          parentInvoiceIdForPartial,
      ),
    },
  );

  /**
   * (B) Sustitución parcial — A-54: stamped + hijo activo.
   * Precedencia PRD D2 sobre mid-trip flota.
   */
  const showSubstitutionCancelPendingOriginal =
    !isClientPortal &&
    invoice?.status === "stamped" &&
    invoice.activeReplacement != null;

  /**
   * (B) en A-55: sustituta vigente mientras el original sigue stamped
   * o cancellation_pending.
   */
  const showSubstitutionCancelPendingSubstitute =
    !isClientPortal &&
    Boolean(invoice?.parentInvoiceId) &&
    invoice?.status === "stamped" &&
    (parentInvoiceForPartial?.status === "stamped" ||
      parentInvoiceForPartial?.status === "cancellation_pending");

  const showSubstitutionCancelPending =
    showSubstitutionCancelPendingOriginal ||
    showSubstitutionCancelPendingSubstitute;

  const showFalseTripCancelCfdi =
    !isClientPortal &&
    invoice?.status === "stamped" &&
    Boolean(linkedTripForFiscal?.invoicing) &&
    shouldShowFalseTripCancelCfdiBanner({
      operationalOutcome: linkedTripForFiscal!.operationalOutcome,
      requiresFiscalAttention: Boolean(
        linkedTripForFiscal!.requiresFiscalAttention,
      ),
      invoicing: linkedTripForFiscal!.invoicing,
    });

  const hasInvoiceRegisteredCobros =
    Boolean(invoice) &&
    ((invoice!.totalPaid ?? 0) > 0 || (invoice!.payments?.length ?? 0) > 0);

  /** CA-06: no empujar cancel viable cuando hay cobros / API dice no cancelable. */
  const falseTripCancelBlockedByPayments =
    showFalseTripCancelCfdi &&
    hasInvoiceRegisteredCobros &&
    (invoice!.canCancelInvoice !== undefined
      ? !invoice!.canCancelInvoice
      : true);

  const linkedTripCancelled =
    linkedTripForFiscal?.status === "cancelled";

  /**
   * Post-cancel: viaje cancelled + bandera (no false_trip).
   * Orientar a Cancelar; con cobros → blocked + Ver pagos (nunca Sustituir).
   */
  const showPostCancelFiscalAttention =
    !isClientPortal &&
    invoice?.status === "stamped" &&
    Boolean(linkedTripForFiscal?.requiresFiscalAttention) &&
    linkedTripForFiscal?.operationalOutcome !== "false_trip" &&
    linkedTripCancelled;

  const postCancelCancelBlockedByPayments =
    showPostCancelFiscalAttention &&
    hasInvoiceRegisteredCobros &&
    (invoice!.canCancelInvoice !== undefined
      ? !invoice!.canCancelInvoice
      : true);

  /** Mid-trip / flota: Sustituir 04. Excluye false_trip, post-cancel y parcial (B). */
  const showTripFiscalAttention =
    !isClientPortal &&
    invoice?.status === "stamped" &&
    Boolean(linkedTripForFiscal?.requiresFiscalAttention) &&
    linkedTripForFiscal?.operationalOutcome !== "false_trip" &&
    !linkedTripCancelled &&
    !showSubstitutionCancelPending;

  const fiscalAttentionTripIds = useMemo(() => {
    if (
      (!showTripFiscalAttention &&
        !showFalseTripCancelCfdi &&
        !showPostCancelFiscalAttention) ||
      !linkedTripIdForFiscal
    ) {
      return undefined;
    }
    return new Set([linkedTripIdForFiscal]);
  }, [
    showTripFiscalAttention,
    showFalseTripCancelCfdi,
    showPostCancelFiscalAttention,
    linkedTripIdForFiscal,
  ]);

  const { mutate: retryRep } = useRetryRepStamp(invoice?.id ?? "", {
    onMutate: (paymentId) => setRetryingPaymentId(paymentId),
    onSettled: () => setRetryingPaymentId(null),
    onSuccess: () => {
      toast({ title: copy.toast.repRetrySuccess });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: copy.toast.repRetryError,
        description: getErrorMessage(err),
      });
    },
  });

  const handleBack = () => {
    navigate(invoiceBackHref(fromState, invoice));
  };

  const shellHeaderPlaceholder = {
    backHref: invoiceBackHref(fromState, undefined),
    icon: <Receipt className="h-6 w-6" />,
    title: copy.header.title,
  };

  const errorState = resolveDetailQueryErrorState({
    missingId: !id,
    isError,
    error,
    hasData: !!invoice,
  });

  const displayAmounts = useMemo(
    () => (invoice ? getInvoiceDisplayAmounts(invoice) : null),
    [invoice],
  );

  const invoiceStats = useMemo(
    () => (invoice ? buildInvoiceStats(invoice) : []),
    [invoice],
  );

  const repFiscalWorstStatus = useMemo(
    () => (invoice ? getWorstRepFiscalDeadlineStatus(invoice.payments) : null),
    [invoice],
  );
  const showRepFiscalAlert = invoice
    ? hasRepFiscalDeadlineAlert(invoice.payments)
    : false;
  const repFiscalDeadlineLabel = useMemo(() => {
    if (!invoice) return "";
    const alertPayment = invoice.payments.find((p) => {
      if (p.repStatus !== "pending" && p.repStatus !== "failed") return false;
      const { status } = getRepFiscalDeadlineForPayment(p);
      return status === "approaching" || status === "overdue";
    });
    return alertPayment
      ? formatRepFiscalDeadlineLabel(
          getRepFiscalDeadlineForPayment(alertPayment).deadlineDate,
        )
      : "";
  }, [invoice]);

  if (isLoading) {
    return (
      <DetailPageShell
        isLoading
        className={DETAIL_SHELL_CLASS}
        header={shellHeaderPlaceholder}
      />
    );
  }

  if (errorState === "serverError") {
    return (
      <div className={DETAIL_SHELL_CLASS}>
        <NotFoundState
          icon={<AlertCircle />}
          title={copy.serverError.title}
          description={
            error ? getErrorMessage(error) : copy.serverError.description
          }
          onBackClick={() => void refetch()}
          backLabel={copy.serverError.retry}
        />
      </div>
    );
  }

  if (errorState !== "ready" || !invoice || !displayAmounts) {
    const accessDenied = resolveInvoiceAccessDeniedCopy(isClientPortal);
    const notFoundConfig =
      errorState === "forbidden"
        ? {
            icon: <AlertCircle />,
            title: accessDenied.title,
            description: accessDenied.description,
            onBackClick: isClientPortal
              ? () => navigate(accessDenied.backHref)
              : handleBack,
            backLabel: accessDenied.backLabel,
          }
        : errorState === "missingId"
          ? {
              icon: <AlertCircle />,
              title: copy.missingId.title,
              description: copy.missingId.description,
              onBackClick: handleBack,
              backLabel: copy.notFound.backLabel,
            }
          : {
              icon: <AlertCircle />,
              title: copy.notFound.title,
              description: error ? getErrorMessage(error) : undefined,
              onBackClick: handleBack,
              backLabel: copy.notFound.backLabel,
            };

    return (
      <DetailPageShell
        isLoading={false}
        notFound
        notFoundConfig={notFoundConfig}
        className={DETAIL_SHELL_CLASS}
        header={shellHeaderPlaceholder}
      />
    );
  }

  const isStampedLike =
    invoice.status === "stamped" || invoice.status === "cancellation_pending";

  /** Sustituto vigente en la cadena (p. ej. A-18), no intermedios ya cancelados (p. ej. A-17). */
  const isActiveSubstitute =
    Boolean(invoice.parentInvoiceId) && invoice.status !== "cancelled";

  const backHref = invoiceBackHref(fromState, invoice);

  /** Misma regla que InvoiceEmailDispatchBadge: fallo auto solo si aún no hay envío exitoso. */
  const autoDispatchFailed =
    !invoice.dispatchSentAt &&
    invoice.autoDispatch?.lastItemStatus === "failed";

  const showFilesReadyAlert =
    isStampedLike && Boolean(invoice.hasStampedXml) && !filesReadyCollapsed;
  const showXmlMissingAlert = isStampedLike && !invoice.hasStampedXml;

  const followThrough = resolveInvoiceFollowThrough({
    status: invoice.status,
    dispatchSentAt: invoice.dispatchSentAt,
    balanceDue: invoice.balanceDue,
  });
  const showFollowThrough =
    !isClientPortal &&
    (followThrough.showSend || followThrough.showCollect);
  const canFollowThroughSend =
    followThrough.showSend && canExecuteInvoice && invoice.status === "stamped";
  const canFollowThroughCollect =
    followThrough.showCollect &&
    canExecuteInvoice &&
    canRegisterFinancialPayment(toInvoiceLike(invoice));
  const canSendFromAlert =
    canExecuteInvoice && invoice.status === "stamped";
  const sendAlertLabel = invoice.dispatchSentAt
    ? copy.actions.resendByEmail
    : copy.actions.sendByEmail;

  const showClientDraftAlert =
    isClientPortal && invoice.status === "draft";

  const showCancellationPendingBanner =
    !isClientPortal && invoice.status === "cancellation_pending";

  const genericReceiverMismatch =
    !isClientPortal && invoice.status === "draft"
      ? resolveGenericReceiverAdjustment({
          receiverRfc: invoice.receiverRfc,
          receiverTaxRegime: invoice.receiverTaxRegime,
          cfdiUsage: invoice.cfdiUsage,
        })
      : null;
  const showGenericReceiverAlert =
    genericReceiverMismatch != null && genericReceiverMismatch.changes.length > 0;

  const scrollToInvoicePayments = () => {
    document
      .getElementById("invoice-payments")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Contador (y otros no admin/manager): hueco SAT estable en stamped/pending, sin depender de banners de viaje. */
  const showSatHoleAlert =
    !isClientPortal &&
    !canAdminManagerFiscal &&
    (invoice.status === "stamped" ||
      invoice.status === "cancellation_pending") &&
    !showFalseTripCancelCfdi &&
    !showPostCancelFiscalAttention &&
    !showTripFiscalAttention &&
    !showSubstitutionCancelPending;

  const showActiveSubstituteInfo =
    isActiveSubstitute && !showSubstitutionCancelPendingSubstitute;

  const hasAlerts =
    showClientDraftAlert ||
    showCancellationPendingBanner ||
    showSatHoleAlert ||
    (!isClientPortal &&
      (showGenericReceiverAlert ||
        showActiveSubstituteInfo ||
        showFilesReadyAlert ||
        showXmlMissingAlert ||
        showRepFiscalAlert ||
        autoDispatchFailed ||
        showTripFiscalAttention ||
        showFalseTripCancelCfdi ||
        showPostCancelFiscalAttention ||
        showSubstitutionCancelPending ||
        showFollowThrough));
  const alerts = hasAlerts ? (
    <div className="space-y-3">
      {showClientDraftAlert ? (
        <DetailAlertCard
          severity="warning"
          icon={<AlertCircle className="h-5 w-5" />}
          title={copy.hint.clientDraftTitle}
        >
          <p>{copy.hint.clientDraftBody}</p>
        </DetailAlertCard>
      ) : null}
      {showCancellationPendingBanner ? (
        <DetailAlertCard
          severity="warning"
          icon={<Clock className="h-5 w-5" />}
          title={copy.hint.cancellationPendingBannerTitle}
        >
          <p>{copy.hint.cancellationPendingBannerBody}</p>
        </DetailAlertCard>
      ) : null}
      {showSatHoleAlert ? (
        <DetailAlertCard
          severity="info"
          icon={<AlertCircle className="h-5 w-5" />}
          title={copy.hint.satHoleTitle}
        >
          <p>{copy.hint.satHoleBody}</p>
        </DetailAlertCard>
      ) : null}
      {showGenericReceiverAlert && genericReceiverMismatch ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-5 w-5" />}
          title={invoicingCopy.genericReceiver.detailTitle}
          action={
            canEditInvoice ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
              >
                {invoicingCopy.genericReceiver.detailCta}
              </Button>
            ) : null
          }
        >
          <p>
            {invoicingCopy.genericReceiver.detailBody(
              genericReceiverMismatch.kind,
              invoice.receiverTaxRegime ?? "",
              invoice.cfdiUsage ?? "",
            )}
          </p>
        </DetailAlertCard>
      ) : null}
      {showFalseTripCancelCfdi ? (
        <DetailAlertCard
          severity="critical"
          icon={<Receipt className="h-5 w-5" />}
          title={
            falseTripCancelBlockedByPayments
              ? copy.hint.falseTripCancelCfdiBlockedTitle
              : canAdminManagerFiscal
                ? copy.hint.falseTripCancelCfdiTitle
                : copy.hint.satHoleTitle
          }
          action={
            falseTripCancelBlockedByPayments ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={scrollToInvoicePayments}
              >
                {copy.hint.falseTripCancelCfdiBlockedLink}
              </Button>
            ) : canAdminManagerFiscal ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setOpenCancelRequestKey((key) => key + 1)}
              >
                {copy.hint.falseTripCancelCfdiLink}
              </Button>
            ) : null
          }
        >
          {falseTripCancelBlockedByPayments ? (
            <p>{copy.hint.falseTripCancelCfdiBlockedBody}</p>
          ) : canAdminManagerFiscal ? (
            <p>{copy.hint.falseTripCancelCfdiBody}</p>
          ) : (
            <p>{copy.hint.satHoleBody}</p>
          )}
        </DetailAlertCard>
      ) : null}
      {showPostCancelFiscalAttention ? (
        <DetailAlertCard
          severity="critical"
          icon={<Receipt className="h-5 w-5" />}
          title={
            postCancelCancelBlockedByPayments
              ? copy.hint.postCancelCancelCfdiBlockedTitle
              : canAdminManagerFiscal
                ? copy.hint.postCancelCancelCfdiTitle
                : copy.hint.satHoleTitle
          }
          action={
            postCancelCancelBlockedByPayments ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={scrollToInvoicePayments}
              >
                {copy.hint.postCancelCancelCfdiBlockedLink}
              </Button>
            ) : canAdminManagerFiscal ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setOpenCancelRequestKey((key) => key + 1)}
              >
                {copy.hint.postCancelCancelCfdiLink}
              </Button>
            ) : null
          }
        >
          {postCancelCancelBlockedByPayments ? (
            <p>{copy.hint.postCancelCancelCfdiBlockedBody}</p>
          ) : canAdminManagerFiscal ? (
            <p>{copy.hint.postCancelCancelCfdiBody}</p>
          ) : (
            <p>{copy.hint.satHoleBody}</p>
          )}
        </DetailAlertCard>
      ) : null}
      {showSubstitutionCancelPending ? (
        <DetailAlertCard
          severity="critical"
          icon={<Receipt className="h-5 w-5" />}
          title={copy.hint.substitutionCancelPendingTitle}
          action={
            showSubstitutionCancelPendingOriginal && canAdminManagerFiscal ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setOpenResumeCancelRequestKey((key) => key + 1)
                }
              >
                {copy.hint.substitutionCancelPendingCta}
              </Button>
            ) : showSubstitutionCancelPendingSubstitute &&
              invoice.parentInvoiceId ? (
              <Button asChild size="sm" variant="outline">
                <Link
                  to={`/invoices/${invoice.parentInvoiceId}`}
                  state={{ from: location.pathname }}
                >
                  {copy.hint.substitutionCancelPendingLinkOriginal}
                </Link>
              </Button>
            ) : null
          }
        >
          {canAdminManagerFiscal ? (
            <p>
              {showSubstitutionCancelPendingOriginal
                ? copy.hint.substitutionCancelPendingBodyOriginal(
                    invoice.activeReplacement?.cfdiUuid ?? null,
                  )
                : parentInvoiceForPartial?.status === "cancellation_pending"
                  ? copy.hint.substitutionCancelPendingBodyParentWaiting
                  : copy.hint.substitutionCancelPendingBodySubstitute}
            </p>
          ) : (
            <p>{copy.hint.substitutionCancelPendingAskManagerBody}</p>
          )}
        </DetailAlertCard>
      ) : null}
      {showTripFiscalAttention ? (
        <DetailAlertCard
          severity="warning"
          icon={<Receipt className="h-5 w-5" />}
          title={copy.hint.fiscalAttentionTitle}
          action={
            canAdminManagerFiscal ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setOpenSubstituteRequestKey((key) => key + 1)}
              >
                {copy.hint.fiscalAttentionLink}
              </Button>
            ) : null
          }
        >
          {canAdminManagerFiscal ? (
            <p>{copy.hint.fiscalAttentionBody}</p>
          ) : (
            <p>{copy.hint.fiscalAttentionAskManagerBody}</p>
          )}
        </DetailAlertCard>
      ) : null}
      {showFollowThrough ? (
        <DetailAlertCard
          severity="info"
          icon={<Receipt className="h-5 w-5" />}
          title={copy.hint.followThroughTitle}
          action={
            <>
              {canFollowThroughSend ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenSendRequestKey((key) => key + 1)}
                >
                  {copy.actions.sendByEmail}
                </Button>
              ) : null}
              {canFollowThroughCollect ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenPaymentRequestKey((key) => key + 1)}
                >
                  {copy.actions.registerPayment}
                </Button>
              ) : null}
            </>
          }
        >
          {followThrough.showSend ? (
            <p>
              {followThrough.showCollect
                ? copy.hint.followThroughSendBoth
                : copy.hint.followThroughSend}
            </p>
          ) : null}
          {followThrough.showCollect ? (
            <p>
              {followThrough.showSend
                ? copy.hint.followThroughCollectBoth
                : copy.hint.followThroughCollect}
            </p>
          ) : null}
        </DetailAlertCard>
      ) : null}
      {autoDispatchFailed ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-5 w-5" />}
          title={invoicingCopy.send.autoDispatchFailedTitle}
          action={
            <>
              {canSendFromAlert ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenSendRequestKey((key) => key + 1)}
                >
                  {sendAlertLabel}
                </Button>
              ) : null}
              {invoice.autoDispatch?.lastScheduledRunId ? (
                <Button asChild size="sm" variant="outline">
                  <Link
                    to={`/finance/dispatch/${invoice.autoDispatch.lastScheduledRunId}`}
                    state={{ from: `${location.pathname}${location.search}` }}
                  >
                    {invoicingCopy.send.autoDispatchFailedLink}
                  </Link>
                </Button>
              ) : null}
            </>
          }
        >
          <p>{invoicingCopy.send.autoDispatchFailedBody}</p>
        </DetailAlertCard>
      ) : null}
      {showRepFiscalAlert && repFiscalWorstStatus ? (
        <DetailAlertCard
          severity="warning"
          icon={<AlertCircle className="h-5 w-5" />}
          title={copy.label.repFiscalDeadline}
        >
          <p>
            {repFiscalWorstStatus === "overdue"
              ? copy.hint.repFiscalDeadlineOverdue(repFiscalDeadlineLabel)
              : copy.hint.repFiscalDeadlineApproaching(repFiscalDeadlineLabel)}
          </p>
        </DetailAlertCard>
      ) : null}
      {showActiveSubstituteInfo ? (
        <DetailAlertCard
          severity="info"
          icon={<Receipt className="h-5 w-5" />}
          title={copy.hint.substitutionPrefix}
          action={
            <Button asChild size="sm" variant="outline">
              <Link
                to={`/invoices/${invoice.parentInvoiceId}`}
                state={{ from: location.pathname }}
              >
                {copy.hint.substitutionLink}
              </Link>
            </Button>
          }
        />
      ) : null}
      {showFilesReadyAlert ? (
        <InvoiceFilesReadyAlert
          invoiceId={invoice.id}
          storageKey={filesReadyStorageKey}
          onDismissed={() => setFilesReadyCollapsed(true)}
        />
      ) : null}
      {showXmlMissingAlert ? (
        <DetailAlertCard
          severity="warning"
          icon={<AlertCircle className="h-5 w-5" />}
          title={copy.hint.xmlMissingTitle}
        >
          <p>{copy.hint.xmlMissingDescription}</p>
        </DetailAlertCard>
      ) : null}
    </div>
  ) : undefined;

  return (
    <DetailPageShell
      isLoading={false}
      className={DETAIL_SHELL_CLASS}
      header={{
        backHref,
        backLabel: resolveInvoiceWayfindingBackLabel(backHref, {
          isClientPortal,
        }),
        icon: <Receipt className="h-6 w-6" />,
        title: (
          <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0">{`${invoice.serie}-${invoice.folio}`}</span>
            {isClientPortal ? (
              <Badge variant="secondary" className="text-xs font-normal">
                {resolveInvoicePortalStatusLabel(invoice.status)}
              </Badge>
            ) : (
              <InvoiceStatusBadge status={invoice.status} showIcon size="sm" />
            )}
            <InvoiceBillingScopeBadge
              scope={resolveInvoiceBillingScope(invoice.trips)}
            />
            {isClientPortal ? null : (
              <InvoiceEmailDispatchBadge
                status={invoice.status}
                dispatchSentAt={invoice.dispatchSentAt}
                autoDispatchLastItemStatus={
                  invoice.autoDispatch?.lastItemStatus
                }
                mode="withDate"
              />
            )}
          </span>
        ),
        subtitle: (
          <InvoiceDetailHeaderSubtitle
            receiverName={invoice.receiverName}
            receiverRfc={invoice.receiverRfc}
            issuerName={invoice.issuerName}
            isClientPortal={isClientPortal}
          />
        ),
        actions: (
          <InvoiceActions
            variant="buttons"
            invoiceId={invoice.id}
            invoiceSerie={invoice.serie}
            invoiceFolio={invoice.folio}
            invoiceStatus={invoice.status}
            fullInvoice={invoice}
            onBusyChange={setInteractionBusy}
            openSubstituteRequestKey={openSubstituteRequestKey}
            openCancelRequestKey={openCancelRequestKey}
            openSendRequestKey={openSendRequestKey}
            openPaymentRequestKey={openPaymentRequestKey}
            openResumeCancelRequestKey={openResumeCancelRequestKey}
          />
        ),
      }}
      alerts={hasAlerts ? alerts : undefined}
      stats={invoiceStats}
      metadata={{
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        createdBy:
          invoice.createdByName?.trim() ||
          invoice.createdBy?.trim() ||
          undefined,
        updatedBy: invoice.updatedByName?.trim() || undefined,
      }}
    >
      {/* Banda 2 — Qué se cobró */}
      <section className="space-y-4" aria-label={copy.section.billed}>
        <InvoiceDetailContextStrip
          invoice={invoice}
          fromPath={location.pathname}
          isClientPortal={isClientPortal}
          fiscalAttentionTripIds={fiscalAttentionTripIds}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,300px)]">
          <InvoiceDetailConceptsCard concepts={invoice.concepts} />
          <InvoiceDetailAmountsPanel
            invoice={invoice}
            displayAmounts={displayAmounts}
          />
        </div>

        <InvoiceDetailPaymentTermsCard invoice={invoice} />

        {invoice.payments.length > 0 ? (
          <Card id="invoice-payments">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {copy.section.payments(invoice.payments.length)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.payments.map((payment) => (
                <InvoicePaymentRepRow
                  key={payment.id}
                  payment={payment}
                  invoiceId={invoice.id}
                  invoiceSerieFolio={`${invoice.serie}-${invoice.folio}`}
                  canExportFiles={canExportFiles}
                  canRetryRep={canRetryRep}
                  onRetry={retryRep}
                  retryingPaymentId={retryingPaymentId}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {invoice.notes ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                {copy.section.notes}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{invoice.notes}</p>
            </CardContent>
          </Card>
        ) : null}
      </section>

      {/* Banda 3 — Expediente fiscal / datos del comprobante */}
      <InvoiceDetailFiscalDossier
        invoice={invoice}
        isClientPortal={isClientPortal}
      />
    </DetailPageShell>
  );
}
