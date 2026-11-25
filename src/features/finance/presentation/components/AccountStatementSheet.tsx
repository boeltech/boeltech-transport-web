import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { AccountStatementItem } from "@features/finance/domain";
import {
  useDownloadAccountStatementCsv,
  useDownloadAccountStatementPdf,
} from "@features/finance/application";
import { financeCopy } from "../copy";
import {
  getAccountStatementInvoicedBalance,
  getAccountStatementOperationalBalance,
  getAccountStatementTarget,
} from "../utils/accountStatementChannels";

const FORMATS = ["pdf", "csv"] as const;
type StatementFormat = (typeof FORMATS)[number];

interface AccountStatementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: AccountStatementItem;
}

function httpStatusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const record = error as {
    status?: unknown;
    response?: { status?: unknown };
  };
  if (typeof record.response?.status === "number") return record.response.status;
  if (typeof record.status === "number") return record.status;
  return undefined;
}

/**
 * Hoja K9 / K11 — Estado de cuenta: PDF o CSV con detalle por factura y viaje.
 * Retira «Resumen (PDF)» y «Relación» de Operate.
 */
export function AccountStatementSheet({
  open,
  onOpenChange,
  row,
}: AccountStatementSheetProps) {
  const copy = financeCopy.summary.accountStatement.sheet;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-md overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {copy.title}
          </p>
          <SheetTitle>{row.clientName}</SheetTitle>
        </SheetHeader>
        <AccountStatementSheetBody
          key={row.clientId || row.clientRfc || row.clientName}
          row={row}
          onOpenChange={onOpenChange}
        />
      </SheetContent>
    </Sheet>
  );
}

function AccountStatementSheetBody({
  row,
  onOpenChange,
}: {
  row: AccountStatementItem;
  onOpenChange: (open: boolean) => void;
}) {
  const copy = financeCopy.summary.accountStatement.sheet;
  const tableCopy = financeCopy.summary.accountStatement;
  const { toast } = useToast();
  const [format, setFormat] = useState<StatementFormat>("pdf");
  const [downloadEmpty, setDownloadEmpty] = useState(false);

  const downloadPdf = useDownloadAccountStatementPdf({
    onSuccess: () => {
      toast({ variant: "success", title: copy.successToast });
      onOpenChange(false);
    },
    onError: (error) => {
      if (httpStatusOf(error) === 404) {
        setDownloadEmpty(true);
        return;
      }
      toast({
        variant: "error",
        title: getErrorMessage(error),
      });
    },
  });

  const downloadCsv = useDownloadAccountStatementCsv({
    onSuccess: () => {
      toast({ variant: "success", title: copy.successToast });
      onOpenChange(false);
    },
    onError: (error) => {
      if (httpStatusOf(error) === 404) {
        setDownloadEmpty(true);
        return;
      }
      toast({
        variant: "error",
        title: getErrorMessage(error),
      });
    },
  });

  const invoiced = getAccountStatementInvoicedBalance(row);
  const operational = getAccountStatementOperationalBalance(row);
  const hasBalance = row.balanceDue > 0.009;
  const isPending = downloadPdf.isPending || downloadCsv.isPending;
  const target = getAccountStatementTarget(row);
  const canDownload =
    target !== null && hasBalance && !downloadEmpty && !isPending;
  const todayLabel = formatDate(new Date().toISOString());
  const formatLabels: Record<StatementFormat, string> = {
    pdf: copy.formatPdf,
    csv: copy.formatCsv,
  };
  const sections = [
    {
      title: copy.includeInvoices,
      hint: copy.includeInvoicesHint,
      count: row.invoicesWithBalanceCount,
      amount: invoiced,
    },
    {
      title: copy.includeOperational,
      hint: copy.includeOperationalHint,
      count: row.operationalTripCount,
      amount: operational,
    },
  ];

  function handleDownload() {
    if (!target) return;
    if (format === "pdf") {
      downloadPdf.mutate(target);
      return;
    }
    downloadCsv.mutate({ target });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <p className="text-sm text-muted-foreground">
        {row.clientRfc ? (
          <span className="font-mono">{row.clientRfc}</span>
        ) : (
          tableCopy.noRfcHint
        )}
        {" · "}
        {copy.cutoff(todayLabel)}
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{copy.includesTitle}</h3>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li
              key={section.title}
              className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{section.title}</p>
                <p className="text-xs text-muted-foreground">{section.hint}</p>
              </div>
              <p className="shrink-0 font-mono tabular-nums">
                {section.count} · {formatMxCurrency(section.amount)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{copy.summaryTitle}</h3>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm [&_dd]:text-right [&_dd]:font-mono [&_dd]:tabular-nums">
          <dt className="text-muted-foreground">{copy.includeInvoices}</dt>
          <dd>{formatMxCurrency(invoiced)}</dd>
          <dt className="text-muted-foreground">{copy.includeOperational}</dt>
          <dd>{formatMxCurrency(operational)}</dd>
          <dt className="font-semibold text-foreground">{copy.totalReceivable}</dt>
          <dd className="font-semibold">{formatMxCurrency(row.balanceDue)}</dd>
          <dt className="text-muted-foreground">{copy.overdue}</dt>
          <dd>{formatMxCurrency(row.overdueAmount)}</dd>
        </dl>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">{copy.formatLabel}</legend>
        {/* Control segmentado (DS: no son tabs). Radios nativos: flechas y foco. */}
        <div className="inline-flex rounded-lg border bg-muted p-1">
          {FORMATS.map((value) => (
            <label
              key={value}
              className="cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name="account-statement-format"
                value={value}
                checked={format === value}
                onChange={() => setFormat(value)}
                className="sr-only"
              />
              {formatLabels[value]}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{copy.csvNote}</p>
      </fieldset>

      <p className="rounded-lg border border-dashed border-border bg-muted/50 p-3 text-xs text-muted-foreground">
        {copy.legend}
      </p>

      {downloadEmpty || !hasBalance ? (
        <Alert variant="destructive">
          <AlertDescription>{copy.empty}</AlertDescription>
        </Alert>
      ) : null}

      {target === null ? (
        <Alert>
          <AlertDescription>{copy.unavailable}</AlertDescription>
        </Alert>
      ) : null}

      <SheetFooter className="gap-2 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {copy.cancel}
        </Button>
        <Button
          type="button"
          disabled={!canDownload}
          onClick={handleDownload}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {copy.download}
        </Button>
      </SheetFooter>
    </div>
  );
}
