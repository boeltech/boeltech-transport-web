import { useEffect, useRef, useState } from "react";
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
import { InvoiceBillingScopeBanner } from "../components/InvoiceBillingScopeBanner";
import { InvoiceCreateReadinessChecklist } from "../components/InvoiceCreateReadinessChecklist";
import {
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
} from "../financeInvoiceFromTripCta";
import { getInvoiceCreateReadiness } from "../invoiceCreateReadiness";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  defaultInvoiceFormValues,
  invoiceFormSchema,
  mapFormConceptToPayload,
  mapInvoiceConceptToFormInput,
  defaultFleteConceptFormLine,
  parseDraftInvoicePayload,
  inferRetentionRequired,
  INVOICE_RECEIVER_FIELD_NAMES,
  safeParseCreateInvoicePayload,
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
import { useTrip, useTripRevenueSplit } from "@features/trips";
import {
  isServiceOnlyBillingScope,
  parseInvoiceBillingScope,
} from "@features/invoicing/domain";
import {
  invoiceCreateHydrationKey,
  shouldHydrateInvoiceCreate,
} from "./invoiceCreateHydration";
import {
  invoiceEditHydrationKey,
  shouldHydrateInvoiceEdit,
} from "./invoiceEditHydration";
import { resolveInvoiceEditPageGate } from "./invoiceEditPageGate";
import { isFalseTripPrefillBlockedError } from "../utils/falseTripCreatePrefillBlock";
import { findSplitShareLegAlreadyInvoiced } from "../utils/splitShareLegAlreadyInvoiced";

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
  const billingScope = parseInvoiceBillingScope(searchParams.get("scope"));
  const splitLegId = searchParams.get("leg_id");
  const attachCartaPorteFromQuery =
    searchParams.get("attach_carta_porte") === "1" ||
    searchParams.get("attach_carta_porte") === "true";
  const isAccessoryScope = billingScope === "accessory";
  const isFalseTripScope = billingScope === "false_trip";
  const isSplitShareScope = billingScope === "split_share";
  const isServiceOnlyScope = isServiceOnlyBillingScope(billingScope);
  const hasTripContext = Boolean(tripId);
  const isSplitShareMissingLegId =
    !isEditMode && isSplitShareScope && hasTripContext && !splitLegId?.trim();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canInvoiceFromTrip = canShowInvoiceFromTripCta(hasPermission);

  const shellBackHref =
    isEditMode && invoiceId
      ? `/invoices/${invoiceId}`
      : (fromState ??
        (tripId ? `/trips/${tripId}` : "/finance/invoices"));

  const shellTitle = isEditMode
    ? copy.edit.title
    : isFalseTripScope
      ? copy.create.titleFalseTrip
      : isSplitShareScope
        ? copy.create.titleSplitShare
        : isAccessoryScope
          ? copy.create.titleAccessory
          : copy.create.title;

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [apiErrorMessages, setApiErrorMessages] = useState<string[]>([]);
  const hydratedPrefillKeyRef = useRef<string | null>(null);
  const [attachCartaPorte, setAttachCartaPorte] = useState(
    attachCartaPorteFromQuery,
  );
  const hydratedEditKeyRef = useRef<string | null>(null);

  const {
    data: prefill,
    isLoading: prefillLoading,
    isError: prefillIsError,
    error: prefillError,
  } = useInvoicePrefill(tripId, billingScope, splitLegId);
  const { data: tripContext, isLoading: isTripContextLoading } = useTrip(tripId, {
    enabled: !isEditMode && hasTripContext,
  });
  const { data: revenueSplit, isLoading: isRevenueSplitLoading } =
    useTripRevenueSplit(tripId, {
      enabled: !isEditMode && isSplitShareScope && hasTripContext,
    });
  const alreadyInvoicedSplitLeg = findSplitShareLegAlreadyInvoiced(
    revenueSplit?.legs,
    splitLegId,
  );
  const isSplitShareLegAlreadyInvoiced =
    !isEditMode && isSplitShareScope && !!alreadyInvoicedSplitLeg;

  const isBlockedByActiveSplitWrongScope =
    !isEditMode &&
    !!tripContext?.invoicing.hasActiveSplit &&
    !isSplitShareScope &&
    !isAccessoryScope &&
    !isFalseTripScope;
  const cartaPorteAlreadyAttached =
    tripContext?.invoicing.cartaPorteAttached === true;
  const splitShareCopy = copy.splitShare;

  const {
    data: editableInvoice,
    isLoading: isLoadingEditableInvoice,
    isError: isEditableInvoiceError,
    error: editableInvoiceError,
    refetch: refetchEditableInvoice,
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
    !isServiceOnlyScope &&
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
  const isFalseTripBlockedByError =
    !isEditMode &&
    isFalseTripScope &&
    prefillIsError &&
    isFalseTripPrefillBlockedError(prefillErrorCode, prefillErrorMessage);
  const isBlockedByTripContext =
    !isEditMode &&
    !!tripContext &&
    (isFalseTripScope
      ? !tripContext.invoicing.canGenerateFalseTripInvoice
      : isSplitShareScope
        ? !tripContext.invoicing.canGenerateSplitShareInvoice
        : isAccessoryScope
          ? !tripContext.invoicing.canGenerateAccessoryInvoice
          : !tripContext.invoicing.canGenerateInvoice);
  const linkedInvoiceId = tripContext?.invoicing.invoiceId ?? null;
  const linkedInvoiceFolio = tripContext?.invoicing.invoiceFolio ?? null;
  const blockedReason =
    tripContext?.invoicing.blockReason ??
    (isAlreadyInvoicedByError || isAccessoryBlockedByError || isFalseTripBlockedByError
      ? prefillErrorMessage
      : null) ??
    (isAccessoryScope
      ? "Este viaje no tiene factura de flete activa; primero genera la factura principal."
      : "Este viaje ya tiene una factura activa y no se puede facturar nuevamente.");
  const isCreateBlocked =
    isBlockedByTripContext ||
    isAlreadyInvoicedByError ||
    isAccessoryBlockedByError ||
    isFalseTripBlockedByError ||
    isSplitShareLegAlreadyInvoiced;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema) as Resolver<InvoiceFormValues>,
    defaultValues: defaultInvoiceFormValues(),
    mode: "onChange",
  });

  const { control } = form;

  const receiverName = useWatch({ control: form.control, name: "receiver_name" });
  const receiverRfc = useWatch({ control: form.control, name: "receiver_rfc" });
  const total = useWatch({ control: form.control, name: "total" }) ?? 0;
  const retentionRequired = useWatch({ control: form.control, name: "retention_required" }) ?? false;
  const watchedConcepts = useWatch({ control: form.control, name: "concepts" });
  const watchedReceiverTaxRegime = useWatch({
    control: form.control,
    name: "receiver_tax_regime",
  });
  const watchedReceiverPostalCode = useWatch({
    control: form.control,
    name: "receiver_postal_code",
  });
  const watchedCfdiUsage = useWatch({ control: form.control, name: "cfdi_usage" });
  const watchedPaymentForm = useWatch({ control: form.control, name: "payment_form" });
  const watchedPaymentMethod = useWatch({
    control: form.control,
    name: "payment_method",
  });
  const taxRate = isEditMode
    ? (editableInvoice?.concepts.find((line) => line.conceptType === "flete")
        ?.ivaRate ??
      editableInvoice?.concepts[0]?.ivaRate ??
      0.16)
    : (prefill?.taxRate ?? 0.16);

  const readiness = getInvoiceCreateReadiness({
    receiver_name: receiverName ?? "",
    receiver_rfc: receiverRfc ?? "",
    receiver_tax_regime: watchedReceiverTaxRegime ?? "",
    receiver_postal_code: watchedReceiverPostalCode ?? "",
    cfdi_usage: watchedCfdiUsage ?? "",
    payment_form: watchedPaymentForm ?? "",
    payment_method: watchedPaymentMethod ?? "PUE",
    concepts: watchedConcepts ?? [],
    total,
  });

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

    const clientTypeForRetention = isEditMode
      ? receiverClientType
      : (prefill?.clientType ?? null);
    const nextRetentionRequired = inferRetentionRequired({
      clientType: clientTypeForRetention,
      receiverRfc: values.receiver_rfc,
      retainedTax: form.getValues("retained_tax"),
      concepts: form.getValues("concepts"),
    });
    form.setValue("retention_required", nextRetentionRequired, options);
    form.setValue("apply_retained_tax", nextRetentionRequired, options);
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
    if (!isEditMode && prefillIsError && prefillError && !isAlreadyInvoicedByError && !isAccessoryBlockedByError && !isFalseTripBlockedByError) {
      toast({
        variant: "destructive",
        title: copy.create.prefillErrorToast,
        description: getErrorMessage(prefillError),
      });
    }
  }, [prefillIsError, prefillError, isEditMode, isAlreadyInvoicedByError, isAccessoryBlockedByError, isFalseTripBlockedByError]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!isSplitShareScope || isEditMode) return;
    if (typeof prefill?.attachCartaPorte === "boolean") {
      setAttachCartaPorte(prefill.attachCartaPorte);
    } else if (attachCartaPorteFromQuery) {
      setAttachCartaPorte(true);
    }
  }, [
    isSplitShareScope,
    isEditMode,
    prefill?.attachCartaPorte,
    attachCartaPorteFromQuery,
  ]);

  useEffect(() => {
    if (
      isSplitShareScope &&
      !isEditMode &&
      cartaPorteAlreadyAttached &&
      attachCartaPorte
    ) {
      setAttachCartaPorte(false);
    }
  }, [
    isSplitShareScope,
    isEditMode,
    cartaPorteAlreadyAttached,
    attachCartaPorte,
  ]);

