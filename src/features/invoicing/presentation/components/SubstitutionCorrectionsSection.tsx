import { ChevronDown } from "lucide-react";
import { Controller, type Control } from "react-hook-form";
import {
  FormaPagoSelect,
  MetodoPagoSelect,
  RegimenFiscalSelect,
  UsoCfdiSelect,
} from "@features/catalogs/presentation/components";
import { usePermissions } from "@shared/permissions";
import { Checkbox } from "@shared/ui/checkbox";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  FormFieldShell,
  RHFCatalogField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { SubstituteInvoiceSheetValues } from "../validation/substitutionCorrectionsSchema";
import {
  SUBSTITUTION_COLLAPSIBLE_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS,
  SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS,
} from "./substitutionSheetLayout";

const copy = invoicingCopy.detail.substitute.corrections;
const sheetCopy = invoicingCopy.detail.substitute;

interface Props {
  control: Control<SubstituteInvoiceSheetValues>;
}

export function SubstitutionCorrectionsSection({ control }: Props) {
  const { hasPermission } = usePermissions();
  const canPropagateToClient = hasPermission("clients", "update");

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
        <p className="text-xs text-muted-foreground">{copy.sectionHint}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="receiver_rfc"
            render={({ field, fieldState }) => (
              <FormFieldShell
                fieldId="substitute_receiver_rfc"
                label={copy.rfc}
                errorMessage={fieldState.error?.message}
              >
                <Input
                  id="substitute_receiver_rfc"
                  placeholder="XAXX010101000"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps(
                    "substitute_receiver_rfc",
                    fieldState.error?.message,
                  )}
                />
              </FormFieldShell>
            )}
          />
          <RHFTextField
            control={control}
            name="receiver_postal_code"
            label={copy.postalCode}
            placeholder="12345"
            maxLength={5}
          />
        </div>

        <RHFTextField
          control={control}
          name="receiver_name"
          label={copy.receiverName}
          placeholder="Nombre del receptor"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RHFCatalogField
            control={control}
            name="receiver_tax_regime"
            label={copy.taxRegime}
          >
            {({ field, fieldState, resolvedId, errorMessage }) => (
              <RegimenFiscalSelect
                triggerId={resolvedId}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecciona régimen"
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              />
            )}
          </RHFCatalogField>
          <RHFCatalogField control={control} name="cfdi_usage" label={copy.cfdiUsage}>
            {({ field, fieldState, resolvedId, errorMessage }) => (
              <UsoCfdiSelect
                triggerId={resolvedId}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecciona uso"
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              />
            )}
          </RHFCatalogField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RHFCatalogField control={control} name="payment_form" label={copy.paymentForm}>
            {({ field, fieldState, resolvedId, errorMessage }) => (
              <FormaPagoSelect
                triggerId={resolvedId}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecciona"
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              />
            )}
          </RHFCatalogField>
          <RHFCatalogField control={control} name="payment_method" label={copy.paymentMethod}>
            {({ field, fieldState, resolvedId, errorMessage }) => (
              <MetodoPagoSelect
                triggerId={resolvedId}
                value={field.value}
                onValueChange={field.onChange}
                placeholder="Selecciona"
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              />
            )}
          </RHFCatalogField>
        </div>

        {canPropagateToClient ? (
          <Controller
            control={control}
            name="propagate_receiver_to_client"
            render={({ field }) => (
              <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
                <Checkbox
                  id="substitute_propagate_receiver"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="substitute_propagate_receiver"
                    className="text-sm font-medium leading-none"
                  >
                    {copy.propagateLabel}
                  </Label>
                  <p className="text-xs text-muted-foreground">{copy.propagateHint}</p>
                </div>
              </div>
            )}
          />
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
