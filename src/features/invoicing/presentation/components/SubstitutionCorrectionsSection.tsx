import { ChevronDown } from "lucide-react";
import { Controller, type Control } from "react-hook-form";
import {
  FormaPagoSelect,
  MetodoPagoSelect,
  RegimenFiscalSelect,
  UsoCfdiSelect,
} from "@features/catalogs/presentation/components";
import { Input } from "@shared/ui/input";
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

const copy = invoicingCopy.detail.substitute.corrections;

interface Props {
  control: Control<SubstituteInvoiceSheetValues>;
}

export function SubstitutionCorrectionsSection({ control }: Props) {
  return (
    <Collapsible className="rounded-md border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
        <span>{copy.sectionTitle}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 border-t px-4 py-4">
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
      </CollapsibleContent>
    </Collapsible>
  );
}