useEffect(() => {
    if (!isEditMode && prefill) {
      if (
        !shouldHydrateInvoiceCreate(
          hydratedPrefillKeyRef.current,
          tripId,
          billingScope,
          { formIsDirty: form.formState.isDirty, legId: splitLegId },
        )
      ) {
        return;
      }
      hydratedPrefillKeyRef.current = invoiceCreateHydrationKey(
        tripId,
        billingScope,
        splitLegId,
      );
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
          isServiceOnlyScope
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
  }, [prefill, form, isEditMode, tripId, isServiceOnlyScope, billingScope]);

  useEffect(() => {
    if (!isEditMode || !editableInvoice) return;
    if (isResolvingReceiverClientType) return;
    if (
      !shouldHydrateInvoiceEdit(
        hydratedEditKeyRef.current,
        editableInvoice.id,
        { formIsDirty: form.formState.isDirty },
      )
    ) {
      return;
    }

    const retentionRequiredForEdit = inferRetentionRequired({
      clientType: receiverClientType,
      retainedTax: editableInvoice.retainedTax,
      receiverRfc: editableInvoice.receiverRfc,
      concepts: editableInvoice.concepts,
    });

    hydratedEditKeyRef.current = invoiceEditHydrationKey(editableInvoice.id);
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

    const parsed = safeParseCreateInvoicePayload(values, tripId, billingScope, {
      splitLegId: isSplitShareScope ? splitLegId : undefined,
      attachCartaPorte: isSplitShareScope ? attachCartaPorte : undefined,
    });
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      setApiErrorMessages(messages);
      setShowValidationSummary(true);
      const tripIdsMissing = parsed.error.issues.some((issue) =>
        issue.path.includes("trip_ids"),
      );
      toast({
        variant: "destructive",
        title: tripIdsMissing
          ? copy.create.tripRequiredToast
          : copy.validation.formSummary,
        description:
          messages[0] ??
          (tripIdsMissing ? copy.create.tripRequiredDescription : undefined),
      });
      return;
    }
    const payload = parsed.data;

    mutate({
      tripIds: payload.trip_ids,
      billingScope: payload.billing_scope ?? billingScope,
      splitLegId: isSplitShareScope ? (splitLegId ?? undefined) : undefined,
      attachCartaPorte: isSplitShareScope ? attachCartaPorte : undefined,
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

  // En alta el código del viaje vive en la tarjeta resumen.
  const shellSubtitle =
    isEditMode && editableInvoice
      ? copy.edit.subtitleDraft(editableInvoice.serie, editableInvoice.folio)
      : undefined;
  const hasTripPrefill = !isEditMode && Boolean(prefill);
  const conceptsSectionDescription =
    hasTripPrefill
      ? undefined
      : formBillingScope === "false_trip"
        ? copy.concepts.sectionDescriptionFalseTrip
        : formBillingScope === "split_share"
          ? copy.concepts.sectionDescriptionSplitShare
          : isServiceOnlyBillingScope(formBillingScope)
            ? copy.concepts.sectionDescriptionAccessory
            : copy.concepts.sectionDescription;

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
    (isTripContextLoading ||
      prefillLoading ||
      (isSplitShareScope && isRevenueSplitLoading));

  const editPageGate = isEditMode
    ? resolveInvoiceEditPageGate({
        isLoading: isLoadingEditableInvoice,
        isError: isEditableInvoiceError,
        error: editableInvoiceError,
        invoice: editableInvoice,
      })
    : null;

  if (editPageGate?.kind === "loading") {
    return (
      <InvoiceFormPageShell
        isLoading
        backHref={shellBackHref}
        title={shellTitle}
      />
    );
  }

  if (editPageGate?.kind === "loadError") {
    const isForbidden = editPageGate.errorState === "forbidden";
    return (
      <InvoiceFormPageShell
        backHref="/finance/invoices"
        title={copy.edit.title}
        subtitle={copy.edit.loadErrorToast}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {isForbidden
                ? copy.edit.loadErrorForbiddenTitle
                : copy.edit.loadErrorTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isForbidden
                ? copy.edit.loadErrorForbiddenBody
                : editableInvoiceError
                  ? getErrorMessage(editableInvoiceError)
                  : copy.edit.loadErrorBody}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void refetchEditableInvoice()}
              >
                {copy.edit.loadErrorRetry}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/finance/invoices")}
              >
                {copy.edit.backToFinance}
              </Button>
            </div>
          </CardContent>
        </Card>
      </InvoiceFormPageShell>
    );
  }

  if (editPageGate?.kind === "notEditable") {
    return (
      <InvoiceFormPageShell
        backHref="/finance/invoices"
        title={copy.edit.title}
        subtitle={copy.edit.notEditableHint}
      >
        <Card>
          <CardHeader>
            <CardTitle>{copy.edit.notEditableTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{copy.edit.notEditableBody}</p>
            <Button variant="outline" onClick={() => navigate("/finance/invoices")}>
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
        backHref="/finance/invoices"
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
              <Button variant="outline" onClick={() => navigate("/finance/invoices")}>
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

  if (!isEditMode && isSplitShareMissingLegId) {
    return (
      <InvoiceFormPageShell
        backHref={shellBackHref}
        title={shellTitle}
        subtitle={copy.create.blockedSubtitleSplitShare}
      >
        <Card>
          <CardHeader>
            <CardTitle>{splitShareCopy.missingLegIdTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InvoiceBillingScopeBanner scope="split_share" notThisOnly />
            <p className="text-sm text-muted-foreground">
              {splitShareCopy.missingLegIdBody}
            </p>
            <Button onClick={() => navigate(`/trips/${tripId}`)}>
              {splitShareCopy.viewTripInvoicing}
            </Button>
          </CardContent>
        </Card>
      </InvoiceFormPageShell>
    );
  }

  if (!isEditMode && isSplitShareLegAlreadyInvoiced && alreadyInvoicedSplitLeg) {
    return (
      <InvoiceFormPageShell
        backHref={shellBackHref}
        title={shellTitle}
        subtitle={copy.create.blockedSubtitleSplitShare}
      >
        <Card>
          <CardHeader>
            <CardTitle>{splitShareCopy.alreadyInvoicedTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InvoiceBillingScopeBanner scope="split_share" notThisOnly />
            <p className="text-sm text-muted-foreground">
              {splitShareCopy.alreadyInvoicedBody}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  navigate(`/invoices/${alreadyInvoicedSplitLeg.invoiceId}`)
                }
              >
                {splitShareCopy.viewExistingInvoice}
              </Button>
              <Button variant="outline" onClick={() => navigate(`/trips/${tripId}`)}>
                {splitShareCopy.viewTripInvoicing}
              </Button>
            </div>
          </CardContent>
        </Card>
      </InvoiceFormPageShell>
    );
  }

  if (!isEditMode && isCreateBlocked) {
    const blockedByOperationSat =
      isBlockedByTripContext &&
      !isAlreadyInvoicedByError &&
      !isAccessoryBlockedByError &&
      !isFalseTripBlockedByError &&
      !linkedInvoiceId &&
      !!tripContext?.invoicing.blockReason;
    const blockedTitle = isBlockedByActiveSplitWrongScope
      ? copy.blocked.titleSplitShare
      : isFalseTripScope
      ? copy.blocked.titleFalseTrip
      : isAccessoryScope
        ? copy.blocked.titleAccessory
        : blockedByOperationSat
          ? copy.blocked.titleNotReady
          : copy.blocked.title;

    const blockedBody = isBlockedByActiveSplitWrongScope
      ? copy.blocked.bodySplitShare
      : blockedReason;

    return (
      <InvoiceFormPageShell
        backHref={shellBackHref}
        title={shellTitle}
        subtitle={
          isBlockedByActiveSplitWrongScope
            ? copy.create.blockedSubtitleSplitShare
            : isFalseTripScope
            ? copy.create.blockedSubtitleFalseTrip
            : isAccessoryScope
              ? copy.create.blockedSubtitleAccessory
              : copy.create.blockedSubtitle
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>{blockedTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InvoiceBillingScopeBanner scope={billingScope} notThisOnly />
            <p className="text-sm text-muted-foreground">{blockedBody}</p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  navigate(
                    isBlockedByActiveSplitWrongScope && tripId
                      ? `/trips/${tripId}`
                      : shellBackHref,
                  )
                }
              >
                {isBlockedByActiveSplitWrongScope
                  ? splitShareCopy.viewTripInvoicing
                  : copy.blocked.backToTrip}
              </Button>
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
              {linkedInvoiceId && !isBlockedByActiveSplitWrongScope ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/invoices/${linkedInvoiceId}`)}
                >
                  {copy.blocked.viewInvoice(linkedInvoiceFolio)}
                </Button>
              ) : !isBlockedByActiveSplitWrongScope ? (
                <Button
                  variant="outline"
                  onClick={() => navigate("/finance/invoices")}
                >
                  {copy.blocked.goFinance}
                </Button>
              ) : null}
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
      trailing={<InvoiceBillingScopeBadge scope={formBillingScope} />}
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
          sharePercent={isSplitShareScope ? prefill?.sharePercent : undefined}
          splitLegsInvoiced={
            isSplitShareScope
              ? tripContext?.invoicing.splitLegsInvoiced
              : undefined
          }
          splitLegsTotal={
            isSplitShareScope ? tripContext?.invoicing.splitLegsTotal : undefined
          }
          attachCartaPorte={
            isSplitShareScope && !isEditMode ? attachCartaPorte : undefined
          }
          showCartaPorte={isSplitShareScope && !isEditMode}
          cartaPorteAlreadyAttached={cartaPorteAlreadyAttached}
          onAttachCartaPorteChange={
            isSplitShareScope && !isEditMode ? setAttachCartaPorte : undefined
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
          <div className="order-2 space-y-6 lg:order-1">
            <FormSectionCard
              title={copy.section.concepts}
              description={conceptsSectionDescription}
              icon={<ClipboardList className="h-4 w-4" />}
              contentClassName="pt-0"
            >
              <div id={CONCEPTS_SECTION_ID}>
                <InvoiceConceptsEditor
                  control={control}
                  setValue={form.setValue}
                  taxRate={taxRate}
                  tripBaseRate={
                    isServiceOnlyBillingScope(formBillingScope)
                      ? undefined
                      : (tripContext?.costs?.baseRate ?? prefill?.subtotal)
                  }
                  retentionRequired={retentionRequired}
                  billingScope={formBillingScope}
                  showDiscount
                />
              </div>
            </FormSectionCard>

            <InvoiceFiscalComprobanteCard
              control={control}
              onEdit={() => openReceiverSheet()}
              receiverReady={readiness.receiverOk}
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
          </div>

          <aside className="order-1 space-y-4 lg:sticky lg:top-20 lg:order-2 lg:self-start">
            <InvoiceCreateReadinessChecklist
              readiness={readiness}
              onFixReceiver={() => openReceiverSheet()}
              onFixConcepts={() => {
                document.getElementById(CONCEPTS_SECTION_ID)?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            />

            <InvoiceAmountsSummaryPanel
              control={control}
              className="w-full"
              hideTotal={!isEditMode}
            />

            {/* CTA en rail (desktop): importes sin total duplicado. */}
            <div className="hidden space-y-3 rounded-lg border bg-card p-4 shadow-sm lg:block">
              {showValidationSummary && validationSummaryMessages.length > 0 ? (
                <FormValidationSummary
                  title={validationSummaryTitle}
                  messages={validationSummaryMessages}
                  className="mb-0 max-h-40 overflow-y-auto"
                />
              ) : null}

              {!isEditMode ? (
                <p className="text-xs text-muted-foreground">
                  {copy.create.submitHint}
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isPending || isUpdating}>
                  {isPending || isUpdating
                    ? copy.label.saving
                    : isEditMode
                      ? copy.edit.submit
                      : copy.create.submit}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(shellBackHref)}
                >
                  {copy.label.cancel}
                </Button>
              </div>
            </div>
          </aside>
        </div>

        {/* CTA sticky (móvil): el rail queda arriba; aquí se confirma al final. */}
        <div className="sticky bottom-0 z-10 space-y-3 rounded-lg border bg-card/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
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
                  {copy.create.submitHint}
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
