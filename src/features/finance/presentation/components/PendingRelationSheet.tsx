import { useState } from "react";
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
import { Skeleton } from "@shared/ui/skeleton";
import { formatDate } from "@shared/utils/dateUtils";
import type { PendingRelationFileFormat } from "@features/finance/domain";
import {
  useDownloadPendingRelation,
  usePendingRelationCount,
} from "@features/finance/application";
import { financeCopy } from "../copy";

interface PendingRelationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientRfc: string;
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

export function PendingRelationSheet({
  open,
  onOpenChange,
  clientName,
  clientRfc,
}: PendingRelationSheetProps) {
  const copy = financeCopy.summary.accountStatement.pendingRelation;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{copy.sheetTitle}</SheetTitle>
        </SheetHeader>
        <PendingRelationSheetBody
          key={clientRfc}
          clientName={clientName}
          clientRfc={clientRfc}
          onOpenChange={onOpenChange}
        />
      </SheetContent>
    </Sheet>
  );
}

function PendingRelationSheetBody({
  clientName,
  clientRfc,
  onOpenChange,
}: Omit<PendingRelationSheetProps, "open">) {
  const copy = financeCopy.summary.accountStatement.pendingRelation;
  const { toast } = useToast();
  const [format, setFormat] = useState<PendingRelationFileFormat>("pdf");
  const [downloadEmpty, setDownloadEmpty] = useState(false);

  const countQuery = usePendingRelationCount(clientRfc, true);
  const download = useDownloadPendingRelation({
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

  const generatedOn = countQuery.data?.generatedOn ?? "";
  const invoiceCount = countQuery.data?.invoiceCount;
  const countReady = countQuery.isSuccess;
  const hasInvoices =
    countReady &&
    invoiceCount !== undefined &&
    invoiceCount > 0 &&
    !downloadEmpty;
  const downloadDisabled =
    countQuery.isPending ||
    countQuery.isError ||
    !countReady ||
    invoiceCount === 0 ||
    generatedOn === "" ||
    download.isPending ||
    downloadEmpty;

  function handleFormatChange(value: string) {
    if (value === "pdf" || value === "csv") setFormat(value);
  }

  function handleDownload() {
    if (downloadDisabled || generatedOn === "") return;
    setDownloadEmpty(false);
    download.mutate({ clientRfc, format, generatedOn });
  }

  return (
    <>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <p className="text-sm">{copy.objective}</p>
          <p className="text-sm text-muted-foreground">{copy.legend}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">{clientName}</p>
          <p className="font-mono text-sm text-muted-foreground">{clientRfc}</p>
        </div>

        {countQuery.isPending ? (
          <div className="space-y-2" aria-hidden>
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : null}

        {hasInvoices && generatedOn !== "" ? (
          <p className="text-sm">
            {copy.cutoffSummary(formatDate(generatedOn), invoiceCount)}
          </p>
        ) : null}

        {countReady && invoiceCount === 0 ? (
          <p className="text-sm">{copy.empty}</p>
        ) : null}

        {downloadEmpty ? (
          <Alert>
            <AlertDescription>{copy.empty}</AlertDescription>
          </Alert>
        ) : null}

        {countQuery.isError ? (
          <div className="space-y-2">
            <Alert variant="destructive">
              <AlertDescription>{copy.countError}</AlertDescription>
            </Alert>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void countQuery.refetch();
              }}
            >
              {financeCopy.summary.errors.retry}
            </Button>
          </div>
        ) : null}

        {hasInvoices ? (
          <div className="space-y-1.5">
            <Label htmlFor="pending-relation-format">{copy.formatLabel}</Label>
            <Select value={format} onValueChange={handleFormatChange}>
              <SelectTrigger id="pending-relation-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">{copy.formatPdf}</SelectItem>
                <SelectItem value="csv">{copy.formatCsv}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      <SheetFooter>
        <Button
          type="button"
          disabled={downloadDisabled}
          isLoading={download.isPending}
          onClick={handleDownload}
        >
          {copy.downloadAction}
        </Button>
      </SheetFooter>
    </>
  );
}
