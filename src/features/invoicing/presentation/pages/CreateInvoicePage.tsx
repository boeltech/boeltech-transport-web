import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ClipboardList, StickyNote } from "lucide-react";
import {
  useForm,
  useWatch,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePermissions } from "@shared/permissions";
import { InvoiceFormPageShell } from "../components/InvoiceFormPageShell";
import { InvoiceCreateContextCards } from "../components/InvoiceCreateContextCards";
import { InvoiceFiscalComprobanteCard } from "../components/InvoiceFiscalComprobanteCard";
import { InvoiceReceiverEditSheet } from "../components/InvoiceReceiverEditSheet";
import { InvoiceBillingScopeBadge } from "../components/InvoiceBillingScopeBadge";
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
  INVOICE_RECEIVER_FIELD_NAMES,
  type InvoiceFormValues,
  type InvoiceReceiverFormValues,
} from "../validation/invoiceFormSchema";
import { InvoiceConceptsEditor } from "../components/InvoiceConceptsEditor";
import { InvoiceAmountsSummaryPanel } from "../components/InvoiceAmountsSummaryPanel";
import { formatInvoiceApiErrorMessages } from "../validation/formatInvoiceApiErrors";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { FormValidationSummary, RHFTextField } from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
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

/** Ancla para llevar la vista a los conceptos cuando el error no es de un campo. */
const CONCEPTS_SECTION_ID = "invoice-concepts-section";

function pickReceiverValues(values: InvoiceFormValues): InvoiceReceiverFormValues {
  return {
    receiver_rfc: values.receiver_rfc ?? "",
    receiver_name: values.receiver_name ?? "",
    receiver_tax_regime: values.receiver_tax_regime ?? "",
    receiver_postal_code: values.receiver_postal_code ?? "",
    cfdi_usage: values.cfdi_usage ?? "",
    payment_form: values.payment_form ?? "",
    payment_method: values.payment_method,
  };
}

