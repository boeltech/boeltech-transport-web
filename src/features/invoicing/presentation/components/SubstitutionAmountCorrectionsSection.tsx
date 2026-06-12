import { useEffect } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Controller, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { useBillingSettings } from "@features/settings";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { RHFMoneyField } from "@shared/ui/form";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  RETAINED_TAX_RATE,
  type SubstituteInvoiceSheetValues,
} from "../validation/substitutionCorrectionsSchema";

const copy = invoicingCopy.detail.substitute.amounts;
const labels = invoicingCopy.label;
const hints = invoicingCopy.hint;

interface Props {
  control: Control<SubstituteInvoiceSheetValues>;
  setValue: UseFormSetValue<SubstituteInvoiceSheetValues>;
  invoiceRetainedTax: number;
  hasTripCorrections?: boolean;
  /** Solo recalcula IVA/retención/total tras edición explícita de importes. */
  enableAutoSync?: boolean;
}

export function SubstitutionAmountCorrectionsSection({
  control,
  setValue,
  invoiceRetainedTax,
  hasTripCorrections = false,
  enableAutoSync = false,
}: Props) {
  const { data: billing } = useBillingSettings();
  const taxRate = billing?.tasaIva ?? 0.16;

  const subtotal = useWatch({ control, name: "subtotal" });
  const discount = useWatch({ control, name: "discount" });
  const applyRetainedTax = useWatch({ control, name: "apply_retained_tax" });

  const showRetainedTax = invoiceRetainedTax > 0 || applyRetainedTax;

  useEffect(() => {
    if (!enableAutoSync) {
      return;
    }
    const base = (subtotal ?? 0) - (discount ?? 0);
    if (base < 0) {
      return;
    }
    const shouldApplyRetained =
      applyRetainedTax ?? invoiceRetainedTax > 0;
    const tax = Math.round(base * taxRate * 100) / 100;
    const retained = shouldApplyRetained
      ? Math.round(base * RETAINED_TAX_RATE * 100) / 100
      : 0;
    const total = Math.round((base + tax - retained) * 100) / 100;
    setValue("total_tax", tax, { shouldValidate: false, shouldDirty: false });
    setValue("retained_tax", retained, { shouldValidate: false, shouldDirty: false });
    setValue("total", total, { shouldValidate: false, shouldDirty: false });
  }, [
    enableAutoSync,
    subtotal,
    discount,
    taxRate,
    applyRetainedTax,
    invoiceRetainedTax,
    setValue,
  ]);

  return (
    <Collapsible className="rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
        <span>{copy.sectionTitle}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 border-t px-4 py-4">
        <p className="text-xs text-muted-foreground">
          {hasTripCorrections ? copy.sectionHintWithTripCorrections : copy.sectionHint}
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <RHFMoneyField control={control} name="subtotal" label={labels.subtotal} />
          <RHFMoneyField control={control} name="discount" label={labels.discount} />
          <RHFMoneyField control={control} name="total" label={labels.total} />
          <RHFMoneyField
            control={control}
            name="total_tax"
            label={
              <>
                {labels.iva}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({(taxRate * 100).toFixed(0)}%)
                </span>
              </>
            }
          />
        </div>

        {showRetainedTax ? (
          <div className="space-y-3">
            <Controller
              control={control}
              name="apply_retained_tax"
              render={({ field }) => (
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="substitute_apply_retained_tax"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <div className="space-y-0.5">
                    <label
                      htmlFor="substitute_apply_retained_tax"
                      className="cursor-pointer text-sm font-medium leading-none"
                    >
                      {labels.retainedTaxApply}
                    </label>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Info className="h-3 w-3 shrink-0" />
                      {hints.retainedTax}
                    </p>
                  </div>
                </div>
              )}
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <RHFMoneyField
                control={control}
                name="retained_tax"
                label={
                  <>
                    {labels.retainedTax}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (4%)
                    </span>
                  </>
                }
              />
            </div>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">{hints.amountsAuto}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}
