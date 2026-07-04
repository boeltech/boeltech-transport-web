import { Calculator } from "lucide-react";
import { useWatch, type Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { RHFMoneyField } from "@shared/ui/form";
import { Separator } from "@shared/ui/separator";
import { cn } from "@shared/lib/utils/cn";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { InvoiceFormValues } from "../validation/invoiceFormSchema";

const copy = invoicingCopy;
const panelCopy = invoicingCopy.amountsPanel;

export interface InvoiceAmountsSummaryPanelProps {
  control: Control<InvoiceFormValues>;
  className?: string;
}

export function InvoiceAmountsSummaryPanel({
  control,
  className,
}: InvoiceAmountsSummaryPanelProps) {
  const subtotal = useWatch({ control, name: "subtotal" }) ?? 0;
  const totalTax = useWatch({ control, name: "total_tax" }) ?? 0;
  const retainedTax = useWatch({ control, name: "retained_tax" }) ?? 0;
  const total = useWatch({ control, name: "total" }) ?? 0;

  return (
    <Card className={cn("h-fit", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4 shrink-0" />
          {panelCopy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InfoRow
          variant="inline"
          label={copy.label.subtotal}
          value={formatMxCurrency(subtotal)}
        />
        <RHFMoneyField control={control} name="discount" label={copy.label.discount} />
        <InfoRow
          variant="inline"
          label={
            <>
              {copy.label.iva}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({panelCopy.ivaPerConceptHint})
              </span>
            </>
          }
          value={formatMxCurrency(totalTax)}
        />

        {retainedTax > 0 ? (
          <InfoRow
            variant="inline"
            label={
              <>
                {copy.label.retainedTax}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (4% {panelCopy.retentionPerConceptHint})
                </span>
              </>
            }
            value={formatMxCurrency(retainedTax)}
          />
        ) : null}

        <Separator />

        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-3">
          <InfoRow
            variant="inline"
            label={panelCopy.totalLabel}
            value={
              <span className="text-lg font-semibold tabular-nums">
                {formatMxCurrency(total)}
              </span>
            }
          />
        </div>

        <p className="text-xs text-muted-foreground">{panelCopy.hint}</p>
      </CardContent>
    </Card>
  );
}
