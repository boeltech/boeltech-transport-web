import { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Receipt, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { AlertWithIcon } from "@shared/ui/alert";
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
  type Invoice,
} from "@features/invoicing/domain";
import {
  InvoiceStatusBadge,
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
const DETAIL_SHELL_CLASS = "mx-auto w-full max-w-6xl p-4 sm:p-6";

function resolveInvoiceBackHref(
  from: string | undefined,
  invoice: Invoice | undefined,
): string {
  if (from && !from.startsWith("/invoices/new")) return from;
  if (invoice?.trips?.length) return `/trips/${invoice.trips[0].tripId}`;
  return "/finance?tab=invoices";
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isClientPortal = isClientPortalRole(role);
  const canExportFiles =
    hasPermission("invoices", "export") ||
    (isClientPortal && hasPermission("invoices", "read"));
  const canRetryRep = hasPermission("invoices", "execute");
  const fromState = location.state?.from as string | undefined;
  const [retryingPaymentId, setRetryingPaymentId] = useState<string | null>(
    null,
  );
  const [interactionBusy, setInteractionBusy] = useState(false);

  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
  } = useInvoice(id ?? "", { pausePolling: interactionBusy });

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

  const hasAlerts =
    !isClientPortal &&
    (isActiveSubstitute || isStampedLike || showRepFiscalAlert);
  const alerts = hasAlerts ? (
    <div className="space-y-3">
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
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{`${invoice.serie}-${invoice.folio}`}</span>
            <InvoiceStatusBadge status={invoice.status} showIcon size="sm" />
            <InvoiceBillingScopeBadge
              scope={resolveInvoiceBillingScope(invoice.trips)}
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
          <Card>
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
