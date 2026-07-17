import { useEffect, type ReactNode } from "react";
import { ChevronDown, Info } from "lucide-react";
import {
  Controller,
  useWatch,
  type Control,
  type FieldPath,
  type UseFormSetValue,
} from "react-hook-form";
import { useBillingSettings } from "@features/settings";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  FieldInlineError,
  MoneyInput,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  RETAINED_TAX_RATE,
  type SubstituteInvoiceSheetValues,
} from "../validation/substitutionCorrectionsSchema";
import {
  SUBSTITUTION_AMOUNT_INPUT_WIDTH_CLASS,
  SUBSTITUTION_AMOUNT_LABEL_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS,
  SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS,
} from "./substitutionSheetLayout";

const copy = invoicingCopy.detail.substitute.amounts;
const sheetCopy = invoicingCopy.detail.substitute;
const detailLabels = invoicingCopy.detail.label;
const labels = invoicingCopy.label;
const hints = invoicingCopy.hint;

interface Props {
  control: Control<SubstituteInvoiceSheetValues>;
  setValue: UseFormSetValue<SubstituteInvoiceSheetValues>;
  invoiceRetainedTax: number;
  hasTripCorrections?: boolean;
  /** Solo recalcula IVA/retención/total tras edición explícita de importes. */
  enableAutoSync?: boolean;
  retentionRequired?: boolean;
}

function SubstitutionAmountMoneyField({
  control,
  name,
  label,
  fieldId,
}: {
  control: Control<SubstituteInvoiceSheetValues>;
  name: FieldPath<SubstituteInvoiceSheetValues>;
  label: ReactNode;
  fieldId?: string;
}) {
  const resolvedId = fieldId ?? String(name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        const resolvedValue =
          typeof field.value === "number" && Number.isFinite(field.value)
            ? field.value
            : undefined;

        return (
          <div className="flex justify-end">
            <div className={SUBSTITUTION_AMOUNT_INPUT_WIDTH_CLASS}>
              <Label htmlFor={resolvedId} className={SUBSTITUTION_AMOUNT_LABEL_CLASS}>
                {label}
              </Label>
              <MoneyInput
                id={resolvedId}
                name={field.name}
                value={resolvedValue}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(fieldState.error)}
                className="w-full"
                {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              />
              <FieldInlineError fieldId={resolvedId} message={errorMessage} />
            </div>
          </div>
        );
      }}
    />
  );
}

export function SubstitutionAmountCorrectionsSection({
  control,
  setValue,
  invoiceRetainedTax,
  hasTripCorrections = false,
  enableAutoSync = false,
  retentionRequired = false,
}: Props) {
  const { data: billing } = useBillingSettings();
  const taxRate = billing?.tasaIva ?? 0.16;

  const subtotal = useWatch({ control, name: "subtotal" });
  const discount = useWatch({ control, name: "discount" });
  const applyRetainedTax = useWatch({ control, name: "apply_retained_tax" });

  const showRetainedTax = retentionRequired || invoiceRetainedTax > 0 || applyRetainedTax;

  useEffect(() => {
    if (retentionRequired) {
      setValue("apply_retained_tax", true, { shouldValidate: false, shouldDirty: false });
    }
  }, [retentionRequired, setValue]);

  useEffect(() => {
    if (!enableAutoSync) {
      return;
    }
    const base = (subtotal ?? 0) - (discount ?? 0);
    if (base < 0) {
      return;
    }
    const shouldApplyRetained =
      retentionRequired || applyRetainedTax || invoiceRetainedTax > 0;
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
    retentionRequired,
    setValue,
  ]);

  const retainedTaxFieldId = "substitute_retained_tax";

  return (
    <Collapsible defaultOpen={false} className={SUBSTITUTION_COLLAPSIBLE_CLASS}>
      <CollapsibleTrigger className={SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS}>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>{copy.sectionTitle}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {sheetCopy.optionalBadge}
          </span>
        </span>
        <ChevronDown className={SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS} />
      </CollapsibleTrigger>
      <CollapsibleContent className={SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS}>
        <p className="text-xs text-muted-foreground">
          {hasTripCorrections ? copy.sectionHintWithTripCorrections : copy.sectionHint}
        </p>

        <div className="space-y-4">
          <SubstitutionAmountMoneyField
            control={control}
            name="subtotal"
            label={detailLabels.subtotal}
          />

          <SubstitutionAmountMoneyField
            control={control}
            name="total_tax"
            label={
              <>
                {detailLabels.ivaTrasladado}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({(taxRate * 100).toFixed(0)}%)
                </span>
              </>
            }
            fieldId="substitute_total_tax"
          />

          {showRetainedTax ? (
            <div className="flex flex-wrap items-end justify-end gap-x-3 gap-y-2">
              <div className="flex min-w-0 items-center gap-2">
                <Controller
                  control={control}
                  name="apply_retained_tax"
                  render={({ field }) => (
                    <>
                      <Checkbox
                        id="substitute_apply_retained_tax"
                        checked={retentionRequired ? true : field.value}
                        disabled={retentionRequired}
                        onCheckedChange={field.onChange}
                      />
                      <label
                        htmlFor="substitute_apply_retained_tax"
                        className="cursor-pointer text-xs font-medium leading-tight sm:text-sm sm:leading-none"
                      >
                        {labels.retainedTaxApply}
                      </label>
                      <span
                        className="text-muted-foreground"
                        title={hints.retainedTax}
                      >
                        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="sr-only">{hints.retainedTax}</span>
                      </span>
                    </>
                  )}
                />
              </div>
              <Controller
                control={control}
                name="retained_tax"
                render={({ field, fieldState }) => {
                  const errorMessage = fieldState.error?.message;
                  const resolvedValue =
                    typeof field.value === "number" && Number.isFinite(field.value)
                      ? field.value
                      : undefined;

                  return (
                    <div className={SUBSTITUTION_AMOUNT_INPUT_WIDTH_CLASS}>
                      <Label
                        htmlFor={retainedTaxFieldId}
                        className={SUBSTITUTION_AMOUNT_LABEL_CLASS}
                      >
                        {detailLabels.ivaRetenido}{" "}
                        <span className="text-xs font-normal">(4%)</span>
                      </Label>
                      <MoneyInput
                        id={retainedTaxFieldId}
                        name={field.name}
                        value={resolvedValue}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        error={Boolean(fieldState.error)}
                        className="w-full"
                        {...getFieldErrorAriaProps(
                          retainedTaxFieldId,
                          errorMessage,
                        )}
                      />
                      <FieldInlineError
                        fieldId={retainedTaxFieldId}
                        message={errorMessage}
                      />
                    </div>
                  );
                }}
              />
            </div>
          ) : null}

          <SubstitutionAmountMoneyField
            control={control}
            name="discount"
            label={detailLabels.discount}
          />

          <div className="border-t pt-4">
            <SubstitutionAmountMoneyField
              control={control}
              name="total"
              label={detailLabels.total}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{hints.amountsAuto}</p>
      </CollapsibleContent>
    </Collapsible>
  );
}
