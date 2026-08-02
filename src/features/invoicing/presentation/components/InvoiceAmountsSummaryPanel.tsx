import { Calculator } from "lucide-react";
import { useWatch, type Control } from "react-hook-form";
import { InfoRow } from "@shared/ui/data-display";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Separator } from "@shared/ui/separator";
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

  const discount = useWatch({ control, name: "discount" }) ?? 0;

  return (
    <FormSectionCard
      title={panelCopy.title}
      icon={<Calculator className="h-4 w-4" />}
      className={className}
      contentClassName="space-y-3 pt-0"
    >
      <div>
        <InfoRow
          variant="inline"
          label={copy.label.subtotal}
          value={formatMxCurrency(subtotal)}
        />
        {discount > 0 ? (
          <InfoRow
            variant="inline"
            label={copy.label.discount}
            value={`- ${formatMxCurrency(discount)}`}
          />
        ) : null}
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
            value={`- ${formatMxCurrency(retainedTax)}`}
          />
        ) : null}
      </div>

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

      {retainedTax > 0 ? (
        <p className="text-xs text-muted-foreground">{panelCopy.retentionExplainer}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">{panelCopy.hint}</p>
    </FormSectionCard>
  );
}
