import { useMemo, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Receipt, AlertCircle, FileText } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { AlertWithIcon } from "@shared/ui/alert";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { NotFoundState } from "@shared/ui/feedback-states";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { resolveDetailQueryErrorState } from "@shared/utils/resolveQueryErrorState";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useInvoice, useRetryRepStamp } from "@features/invoicing/application";
import {
  getInvoiceDisplayAmounts,
  type Invoice,
} from "@features/invoicing/domain";
import { TripListRouteLabel } from "@features/trips";
import {
  InvoiceStatusBadge,
  InvoiceActions,
  CopyableUuidSubtitle,
  buildInvoiceStats,
  InvoiceDetailIssuerReceiverCards,
  InvoiceDetailCfdiAmountsCard,
  InvoicePaymentRepRow,
} from "../components";
import { invoicingCopy } from "../copy/invoicingCopy";

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
  const fromState = location.state?.from as string | undefined;
  const [retryingPaymentId, setRetryingPaymentId] = useState<string | null>(
    null,
  );

  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
  } = useInvoice(id ?? "");

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

  const backHref = resolveInvoiceBackHref(fromState, invoice);

  const hasAlerts = Boolean(invoice.parentInvoiceId) || isStampedLike;
  const alerts = hasAlerts ? (
    <div className="space-y-3">
      {invoice.parentInvoiceId ? (
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
        <AlertWithIcon variant="default">
          {invoice.hasStampedXml
            ? copy.hint.xmlWithContent
            : copy.hint.xmlMissing}
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
        title: `${invoice.serie}-${invoice.folio}`,
        subtitle: invoice.cfdiUuid ? (
          <CopyableUuidSubtitle uuid={invoice.cfdiUuid} />
        ) : (
          copy.header.receiverSubtitle(
            invoice.receiverName,
            invoice.receiverRfc,
          )
        ),
        statusBadge: <InvoiceStatusBadge status={invoice.status} />,
        actions: (
          <InvoiceActions
            variant="buttons"
            invoiceId={invoice.id}
            invoiceSerie={invoice.serie}
            invoiceFolio={invoice.folio}
            invoiceStatus={invoice.status}
            fullInvoice={invoice}
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
      <InvoiceDetailIssuerReceiverCards invoice={invoice} />

      <InvoiceDetailCfdiAmountsCard
        invoice={invoice}
        displayAmounts={displayAmounts}
      />

      {invoice.trips.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {copy.section.linkedTrips(invoice.trips.length)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoice.trips.map((trip) => (
              <div
                key={trip.tripId}
                className="flex items-center justify-between p-3 bg-muted/40 rounded-md text-sm"
              >
                <Link
                  to={`/trips/${trip.tripId}`}
                  state={{ from: location.pathname }}
                  className="inline-flex items-center gap-2 hover:underline min-w-0"
                >
                  <Badge variant="secondary">{trip.tripCode}</Badge>
                  <span className="font-medium truncate">{trip.clientName}</span>
                </Link>
                <div className="text-right shrink-0 ml-3">
                  <TripListRouteLabel
                    trip={{
                      originCity: trip.originCity,
                      originState: trip.originState,
                      destinationCity: trip.destinationCity,
                      destinationState: trip.destinationState,
                    }}
                    className="text-muted-foreground text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {copy.label.tripBaseRate}
                  </p>
                  <p className="font-medium">
                    {formatMxCurrency(trip.baseRate)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {copy.section.payments(invoice.payments.length)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoice.payments.map((payment) => (
              <InvoicePaymentRepRow
                key={payment.id}
                payment={payment}
                onRetry={retryRep}
                retryingPaymentId={retryingPaymentId}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {invoice.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {copy.section.notes}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {(invoice.status === "cancelled" ||
        invoice.status === "cancellation_pending") && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-destructive uppercase tracking-wide">
              {invoice.status === "cancellation_pending"
                ? copy.section.cancellationPending
                : copy.section.cancellation}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {invoice.status === "cancellation_pending" && (
              <p>
                <span className="text-muted-foreground">
                  {copy.label.satStatus}:{" "}
                </span>
                {invoice.satCancellationMessage ??
                  copy.hint.cancellationPendingSat}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">{copy.label.date}: </span>
              {formatDateTime(
                invoice.status === "cancellation_pending"
                  ? invoice.satCancellationUpdatedAt
                  : invoice.cancelledAt,
              )}
            </p>
            <p>
              <span className="text-muted-foreground">
                {copy.label.satReason}:{" "}
              </span>
              {invoice.cancellationCode}
            </p>
            <p>
              <span className="text-muted-foreground">
                {copy.label.description}:{" "}
              </span>
              {invoice.cancellationReason}
            </p>
            {invoice.replacementCfdiUuid && (
              <p>
                <span className="text-muted-foreground">
                  {copy.label.substitutionUuid}:{" "}
                </span>
                {invoice.replacementCfdiUuid}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </DetailPageShell>
  );
}
