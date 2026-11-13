/**
 * Sheet lista de lotes del cliente (PRD D9).
 */

import {
  useClientOperationalReceiptBatches,
} from "@features/finance/application";
import {
  OPERATIONAL_PAYMENT_INSTRUMENT_LABELS,
  formatOperationalReceiptBatchLabel,
} from "@features/finance/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import { Skeleton } from "@shared/ui/skeleton";
import { HandCoins } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { operationalReceiptBatchCopy } from "../copy/operationalReceiptBatchCopy";

const copy = operationalReceiptBatchCopy;
const SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col overflow-hidden sm:max-w-md";

export interface ClientOperationalReceiptBatchesSheetProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenBatch: (batchId: string) => void;
}

export function ClientOperationalReceiptBatchesSheet({
  clientId,
  open,
  onOpenChange,
  onOpenBatch,
}: ClientOperationalReceiptBatchesSheetProps) {
  const query = useClientOperationalReceiptBatches(
    clientId ?? undefined,
    { page: 1, limit: 50, includeVoided: true },
    { enabled: open && Boolean(clientId) },
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={SHEET_CONTENT_CLASS}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>{copy.listSheet.title}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {query.isLoading ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !query.data?.data.length ? (
            <EmptyState
              icon={<HandCoins className="h-8 w-8" />}
              title={copy.listSheet.empty}
              size="sm"
            />
          ) : (
            <ul className="divide-y divide-border rounded-md border">
              {query.data.data.map((batch) => {
                const label = formatOperationalReceiptBatchLabel({
                  collectedAt: batch.collectedAt,
                  paymentInstrument: batch.paymentInstrument,
                  reference: batch.reference,
                  formatDate,
                });
                const isVoided = batch.voidedAt != null;
                return (
                  <li key={batch.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col gap-1 px-3 py-2.5 text-left hover:bg-muted/40"
                      aria-label={copy.listSheet.openAria(label)}
                      onClick={() => {
                        onOpenChange(false);
                        onOpenBatch(batch.id);
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{label}</span>
                        <Badge
                          variant={isVoided ? "neutral" : "info"}
                          tone="soft"
                          className="shrink-0"
                        >
                          {isVoided
                            ? copy.sheet.statusVoided
                            : copy.sheet.statusActive}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {
                            OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[
                              batch.paymentInstrument
                            ]
                          }
                        </span>
                        <span className="tabular-nums">
                          {formatMxCurrency(batch.amount)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <SheetFooter className="mt-auto shrink-0 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {copy.sheet.close}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
