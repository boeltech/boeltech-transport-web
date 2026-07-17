import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePermissions } from "@shared/permissions";
import { InvoiceFormPageShell } from "../components/InvoiceFormPageShell";
import { InvoiceCreateContextCards } from "../components/InvoiceCreateContextCards";
import { InvoiceFiscalComprobanteCard } from "../components/InvoiceFiscalComprobanteCard";
import {
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
} from "../financeInvoiceFromTripCta";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  defaultInvoiceFormValues,
  invoiceFormSchema,
  mapFormConceptToPayload,
  mapInvoiceConceptToFormInput,
  defaultFleteConceptFormLine,
  parseCreateInvoicePayload,
  parseDraftInvoicePayload,
  inferRetentionRequired,
  type InvoiceFormValues,
} from "../validation/invoiceFormSchema";
import { InvoiceConceptsEditor } from "../components/InvoiceConceptsEditor";
import { InvoiceAmountsSummaryPanel } from "../components/InvoiceAmountsSummaryPanel";
import { formatInvoiceApiErrorMessages } from "../validation/formatInvoiceApiErrors";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import { FormValidationSummary, RHFTextField } from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useToast } from "@shared/hooks";
import { getErrorMessage, isApiError } from "@shared/api/interceptors/error-handler";
import {
  useCreateInvoice,
  useInvoice,
  useInvoicePrefill,
  useInvoiceReceiverClientType,
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
  const fromFinance = searchParams.get("from") === "finance";
  const billingScope =
    searchParams.get("scope") === "accessory" ? "accessory" : "primary_transport";
  const isAccessoryScope = billingScope === "accessory";
  const hasTripContext = Boolean(tripId);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canInvoiceFromTrip = canShowInvoiceFromTripCta(hasPermission);

  const shellBackHref =
    isEditMode && invoiceId
      ? `/invoices/${invoiceId}`
      : fromFinance
        ? "/finance?tab=invoices"
        : tripId
          ? `/trips/${tripId}`
          : "/finance?tab=invoices";

  const shellTitle = isEditMode
    ? copy.edit.title
    : isAccessoryScope
      ? copy.create.titleAccessory
      : copy.create.title;

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [apiErrorMessages, setApiErrorMessages] = useState<string[]>([]);

  const {
    data: prefill,
    isLoading: prefillLoading,
    isError: prefillIsError,
    error: prefillError,
  } = useInvoicePrefill(tripId, billingScope);
  const { data: tripContext, isLoading: isTripContextLoading } = useTrip(tripId, {
    enabled: !isEditMode && hasTripContext,
  });

  const {
    data: editableInvoice,
    isLoading: isLoadingEditableInvoice,
    isError: isEditableInvoiceError,
    error: editableInvoiceError,
  } = useInvoice(invoiceId ?? "");

  const { clientType: receiverClientType, isResolving: isResolvingReceiverClientType } =
    useInvoiceReceiverClientType(isEditMode ? editableInvoice : undefined);

  const editBillingScope =
    editableInvoice?.trips[0]?.billingScope ?? "primary_transport";
  const formBillingScope = isEditMode ? editBillingScope : billingScope;

  const prefillErrorMessage = prefillError ? getErrorMessage(prefillError) : "";
  const prefillErrorCode = isApiError(prefillError) ? prefillError.code : undefined;
  const isAlreadyInvoicedByError =
    !isEditMode &&
    !isAccessoryScope &&
    prefillIsError &&
    (prefillErrorCode === "TRIP_ALREADY_INVOICED" ||
      /ya\s+(est[aá]\s+)?(vinculad[oa]|facturad[oa])|factura\s+activa\s+vinculad[oa]|trip_already_invoiced|already\s+invoiced/i.test(
        prefillErrorMessage,
      ));
  const isAccessoryBlockedByError =
    !isEditMode &&
    isAccessoryScope &&
    prefillIsError &&
    (prefillErrorCode === "TRIP_PRIMARY_INVOICE_REQUIRED" ||
      /factura\s+primaria|primary\s+invoice\s+required|trip_primary_invoice_required/i.test(
        prefillErrorMessage,
      ));
  const isBlockedByTripContext =
    !isEditMode &&
    !!tripContext &&
    (isAccessoryScope
      ? !tripContext.invoicing.canGenerateAccessoryInvoice
      : !tripContext.invoicing.canGenerateInvoice);
  const linkedInvoiceId = tripContext?.invoicing.invoiceId ?? null;
  const linkedInvoiceFolio = tripContext?.invoicing.invoiceFolio ?? null;
  const blockedReason =
    tripContext?.invoicing.blockReason ??
    (isAlreadyInvoicedByError || isAccessoryBlockedByError
      ? prefillErrorMessage
      : null) ??
    (isAccessoryScope
      ? "Este viaje no tiene factura de flete activa; primero genera la factura principal."
      : "Este viaje ya tiene una factura activa y no se puede facturar nuevamente.");
  const isCreateBlocked =
    isBlockedByTripContext || isAlreadyInvoicedByError || isAccessoryBlockedByError;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema as never) as Resolver<InvoiceFormValues>,
    defaultValues: defaultInvoiceFormValues(),
    mode: "onChange",
  });

  const { control } = form;

  const receiverName = useWatch({ control: form.control, name: "receiver_name" });
  const retentionRequired = useWatch({ control: form.control, name: "retention_required" }) ?? false;
  const taxRate = prefill?.taxRate ?? 0.16;

  useEffect(() => {
    if (!isEditMode && prefillIsError && prefillError && !isAlreadyInvoicedByError && !isAccessoryBlockedByError) {
      toast({
        variant: "destructive",
        title: copy.create.prefillErrorToast,
        description: getErrorMessage(prefillError),
      });
    }
  }, [prefillIsError, prefillError, isEditMode, isAlreadyInvoicedByError, isAccessoryBlockedByError]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const resolvedTaxRate = prefill.taxRate ?? 0.16;
      const suggested =
        prefill.suggestedConcepts.length > 0
          ? prefill.suggestedConcepts.map(mapInvoiceConceptToFormInput)
          : [];
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
        retention_required: personaMoral,
        concepts:
          isAccessoryScope
            ? suggested
            : suggested.length > 0
              ? suggested
              : [
                  defaultFleteConceptFormLine(prefill.subtotal ?? 0, {
                    taxRate: resolvedTaxRate,
                    retencionAplica: personaMoral,
                  }),
                ],
        total_tax: prefill.totalTax ?? 0,
        retained_tax: prefill.retainedTax ?? 0,
        total: prefill.total ?? 0,
        notes: "",
      });
    }
  }, [prefill, form, isEditMode, tripId, isAccessoryScope]);

  useEffect(() => {
    if (!isEditMode || !editableInvoice) return;
    if (isResolvingReceiverClientType) return;

    const retentionRequiredForEdit = inferRetentionRequired({
      clientType: receiverClientType,
      retainedTax: editableInvoice.retainedTax,
      receiverRfc: editableInvoice.receiverRfc,
      concepts: editableInvoice.concepts,
    });

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
      apply_retained_tax:
        retentionRequiredForEdit || (editableInvoice.retainedTax ?? 0) > 0,
      retention_required: retentionRequiredForEdit,
      concepts:
        editableInvoice.concepts.length > 0
          ? editableInvoice.concepts.map(mapInvoiceConceptToFormInput)
          : defaultInvoiceFormValues().concepts,
      total_tax: editableInvoice.totalTax ?? 0,
      retained_tax: editableInvoice.retainedTax ?? 0,
      total: editableInvoice.total ?? 0,
      notes: editableInvoice.notes ?? "",
    });
  }, [
    isEditMode,
    editableInvoice,
    form,
    receiverClientType,
    isResolvingReceiverClientType,
  ]);

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
          concepts: payload.concepts?.map(mapFormConceptToPayload),
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
      payload = parseCreateInvoicePayload(values, tripId, billingScope);
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
      billingScope: payload.billing_scope ?? billingScope,
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
      concepts: payload.concepts?.map(mapFormConceptToPayload),
      notes: payload.notes || undefined,
    });
  };

  const shellSubtitle =
    isEditMode && editableInvoice
      ? copy.edit.subtitleDraft(editableInvoice.serie, editableInvoice.folio)
      : prefill
        ? isAccessoryScope
          ? copy.create.subtitleAccessoryFromTrip(prefill.tripCode)
          : copy.create.subtitleFromTrip(prefill.tripCode)
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
    !isCreateBlocked &&
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

  if (!isEditMode && isCreateBlocked) {
    return (
      <InvoiceFormPageShell
        backHref={shellBackHref}
        title={shellTitle}
        subtitle={
          isAccessoryScope
            ? copy.create.blockedSubtitleAccessory
            : copy.create.blockedSubtitle
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {isAccessoryScope ? copy.blocked.titleAccessory : copy.blocked.title}
            </CardTitle>
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
          receiverName={receiverName}
        />

        <InvoiceFiscalComprobanteCard control={control} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {copy.section.concepts}
                </CardTitle>
                <CardDescription>
                  {formBillingScope === "accessory"
                    ? copy.concepts.sectionDescriptionAccessory
                    : copy.concepts.sectionDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceConceptsEditor
                  control={control}
                  setValue={form.setValue}
                  taxRate={taxRate}
                  tripBaseRate={
                    formBillingScope === "accessory"
                      ? undefined
                      : (tripContext?.costs?.baseRate ?? prefill?.subtotal)
                  }
                  retentionRequired={retentionRequired}
                  billingScope={formBillingScope}
                />
              </CardContent>
            </Card>

            <div className="xl:hidden">
              <InvoiceAmountsSummaryPanel control={control} />
            </div>

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
          </div>

          <aside className="hidden space-y-4 xl:sticky xl:top-4 xl:block xl:self-start">
            <InvoiceAmountsSummaryPanel control={control} />
          </aside>
        </div>

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
