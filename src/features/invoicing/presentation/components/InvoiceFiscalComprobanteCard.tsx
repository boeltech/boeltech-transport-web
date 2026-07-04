import { CreditCard, FileText, UserRound } from "lucide-react";
import { Controller, type Control } from "react-hook-form";
import {
  FormaPagoSelect,
  MetodoPagoSelect,
  UsoCfdiSelect,
  RegimenFiscalSelect,
  CatalogSelect,
} from "@features/catalogs/presentation/components";
import { Input } from "@shared/ui/input";
import { Separator } from "@shared/ui/separator";
import {
  FormFieldShell,
  RHFCatalogField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { InvoiceFormValues } from "../validation/invoiceFormSchema";

const copy = invoicingCopy;
const comprobanteCopy = invoicingCopy.comprobante;

export interface InvoiceFiscalComprobanteCardProps {
  control: Control<InvoiceFormValues>;
}

export function InvoiceFiscalComprobanteCard({ control }: InvoiceFiscalComprobanteCardProps) {
  return (
    <FormSectionCard
      title={copy.section.comprobante}
      description={comprobanteCopy.description}
      icon={<FileText className="h-4 w-4" />}
      contentClassName="space-y-6"
    >
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden />
          {comprobanteCopy.subsectionReceiver}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="receiver_rfc"
            render={({ field, fieldState }) => (
              <FormFieldShell
                fieldId="receiver_rfc"
                label={copy.label.rfc}
                errorMessage={fieldState.error?.message}
              >
                <Input
                  id="receiver_rfc"
                  placeholder="XAXX010101000"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  error={Boolean(fieldState.error)}
                  {...getFieldErrorAriaProps("receiver_rfc", fieldState.error?.message)}
                />
              </FormFieldShell>
            )}
          />
          <RHFTextField
            control={control}
            name="receiver_postal_code"
            label={copy.label.postalCode}
            placeholder="12345"
            maxLength={5}
          />
        </div>

        <RHFTextField
          control={control}
          name="receiver_name"
          label={copy.label.receiverName}
          placeholder="Nombre del receptor"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RHFCatalogField
            control={control}
            name="receiver_tax_regime"
            label={copy.label.taxRegime}
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
          <RHFCatalogField control={control} name="cfdi_usage" label={copy.label.cfdiUsage}>
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
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden />
          {comprobanteCopy.subsectionPayment}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RHFCatalogField control={control} name="payment_form" label={copy.label.paymentForm}>
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
          <RHFCatalogField
            control={control}
            name="payment_method"
            label={copy.label.paymentMethod}
          >
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
          <RHFCatalogField control={control} name="currency" label={copy.label.currency}>
            {({ field, fieldState, resolvedId, errorMessage }) => (
              <CatalogSelect
                typeCode="sat_moneda"
                triggerId={resolvedId}
                value="MXN"
                onValueChange={field.onChange}
                placeholder="MXN - Peso Mexicano"
                displayFormat="code-name"
                disabled
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(resolvedId, errorMessage)}
              />
            )}
          </RHFCatalogField>
        </div>
      </div>
    </FormSectionCard>
  );
}
