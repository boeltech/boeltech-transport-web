import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { usePermissions } from "@shared/permissions";
import { InvoiceFormPageShell } from "../components/InvoiceFormPageShell";
import { InvoiceCreateContextCards } from "../components/InvoiceCreateContextCards";
import {
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
} from "../financeInvoiceFromTripCta";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  defaultInvoiceFormValues,
  invoiceFormSchema,
  parseCreateInvoicePayload,
  parseDraftInvoicePayload,
  RETAINED_TAX_RATE,
  type InvoiceFormValues,
} from "../validation/invoiceFormSchema";
import { formatInvoiceApiErrorMessages } from "../validation/formatInvoiceApiErrors";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Checkbox } from "@shared/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFCatalogField,
  RHFMoneyField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useToast } from "@shared/hooks";
import { getErrorMessage, isApiError } from "@shared/api/interceptors/error-handler";
import {
  FormaPagoSelect,
  MetodoPagoSelect,
  UsoCfdiSelect,
  RegimenFiscalSelect,
  CatalogSelect,
} from "@features/catalogs/presentation/components";
import {
  useCreateInvoice,
  useInvoice,
  useInvoicePrefill,
  useUpdateInvoice,
} from "@features/invoicing/application";
import { useTrip } from "@features/trips";

const copy = invoicingCopy;

