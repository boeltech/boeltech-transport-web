import { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@shared/lib/utils/cn";
import {
  FormaPagoSelect,
  MetodoPagoSelect,
  RegimenFiscalSelect,
  UsoCfdiSelect,
} from "@features/catalogs/presentation/components";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Separator } from "@shared/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFCatalogField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  SUBSTITUTION_SHEET_BODY_CLASS,
  SUBSTITUTION_SHEET_CONTENT_CLASS,
  SUBSTITUTION_SHEET_FOOTER_CLASS,
  SUBSTITUTION_SHEET_HEADER_CLASS,
  SUBSTITUTION_SHEET_PRIMARY_BUTTON_CLASS,
} from "./substitutionSheetLayout";
import {
  invoiceReceiverFormSchema,
  type InvoiceReceiverFormValues,
} from "../validation/invoiceFormSchema";

const copy = invoicingCopy;
const comprobanteCopy = invoicingCopy.comprobante;
const sheetCopy = invoicingCopy.comprobante.sheet;

/** Nombre primero, código como referencia secundaria: el código no aporta a la decisión. */
const CATALOG_DISPLAY_FORMAT = "name-code" as const;

export interface InvoiceReceiverEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Valores vigentes del formulario padre. */
  values: InvoiceReceiverFormValues;
  onApply: (values: InvoiceReceiverFormValues) => void;
  /** Se abre desde un envío fallido: muestra los errores de una vez. */
  validateOnOpen?: boolean;
  /** Campo al que llevar el foco al abrir. */
  focusField?: keyof InvoiceReceiverFormValues;
}

/**
 * Corrección de los datos fiscales del receptor y las condiciones de cobro.
 * Solo afecta a esta factura; el schema es el mismo del formulario de alta.
 */
export function InvoiceReceiverEditSheet({
  open,
  onOpenChange,
  values,
  onApply,
  validateOnOpen = false,
  focusField,
}: InvoiceReceiverEditSheetProps) {
  const [showSummary, setShowSummary] = useState(false);

  const form = useForm<InvoiceReceiverFormValues>({
    resolver: zodResolver(
      invoiceReceiverFormSchema as never,
    ) as Resolver<InvoiceReceiverFormValues>,
    defaultValues: values,
    mode: "onChange",
  });

  const { control, handleSubmit, reset, trigger, setFocus, formState } = form;

  useEffect(() => {
    if (!open) return;
    reset(values);
    setShowSummary(validateOnOpen);
    if (validateOnOpen) void trigger();
    if (focusField) setFocus(focusField);
    // Reset controlado por apertura: no re-sincronizar mientras el usuario edita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = (next: boolean) => {
    if (!next) setShowSummary(false);
    onOpenChange(next);
  };

  const submit = handleSubmit(
    (nextValues) => {
      onApply(nextValues);
      handleClose(false);
    },
    () => {
      setShowSummary(true);
    },
  );

  const summaryMessages = collectFieldErrorMessages(formState.errors);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className={SUBSTITUTION_SHEET_CONTENT_CLASS} side="right">
        <SheetHeader className={SUBSTITUTION_SHEET_HEADER_CLASS}>
          <SheetTitle>{sheetCopy.title}</SheetTitle>
          <SheetDescription>{sheetCopy.description}</SheetDescription>
        </SheetHeader>

        <div className={SUBSTITUTION_SHEET_BODY_CLASS}>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {comprobanteCopy.subsectionReceiver}
            </h3>

            <RHFTextField
              control={control}
              name="receiver_name"
              label={copy.label.receiverName}
              placeholder={comprobanteCopy.receiverNamePlaceholder}
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="receiver_rfc"
                render={({ field, fieldState }) => (
                  <FormFieldShell
                    fieldId="receiver_rfc"
                    label={copy.label.rfc}
                    required
                    errorMessage={fieldState.error?.message}
                  >
                    <Input
                      id="receiver_rfc"
                      placeholder={comprobanteCopy.rfcPlaceholder}
                      className="font-mono"
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
                placeholder={comprobanteCopy.postalCodePlaceholder}
                maxLength={5}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RHFCatalogField
                control={control}
                name="receiver_tax_regime"
                label={copy.label.taxRegime}
                required
              >
                {({ field, fieldState, resolvedId, errorMessage }) => (
                  <RegimenFiscalSelect
                    triggerId={resolvedId}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={comprobanteCopy.selectPlaceholder}
                    showCode={false}
                    displayFormat={CATALOG_DISPLAY_FORMAT}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                  />
                )}
              </RHFCatalogField>
              <RHFCatalogField
                control={control}
                name="cfdi_usage"
                label={copy.label.cfdiUsage}
                required
              >
                {({ field, fieldState, resolvedId, errorMessage }) => (
                  <UsoCfdiSelect
                    triggerId={resolvedId}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={comprobanteCopy.selectPlaceholder}
                    showCode={false}
                    displayFormat={CATALOG_DISPLAY_FORMAT}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                  />
                )}
              </RHFCatalogField>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {comprobanteCopy.subsectionPayment}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RHFCatalogField
                control={control}
                name="payment_method"
                label={copy.label.paymentMethod}
                required
              >
                {({ field, fieldState, resolvedId, errorMessage }) => (
                  <MetodoPagoSelect
                    triggerId={resolvedId}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={comprobanteCopy.selectPlaceholder}
                    showCode={false}
                    displayFormat={CATALOG_DISPLAY_FORMAT}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                  />
                )}
              </RHFCatalogField>
              <RHFCatalogField
                control={control}
                name="payment_form"
                label={copy.label.paymentForm}
                required
              >
                {({ field, fieldState, resolvedId, errorMessage }) => (
                  <FormaPagoSelect
                    triggerId={resolvedId}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={comprobanteCopy.selectPlaceholder}
                    showCode={false}
                    displayFormat={CATALOG_DISPLAY_FORMAT}
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                  />
                )}
              </RHFCatalogField>
            </div>
          </div>

          {showSummary && summaryMessages.length > 0 ? (
            <FormValidationSummary
              title={sheetCopy.validationSummary}
              messages={summaryMessages}
            />
          ) : null}
        </div>

        <SheetFooter className={SUBSTITUTION_SHEET_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            {sheetCopy.close}
          </Button>
          <Button
            type="button"
            className={cn(SUBSTITUTION_SHEET_PRIMARY_BUTTON_CLASS, "shrink-0")}
            onClick={() => void submit()}
          >
            {sheetCopy.apply}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