export function CreateInvoicePage() {
  const { id: invoiceId } = useParams<{ id: string }>();
  const isEditMode = Boolean(invoiceId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const tripId = searchParams.get("trip_id") ?? "";
  /** Pantalla de origen; la envía quien navega aquí (hub, detalle de viaje). */
  const fromState = location.state?.from as string | undefined;
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
      : (fromState ??
        (tripId ? `/trips/${tripId}` : "/finance?tab=invoices"));

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
  const receiverRfc = useWatch({ control: form.control, name: "receiver_rfc" });
  const total = useWatch({ control: form.control, name: "total" }) ?? 0;
  const retentionRequired = useWatch({ control: form.control, name: "retention_required" }) ?? false;
  const taxRate = prefill?.taxRate ?? 0.16;

  const [receiverSheetOpen, setReceiverSheetOpen] = useState(false);
  const [receiverSheetFocus, setReceiverSheetFocus] =
    useState<keyof InvoiceReceiverFormValues | undefined>(undefined);
  const [receiverSheetValidate, setReceiverSheetValidate] = useState(false);
  const [receiverSheetValues, setReceiverSheetValues] =
    useState<InvoiceReceiverFormValues>(() => pickReceiverValues(defaultInvoiceFormValues()));

  const openReceiverSheet = (options?: {
    focusField?: keyof InvoiceReceiverFormValues;
    validateOnOpen?: boolean;
  }) => {
    setReceiverSheetValues(pickReceiverValues(form.getValues()));
    setReceiverSheetFocus(options?.focusField);
    setReceiverSheetValidate(options?.validateOnOpen ?? false);
    setReceiverSheetOpen(true);
  };

  const applyReceiverValues = (values: InvoiceReceiverFormValues) => {
    const options = { shouldDirty: true, shouldValidate: true } as const;
    form.setValue("receiver_name", values.receiver_name, options);
    form.setValue("receiver_rfc", values.receiver_rfc, options);
    form.setValue("receiver_tax_regime", values.receiver_tax_regime, options);
    form.setValue("receiver_postal_code", values.receiver_postal_code, options);
    form.setValue("cfdi_usage", values.cfdi_usage, options);
    form.setValue("payment_form", values.payment_form, options);
    form.setValue("payment_method", values.payment_method, options);
  };

  /** Lleva al usuario al primer campo inválido, incluso si vive en el sheet fiscal. */
  const handleInvalidSubmit = (errors: FieldErrors<InvoiceFormValues>) => {
    setShowValidationSummary(true);

    const receiverField = INVOICE_RECEIVER_FIELD_NAMES.find((name) => errors[name]);
    if (receiverField) {
      openReceiverSheet({ focusField: receiverField, validateOnOpen: true });
      return;
    }

    const focusableField = (["discount", "notes"] as const).find(
      (name) => errors[name],
    );
    if (focusableField) {
      form.setFocus(focusableField);
      return;
    }

    if (errors.concepts) {
      document.getElementById(CONCEPTS_SECTION_ID)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

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
        /** Conserva el módulo de origen; sin origen, el detalle vuelve al viaje ligado. */
        state: { from: fromState ?? "/invoices/new" },
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

  // En alta el código del viaje vive una sola vez, en la línea de contexto.
  const shellSubtitle =
    isEditMode && editableInvoice
      ? copy.edit.subtitleDraft(editableInvoice.serie, editableInvoice.folio)
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
                <Button
                  onClick={() =>
                    navigate(FINANCE_INVOICE_FROM_TRIP_CTA.invoiceablePath)
                  }
                >
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
    const blockedByOperationSat =
      isBlockedByTripContext &&
      !isAlreadyInvoicedByError &&
      !linkedInvoiceId &&
      !!tripContext?.invoicing.blockReason;
    const blockedTitle = isAccessoryScope
      ? copy.blocked.titleAccessory
      : blockedByOperationSat
        ? copy.blocked.titleNotReady
        : copy.blocked.title;

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
            <CardTitle>{blockedTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{blockedReason}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate(shellBackHref)}>{copy.blocked.backToTrip}</Button>
              {tripId && /ruta|paradas|coordenadas|distancias|carta\s+porte/i.test(blockedReason) ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/trips/${tripId}?tab=route`)}
                >
                  {copy.blocked.goToRouteTab}
                </Button>
              ) : null}
              {tripId && /carga|mercanc/i.test(blockedReason) ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/trips/${tripId}?tab=cargo`)}
                >
                  {copy.blocked.goToCargoTab}
                </Button>
              ) : null}
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
      trailing={
        formBillingScope === "accessory" ? (
          <InvoiceBillingScopeBadge scope="accessory" />
        ) : null
      }
    >
      <form
        onSubmit={form.handleSubmit(
          (values) => {
            setShowValidationSummary(false);
            setApiErrorMessages([]);
            onSubmit(values);
          },
          handleInvalidSubmit,
        )}
        className="space-y-6"
      >
        <InvoiceCreateContextCards
          mode={isEditMode ? "edit" : "create"}
          prefill={prefill}
          tripId={tripId}
          invoice={editableInvoice}
          receiverName={receiverName}
          receiverRfc={receiverRfc}
          total={total}
        />

        <InvoiceFiscalComprobanteCard
          control={control}
          onEdit={() => openReceiverSheet()}
        />

        <FormSectionCard
          title={copy.section.concepts}
          description={
            formBillingScope === "accessory"
              ? copy.concepts.sectionDescriptionAccessory
              : copy.concepts.sectionDescription
          }
          icon={<ClipboardList className="h-4 w-4" />}
          contentClassName="pt-0"
        >
          <div id={CONCEPTS_SECTION_ID}>
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
              showDiscount
            />
          </div>
        </FormSectionCard>

        <InvoiceAmountsSummaryPanel
          control={control}
          className="w-full md:ml-auto md:max-w-md"
        />

        <FormSectionCard
          title={copy.section.notes}
          description={copy.label.notesDescription}
          icon={<StickyNote className="h-4 w-4" />}
          contentClassName="pt-0"
        >
          <RHFTextField
            control={control}
            name="notes"
            label={copy.label.notesField}
            placeholder={copy.label.notesPlaceholder}
          />
        </FormSectionCard>

        {/* Barra de acción: el total y la consecuencia siempre a la vista. */}
        <div className="sticky bottom-0 z-10 space-y-3 rounded-lg border bg-card/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
          {showValidationSummary && validationSummaryMessages.length > 0 ? (
            <FormValidationSummary
              title={validationSummaryTitle}
              messages={validationSummaryMessages}
              className="mb-0 max-h-40 overflow-y-auto"
            />
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm text-muted-foreground">
                {copy.amountsPanel.totalLabel}{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {formatMxCurrency(total)}
                </span>
              </p>
              {!isEditMode ? (
                <p className="text-xs text-muted-foreground">
                  {copy.create.submitConsequence}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(shellBackHref)}
              >
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
          </div>
        </div>
      </form>

      <InvoiceReceiverEditSheet
        open={receiverSheetOpen}
        onOpenChange={setReceiverSheetOpen}
        values={receiverSheetValues}
        onApply={applyReceiverValues}
        validateOnOpen={receiverSheetValidate}
        focusField={receiverSheetFocus}
      />
    </InvoiceFormPageShell>
  );
}
