import { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Receipt, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { AlertWithIcon } from "@shared/ui/alert";
import { DetailAlertCard } from "@shared/ui/data-display";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { NotFoundState } from "@shared/ui/feedback-states";
import { useToast } from "@shared/hooks";
import { usePermissions, useRole } from "@shared/permissions";
import { isClientPortalRole } from "@shared/constants/roles";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { resolveDetailQueryErrorState } from "@shared/utils/resolveQueryErrorState";
import { useInvoice, useRetryRepStamp } from "@features/invoicing/application";
import {
  getInvoiceDisplayAmounts,
  parseInvoiceBillingScope,
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
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  hasRepFiscalDeadlineAlert,
  getWorstRepFiscalDeadlineStatus,
  formatRepFiscalDeadlineLabel,
  getRepFiscalDeadlineForPayment,
} from "../helpers/repFiscalDeadlineUx";

const copy = invoicingCopy.detail;
/** Sin max-w propio: mismo techo que el listado (`LayoutShell` max-w-7xl). */
const DETAIL_SHELL_CLASS = "w-full p-4 sm:p-6";

function resolveInvoiceBackHref(
  from: string | undefined,
  invoice: Invoice | undefined,
): string {
  if (from && !from.startsWith("/invoices/new")) return from;
  if (invoice?.trips?.length) return `/trips/${invoice.trips[0].tripId}`;
  return "/finance/invoices";
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isClientPortal = isClientPortalRole(role);
  // Lockstep with API: GET pdf/xml require invoices.read (no separate export).
  const canExportFiles = hasPermission("invoices", "read");
  const canRetryRep = hasPermission("invoices", "execute");
  const fromState = location.state?.from as string | undefined;
  const [retryingPaymentId, setRetryingPaymentId] = useState<string | null>(
    null,
  );
  const [interactionBusy, setInteractionBusy] = useState(false);
  const [openSubstituteRequestKey, setOpenSubstituteRequestKey] = useState(0);
  const [openCancelRequestKey, setOpenCancelRequestKey] = useState(0);

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

  /** Mid-trip / flota: Sustituir 04. Excluye false_trip y post-cancel. */
  const showTripFiscalAttention =
    !isClientPortal &&
    invoice?.status === "stamped" &&
    Boolean(linkedTripForFiscal?.requiresFiscalAttention) &&
    linkedTripForFiscal?.operationalOutcome !== "false_trip" &&
    !linkedTripCancelled;

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
    navigate(resolveInvoiceBackHref(fromState, invoice));
  };

  const shellHeaderPlaceholder = {
    backHref: resolveInvoiceBackHref(fromState, undefined),
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
    const notFoundConfig =
      errorState === "forbidden"
        ? {
            icon: <AlertCircle />,
            title: copy.forbidden.title,
            description: copy.forbidden.description,
            onBackClick: handleBack,
            backLabel: copy.notFound.backLabel,
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

  const backHref = resolveInvoiceBackHref(fromState, invoice);

  const autoDispatchFailed =
    invoice.autoDispatch?.lastItemStatus === "failed";

  const hasAlerts =
    !isClientPortal &&
    (isActiveSubstitute ||
      isStampedLike ||
      showRepFiscalAlert ||
      autoDispatchFailed ||
      showTripFiscalAttention ||
      showFalseTripCancelCfdi ||
      showPostCancelFiscalAttention);
  const alerts = hasAlerts ? (
    <div className="space-y-3">
      {showFalseTripCancelCfdi ? (
        <DetailAlertCard
          severity="critical"
          icon={<Receipt className="h-5 w-5" />}
          title={
            falseTripCancelBlockedByPayments
              ? copy.hint.falseTripCancelCfdiBlockedTitle
              : copy.hint.falseTripCancelCfdiTitle
          }
        >
          {falseTripCancelBlockedByPayments ? (
            <p>
              {copy.hint.falseTripCancelCfdiBlockedBody}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  document
                    .getElementById("invoice-payments")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {copy.hint.falseTripCancelCfdiBlockedLink}
              </button>
            </p>
          ) : (
            <p>
              {copy.hint.falseTripCancelCfdiBody}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => setOpenCancelRequestKey((key) => key + 1)}
              >
                {copy.hint.falseTripCancelCfdiLink}
              </button>
            </p>
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
              : copy.hint.postCancelCancelCfdiTitle
          }
        >
          {postCancelCancelBlockedByPayments ? (
            <p>
              {copy.hint.postCancelCancelCfdiBlockedBody}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  document
                    .getElementById("invoice-payments")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {copy.hint.postCancelCancelCfdiBlockedLink}
              </button>
            </p>
          ) : (
            <p>
              {copy.hint.postCancelCancelCfdiBody}{" "}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => setOpenCancelRequestKey((key) => key + 1)}
              >
                {copy.hint.postCancelCancelCfdiLink}
              </button>
            </p>
          )}
        </DetailAlertCard>
      ) : null}
      {showTripFiscalAttention ? (
        <DetailAlertCard
          severity="warning"
          icon={<Receipt className="h-5 w-5" />}
          title={copy.hint.fiscalAttentionTitle}
        >
          <p>
            {copy.hint.fiscalAttentionBody}{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setOpenSubstituteRequestKey((key) => key + 1)}
            >
              {copy.hint.fiscalAttentionLink}
            </button>
          </p>
        </DetailAlertCard>
      ) : null}
      {autoDispatchFailed ? (
        <AlertWithIcon
          variant="destructive"
          title={invoicingCopy.send.autoDispatchFailedTitle}
        >
          <span className="block">
            {invoicingCopy.send.autoDispatchFailedBody}
          </span>
          {invoice.autoDispatch?.lastScheduledRunId ? (
            <Link
              to={`/finance/dispatch/${invoice.autoDispatch.lastScheduledRunId}`}
              className="mt-1 inline-block font-medium text-primary underline-offset-4 hover:underline"
            >
              {invoicingCopy.send.autoDispatchFailedLink}
            </Link>
          ) : null}
        </AlertWithIcon>
      ) : null}
      {showRepFiscalAlert && repFiscalWorstStatus ? (
        <AlertWithIcon variant="warning" title={copy.label.repFiscalDeadline}>
          {repFiscalWorstStatus === "overdue"
            ? copy.hint.repFiscalDeadlineOverdue(repFiscalDeadlineLabel)
            : copy.hint.repFiscalDeadlineApproaching(repFiscalDeadlineLabel)}
        </AlertWithIcon>
      ) : null}
      {isActiveSubstitute ? (
        <AlertWithIcon variant="info">
          {copy.hint.substitutionPrefix}{" "}
          <Link
            to={`/invoices/${invoice.parentInvoiceId}`}
            state={{ from: location.pathname }}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {copy.hint.substitutionLink}
          </Link>
          {copy.hint.substitutionSuffix}
        </AlertWithIcon>
      ) : null}
      {isStampedLike ? (
        <AlertWithIcon
          variant={invoice.hasStampedXml ? "info" : "warning"}
          title={
            invoice.hasStampedXml
              ? copy.hint.filesAlertTitle
              : copy.hint.xmlMissingTitle
          }
        >
          {invoice.hasStampedXml
            ? copy.hint.filesAlertDescription
            : copy.hint.xmlMissingDescription}
        </AlertWithIcon>
      ) : null}
    </div>
  ) : undefined;

  return (
    <DetailPageShell
      isLoading={false}
      className={DETAIL_SHELL_CLASS}
      header={{
        backHref,
        backLabel: copy.header.backLabel,
        icon: <Receipt className="h-6 w-6" />,
        title: (
          <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0">{`${invoice.serie}-${invoice.folio}`}</span>
            <InvoiceStatusBadge status={invoice.status} showIcon size="sm" />
            <InvoiceBillingScopeBadge
              scope={resolveInvoiceBillingScope(invoice.trips)}
            />
            <InvoiceEmailDispatchBadge
              status={invoice.status}
              dispatchSentAt={invoice.dispatchSentAt}
              autoDispatchLastItemStatus={
                invoice.autoDispatch?.lastItemStatus
              }
              mode="withDate"
            />
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
