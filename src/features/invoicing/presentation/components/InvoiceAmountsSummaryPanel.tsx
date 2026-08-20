import type { ReactNode } from "react";
import { Calculator } from "lucide-react";
import { useWatch, type Control } from "react-hook-form";
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

/** Fila de importe segura en rail estrecho (sin breakpoints de viewport). */
function AmountLine({
  label,
  value,
  emphasize,
}: {
  label: ReactNode;
  value: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="min-w-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span
        className={
          emphasize
            ? "shrink-0 text-lg font-semibold tabular-nums"
            : "shrink-0 text-sm tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
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
      contentClassName="space-y-1 pt-0"
    >
      <div className="divide-y divide-border">
        <AmountLine
          label={copy.label.subtotal}
          value={formatMxCurrency(subtotal)}
        />
        {discount > 0 ? (
          <AmountLine
            label={copy.label.discount}
            value={`- ${formatMxCurrency(discount)}`}
          />
        ) : null}
        <AmountLine
          label={
            <>
              {copy.label.iva}{" "}
              <span className="font-normal">({panelCopy.ivaPerConceptHint})</span>
            </>
          }
          value={formatMxCurrency(totalTax)}
        />
        {retainedTax > 0 ? (
          <AmountLine
            label={
              <>
                {copy.label.retainedTax}{" "}
                <span className="font-normal">
                  (4% {panelCopy.retentionPerConceptHint})
                </span>
              </>
            }
            value={`- ${formatMxCurrency(retainedTax)}`}
          />
        ) : null}
      </div>

      <Separator />

      <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
        <AmountLine
          label={panelCopy.totalLabel}
          value={formatMxCurrency(total)}
          emphasize
        />
      </div>

      {retainedTax > 0 ? (
        <p className="pt-2 text-xs text-muted-foreground">
          {panelCopy.retentionExplainer}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">{panelCopy.hint}</p>
    </FormSectionCard>
  );
}
