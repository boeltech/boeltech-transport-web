import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
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
} from "../utils/accountStatementChannels";

type StatementFormat = "pdf" | "csv";

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
 * Hoja K9 — descarga unificada Estado de cuenta (PDF/CSV F0b).
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
          key={row.clientRfc || row.clientId || row.clientName}
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
  const canDownload =
    Boolean(row.clientRfc.trim()) && hasBalance && !downloadEmpty && !isPending;
  const todayLabel = formatDate(new Date().toISOString());

  function handleDownload() {
    const rfc = row.clientRfc.trim().toUpperCase();
    if (!rfc) return;
    if (format === "pdf") {
      downloadPdf.mutate(rfc);
      return;
    }
    downloadCsv.mutate({ clientRfc: rfc });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <div className="space-y-1 text-sm text-muted-foreground">
        {row.clientRfc ? (
          <p>
            <span className="font-mono">{row.clientRfc}</span>
            {" · "}
            {copy.cutoff(todayLabel)}
          </p>
        ) : (
          <p>
            {tableCopy.noRfcHint}
            {" · "}
            {copy.cutoff(todayLabel)}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{copy.includesTitle}</h3>
        <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{copy.includeInvoices}</p>
              <p className="text-xs text-muted-foreground">
                {copy.includeInvoicesHint}
              </p>
            </div>
            <p className="shrink-0 tabular-nums text-muted-foreground">
              {row.openInvoiceCount} · {formatMxCurrency(invoiced)}
            </p>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{copy.includeOperational}</p>
              <p className="text-xs text-muted-foreground">
                {copy.includeOperationalHint}
              </p>
            </div>
            <p className="shrink-0 tabular-nums text-muted-foreground">
              {row.operationalTripCount} · {formatMxCurrency(operational)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{copy.summaryTitle}</h3>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{copy.includeInvoices}</dt>
          <dd className="tabular-nums">{formatMxCurrency(invoiced)}</dd>
          <dt className="text-muted-foreground">{copy.includeOperational}</dt>
          <dd className="tabular-nums">{formatMxCurrency(operational)}</dd>
          <dt className="font-semibold text-foreground">{copy.totalReceivable}</dt>
          <dd className="font-semibold tabular-nums">
            {formatMxCurrency(row.balanceDue)}
          </dd>
          <dt className="text-muted-foreground">{copy.overdue}</dt>
          <dd className="tabular-nums">{formatMxCurrency(row.overdueAmount)}</dd>
        </dl>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-statement-format">{copy.formatLabel}</Label>
        <Select
          value={format}
          onValueChange={(value) => {
            if (value === "pdf" || value === "csv") setFormat(value);
          }}
        >
          <SelectTrigger id="account-statement-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">{copy.formatPdf}</SelectItem>
            <SelectItem value="csv">{copy.formatCsv}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Alert>
        <AlertDescription>{copy.legend}</AlertDescription>
      </Alert>

      {downloadEmpty || !hasBalance ? (
        <Alert variant="destructive">
          <AlertDescription>{copy.empty}</AlertDescription>
        </Alert>
      ) : null}

      {!row.clientRfc.trim() ? (
        <Alert>
          <AlertDescription>
            Este cliente no tiene RFC; la descarga por RFC no está disponible.
          </AlertDescription>
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