export function CreateInvoicePage() {
  const { id: invoiceId } = useParams<{ id: string }>();
  const isEditMode = Boolean(invoiceId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get("trip_id") ?? "";
  const hasTripContext = Boolean(tripId);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canInvoiceFromTrip = canShowInvoiceFromTripCta(hasPermission);

  const shellBackHref =
    isEditMode && invoiceId
      ? `/invoices/${invoiceId}`
      : tripId
        ? `/trips/${tripId}`
        : "/finance?tab=invoices";

  const shellTitle = isEditMode ? copy.edit.title : copy.create.title;

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [apiErrorMessages, setApiErrorMessages] = useState<string[]>([]);

  const {
    data: prefill,
    isLoading: prefillLoading,
    isError: prefillIsError,
    error: prefillError,
  } = useInvoicePrefill(tripId);
  const { data: tripContext, isLoading: isTripContextLoading } = useTrip(tripId, {
    enabled: !isEditMode && hasTripContext,
  });

  const {
    data: editableInvoice,
    isLoading: isLoadingEditableInvoice,
    isError: isEditableInvoiceError,
    error: editableInvoiceError,
  } = useInvoice(invoiceId ?? "");

  const prefillErrorMessage = prefillError ? getErrorMessage(prefillError) : "";
  const prefillErrorCode = isApiError(prefillError) ? prefillError.code : undefined;
  const isAlreadyInvoicedByError =
    !isEditMode &&
    prefillIsError &&
    (prefillErrorCode === "TRIP_ALREADY_INVOICED" ||
      /ya\s+(est[aá]\s+)?(vinculad[oa]|facturad[oa])|factura\s+activa\s+vinculad[oa]|trip_already_invoiced|already\s+invoiced/i.test(
        prefillErrorMessage,
      ));
  const isBlockedByTripContext =
    !isEditMode && !!tripContext && !tripContext.invoicing.canGenerateInvoice;
  const linkedInvoiceId = tripContext?.invoicing.invoiceId ?? null;
  const linkedInvoiceFolio = tripContext?.invoicing.invoiceFolio ?? null;
  const blockedReason =
    tripContext?.invoicing.blockReason ??
    (isAlreadyInvoicedByError ? prefillErrorMessage : null) ??
    "Este viaje ya tiene una factura activa y no se puede facturar nuevamente.";

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema as never) as Resolver<InvoiceFormValues>,
    defaultValues: defaultInvoiceFormValues(),
    mode: "onChange",
  });

  const { control } = form;

  const subtotal = useWatch({ control: form.control, name: "subtotal" });
  const discount = useWatch({ control: form.control, name: "discount" });
  const applyRetainedTax = useWatch({ control: form.control, name: "apply_retained_tax" });
  const taxRate = prefill?.taxRate ?? 0.16;
  const isPersonaMoral = !!applyRetainedTax;

  useEffect(() => {
    if (!isEditMode && prefillIsError && prefillError && !isAlreadyInvoicedByError) {
      toast({
        variant: "destructive",
        title: copy.create.prefillErrorToast,
        description: getErrorMessage(prefillError),
      });
    }
  }, [prefillIsError, prefillError, isEditMode, isAlreadyInvoicedByError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isEditMode && isEditableInvoiceError && editableInvoiceError) {
      toast({
        variant: "destructive",
        title: copy.edit.loadErrorToast,
        description: getErrorMessage(editableInvoiceError),
      });
    }
  }, [isEditMode, isEditableInvoiceError, editableInvoiceError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEditMode && tripId) {
      form.setValue("trip_ids", [tripId]);
    }
  }, [tripId, isEditMode, form]);

  useEffect(() => {
    if (!isEditMode && prefill) {
      const personaMoral = prefill.clientType === "company";
      form.reset({
        trip_ids: tripId ? [tripId] : [],
        receiver_rfc: prefill.receiverRfc ?? "",
        receiver_name: prefill.receiverName ?? "",
        cfdi_usage: prefill.cfdiUsage ?? "S01",
        receiver_tax_regime: prefill.receiverTaxRegime ?? "",
        receiver_postal_code: prefill.receiverPostalCode ?? "",
        payment_form: prefill.paymentForm ?? "99",
        payment_method: prefill.paymentMethod as "PUE" | "PPD",
        currency: "MXN",
        subtotal: prefill.subtotal ?? 0,
        discount: 0,
        apply_retained_tax: personaMoral,
        total_tax: prefill.totalTax ?? 0,
        retained_tax: prefill.retainedTax ?? 0,
        total: prefill.total ?? 0,
        notes: "",
      });
    }
  }, [prefill, form, isEditMode, tripId]);

  useEffect(() => {
    if (!isEditMode || !editableInvoice) return;

    form.reset({
      receiver_rfc: editableInvoice.receiverRfc ?? "",
      receiver_name: editableInvoice.receiverName ?? "",
      cfdi_usage: editableInvoice.cfdiUsage ?? "S01",
      receiver_tax_regime: editableInvoice.receiverTaxRegime ?? "",
      receiver_postal_code: editableInvoice.receiverPostalCode ?? "",
      payment_form: editableInvoice.paymentForm ?? "99",
      payment_method: (editableInvoice.paymentMethod ?? "PUE") as "PUE" | "PPD",
      currency: "MXN",
      subtotal: editableInvoice.subtotal ?? 0,
      discount:
        editableInvoice.discount != null && editableInvoice.discount > 0
          ? editableInvoice.discount
          : 0,
      apply_retained_tax: (editableInvoice.retainedTax ?? 0) > 0,
      total_tax: editableInvoice.totalTax ?? 0,
      retained_tax: editableInvoice.retainedTax ?? 0,
      total: editableInvoice.total ?? 0,
      notes: editableInvoice.notes ?? "",
    });
  }, [isEditMode, editableInvoice, form]);

  useEffect(() => {
    const base = (subtotal ?? 0) - (discount ?? 0);
    if (base < 0) return;
    const tax = Math.round(base * taxRate * 100) / 100;
    const retained = applyRetainedTax
      ? Math.round(base * RETAINED_TAX_RATE * 100) / 100
      : 0;
    const total = Math.round((base + tax - retained) * 100) / 100;
    form.setValue("total_tax", tax, { shouldValidate: false });
    form.setValue("retained_tax", retained, { shouldValidate: false });
    form.setValue("total", total, { shouldValidate: false });
  }, [subtotal, discount, taxRate, applyRetainedTax]); // eslint-disable-line react-hooks/exhaustive-deps

  // Moneda fija temporal: el sistema solo soporta MXN.
  useEffect(() => {
    form.setValue("currency", "MXN", { shouldValidate: false });
  }, [form]);

  const handleMutationError = (title: string, err: unknown) => {
    const messages = formatInvoiceApiErrorMessages(err);
    setApiErrorMessages(messages);
    setShowValidationSummary(messages.length > 0);
    toast({
      variant: "destructive",
      title,
      description: messages[0] ?? getErrorMessage(err),
    });
  };

  const { mutate, isPending } = useCreateInvoice({
    onSuccess: (invoice) => {
      toast({ title: copy.create.successToast });
      navigate(`/invoices/${invoice.id}`, {
        state: { from: "/invoices/new" },
      });
    },
    onError: (err) => handleMutationError(copy.create.errorToast, err),
  });

  const { mutate: updateInvoice, isPending: isUpdating } = useUpdateInvoice({
    onSuccess: (invoice) => {
      toast({ title: copy.edit.successToast });
      navigate(`/invoices/${invoice.id}`, {
        state: { from: `/invoices/${invoice.id}/edit` },
      });
    },
    onError: (err) => handleMutationError(copy.edit.errorToast, err),
  });

  const onSubmit = (values: InvoiceFormValues) => {
    setApiErrorMessages([]);

    if (isEditMode) {
      if (!invoiceId) return;
      const payload = parseDraftInvoicePayload(values);
      updateInvoice({
        id: invoiceId,
        payload: {
          receiverRfc: payload.receiver_rfc,
          receiverName: payload.receiver_name,
          cfdiUsage: payload.cfdi_usage,
          receiverTaxRegime: payload.receiver_tax_regime,
          receiverPostalCode: payload.receiver_postal_code,
          paymentForm: payload.payment_form,
          paymentMethod: payload.payment_method,
          currency: "MXN",
          subtotal: payload.subtotal,
          discount: payload.discount,
          totalTax: payload.total_tax,
          retainedTax: payload.retained_tax,
          total: payload.total,
          notes: payload.notes || null,
        },
      });
      return;
    }

    if (!hasTripContext) {
      toast({
        variant: "destructive",
        title: copy.create.tripRequiredToast,
        description: copy.create.tripRequiredDescription,
      });
      return;
    }

    let payload;
    try {
      payload = parseCreateInvoicePayload(values, tripId);
    } catch {
      setShowValidationSummary(true);
      toast({
        variant: "destructive",
        title: copy.create.tripRequiredToast,
        description: copy.create.tripRequiredDescription,
      });
      return;
    }

    mutate({
      tripIds: payload.trip_ids,
      receiverRfc: payload.receiver_rfc,
      receiverName: payload.receiver_name,
      cfdiUsage: payload.cfdi_usage,
      receiverTaxRegime: payload.receiver_tax_regime,
      receiverPostalCode: payload.receiver_postal_code,
      paymentForm: payload.payment_form,
      paymentMethod: payload.payment_method,
      currency: "MXN",
      subtotal: payload.subtotal,
      discount: payload.discount,
      totalTax: payload.total_tax,
      retainedTax: payload.retained_tax,
      total: payload.total,
      notes: payload.notes || undefined,
    });
  };

  const shellSubtitle =
    isEditMode && editableInvoice
      ? copy.edit.subtitleDraft(editableInvoice.serie, editableInvoice.folio)
      : prefill
        ? copy.create.subtitleFromTrip(prefill.tripCode)
        : undefined;

  const fieldErrorMessages = collectFieldErrorMessages(form.formState.errors);
  const validationSummaryMessages = [...fieldErrorMessages, ...apiErrorMessages];
  const validationSummaryTitle =
    apiErrorMessages.length > 0
      ? copy.validation.fiscalSummary
      : copy.validation.formSummary;

  const isCreateContextLoading =
    !isEditMode &&
    hasTripContext &&
    !isBlockedByTripContext &&
    !isAlreadyInvoicedByError &&
    (isTripContextLoading || prefillLoading);

  if (isEditMode && isLoadingEditableInvoice) {
    return (
      <InvoiceFormPageShell
        isLoading
        backHref={shellBackHref}
        title={shellTitle}
      />
    );
  }

  if (isEditMode && (!editableInvoice || editableInvoice.status !== "draft")) {
    return (
      <InvoiceFormPageShell
        backHref="/finance?tab=invoices"
        title={copy.edit.title}
        subtitle={copy.edit.notEditableHint}
      >
        <Card>
          <CardHeader>
            <CardTitle>{copy.edit.notEditableTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{copy.edit.notEditableBody}</p>
            <Button variant="outline" onClick={() => navigate("/finance?tab=invoices")}>
              {copy.edit.backToFinance}
            </Button>
          </CardContent>
        </Card>
      </InvoiceFormPageShell>
    );
  }

  if (!isEditMode && !hasTripContext) {
    return (
      <InvoiceFormPageShell
        backHref="/finance?tab=invoices"
        title={shellTitle}
        subtitle={FINANCE_INVOICE_FROM_TRIP_CTA.emptyDescription}
      >
        <Card>
          <CardHeader>
            <CardTitle>{copy.empty.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{copy.empty.body}</p>
            <div className="flex flex-wrap gap-3">
              {canInvoiceFromTrip ? (
                <Button onClick={() => navigate(FINANCE_INVOICE_FROM_TRIP_CTA.tripsPath)}>
                  {FINANCE_INVOICE_FROM_TRIP_CTA.label}
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => navigate("/finance?tab=invoices")}>
                {copy.empty.backToFinance}
              </Button>
            </div>
          </CardContent>
        </Card>
      </InvoiceFormPageShell>
    );
  }

  if (isCreateContextLoading) {
    return (
      <InvoiceFormPageShell
        isLoading
        backHref={shellBackHref}
        title={shellTitle}
      />
    );
  }

  if (!isEditMode && (isBlockedByTripContext || isAlreadyInvoicedByError)) {
    return (
      <InvoiceFormPageShell
        backHref={shellBackHref}
        title={shellTitle}
        subtitle={copy.create.blockedSubtitle}
      >
        <Card>
          <CardHeader>
            <CardTitle>{copy.blocked.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{blockedReason}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate(shellBackHref)}>{copy.blocked.backToTrip}</Button>
              {linkedInvoiceId ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/invoices/${linkedInvoiceId}`)}
                >
                  {copy.blocked.viewInvoice(linkedInvoiceFolio)}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate("/finance?tab=invoices")}
                >
                  {copy.blocked.goFinance}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </InvoiceFormPageShell>
    );
  }

  return (
    <InvoiceFormPageShell
      backHref={shellBackHref}
      title={shellTitle}
      subtitle={shellSubtitle}
    >
      <form
        onSubmit={form.handleSubmit(
          (values) => {
            setShowValidationSummary(false);
            setApiErrorMessages([]);
            onSubmit(values);
          },
          () => {
            setShowValidationSummary(true);
          },
        )}
        className="space-y-6"
      >
        <InvoiceCreateContextCards
          mode={isEditMode ? "edit" : "create"}
          prefill={prefill}
          tripId={tripId}
          invoice={editableInvoice}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {copy.section.receiver}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      {...getFieldErrorAriaProps(
                        "receiver_rfc",
                        fieldState.error?.message,
                      )}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {copy.section.cfdi}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {copy.section.amounts}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <RHFMoneyField
                control={control}
                name="subtotal"
                label={copy.label.subtotal}
              />
              <RHFMoneyField
                control={control}
                name="discount"
                label={copy.label.discount}
              />
              <RHFMoneyField
                control={control}
                name="total"
                label={copy.label.total}
              />
              <RHFMoneyField
                control={control}
                name="total_tax"
                label={
                  <>
                    {copy.label.iva}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({(taxRate * 100).toFixed(0)}%)
                    </span>
                  </>
                }
              />
            </div>

            <div className="space-y-3">
              <Controller
                control={control}
                name="apply_retained_tax"
                render={({ field }) => (
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="apply_retained_tax"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <div className="space-y-0.5">
                      <label
                        htmlFor="apply_retained_tax"
                        className="cursor-pointer text-sm font-medium leading-none"
                      >
                        {copy.label.retainedTaxApply}
                      </label>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 shrink-0" />
                        {copy.hint.retainedTax}
                      </p>
                    </div>
                  </div>
                )}
              />

              {isPersonaMoral ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <RHFMoneyField
                    control={control}
                    name="retained_tax"
                    label={
                      <>
                        {copy.label.retainedTax}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          (4%)
                        </span>
                      </>
                    }
                  />
                </div>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground">{copy.hint.amountsAuto}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {copy.section.notes}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RHFTextField
              control={control}
              name="notes"
              label={copy.section.notes}
              placeholder={copy.label.notesPlaceholder}
            />
          </CardContent>
        </Card>

        {showValidationSummary && validationSummaryMessages.length > 0 ? (
          <FormValidationSummary
            title={validationSummaryTitle}
            messages={validationSummaryMessages}
          />
        ) : null}

        <Separator />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(shellBackHref)}>
            {copy.label.cancel}
          </Button>
          <Button type="submit" disabled={isPending || isUpdating}>
            {isPending || isUpdating
              ? copy.label.saving
              : isEditMode
                ? copy.edit.submit
                : copy.create.submit}
          </Button>
        </div>
      </form>
    </InvoiceFormPageShell>
  );
}
