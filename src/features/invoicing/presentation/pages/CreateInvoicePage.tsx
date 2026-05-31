import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Info } from "lucide-react";
import { usePermissions } from "@shared/permissions";
import { InvoiceFormPageShell } from "../components/InvoiceFormPageShell";
import {
  canShowInvoiceFromTripCta,
  FINANCE_INVOICE_FROM_TRIP_CTA,
} from "../financeInvoiceFromTripCta";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Checkbox } from "@shared/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFCatalogField,
  RHFTextField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
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
import { useActiveClients } from "@features/clients/application";
import { useClientBillingAddress } from "@features/clients/application";

// ============================================================================
// SCHEMA
// ============================================================================

const RETAINED_TAX_RATE = 0.04; // 4% — Art. 1-A LIVA autotransporte terrestre

const schema = z.object({
  receiver_rfc: z
    .string()
    .min(12, "RFC muy corto")
    .max(13, "RFC muy largo")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/, "Formato de RFC inválido"),
  receiver_name: z.string().min(1, "Nombre requerido").max(255),
  cfdi_usage: z.string().min(1, "Uso CFDI requerido"),
  receiver_tax_regime: z.string().min(1, "Régimen fiscal requerido"),
  receiver_postal_code: z
    .string()
    .regex(/^\d{5}$/, "Código postal (5 dígitos)"),
  payment_form: z.string().min(1, "Forma de pago requerida"),
  payment_method: z.enum(["PUE", "PPD"]),
  currency: z.string().min(3).max(5),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  apply_retained_tax: z.boolean(),
  total_tax: z.number().nonnegative(),
  retained_tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
  notes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

// ============================================================================
// COMPONENT
// ============================================================================

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

  const shellTitle = isEditMode ? "Editar factura" : "Nueva factura";

  // Client selector state — independent of trip prefill
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────

  const {
    data: prefill,
    isLoading: prefillLoading,
    isError: prefillIsError,
    error: prefillError,
  } = useInvoicePrefill(tripId);
  const {
    data: tripContext,
    isLoading: isTripContextLoading,
  } = useTrip(tripId, {
    enabled: !isEditMode && hasTripContext,
  });

  const {
    data: editableInvoice,
    isLoading: isLoadingEditableInvoice,
    isError: isEditableInvoiceError,
    error: editableInvoiceError,
  } = useInvoice(invoiceId ?? "");

  const { data: clients = [], isLoading: isLoadingClients } = useActiveClients();

  const { data: billingAddress } = useClientBillingAddress(
    selectedClientId || undefined,
  );

  const prefillErrorMessage = prefillError ? getErrorMessage(prefillError) : "";
  const isAlreadyInvoicedByError =
    !isEditMode &&
    prefillIsError &&
    /ya\s+(est[aá]\s+)?(vinculado|facturado)|trip_already_invoiced|already\s+invoiced/i.test(
      prefillErrorMessage,
    );
  const isBlockedByTripContext =
    !isEditMode && !!tripContext && !tripContext.invoicing.canGenerateInvoice;
  const linkedInvoiceId = tripContext?.invoicing.invoiceId ?? null;
  const linkedInvoiceFolio = tripContext?.invoicing.invoiceFolio ?? null;
  const blockedReason =
    tripContext?.invoicing.blockReason ??
    (isAlreadyInvoicedByError ? prefillErrorMessage : null) ??
    "Este viaje ya tiene una factura activa y no se puede facturar nuevamente.";

  // ── Form ─────────────────────────────────────────────────────────────────

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      receiver_rfc: "",
      receiver_name: "",
      cfdi_usage: "S01",
      receiver_tax_regime: "",
      receiver_postal_code: "",
      payment_form: "99",
      payment_method: "PUE",
      currency: "MXN",
      subtotal: 0,
      discount: 0,
      apply_retained_tax: false,
      total_tax: 0,
      retained_tax: 0,
      total: 0,
      notes: "",
    },
    mode: "onChange",
  });

  const { control } = form;

  // Watch fields for auto-calculation
  const subtotal = useWatch({ control: form.control, name: "subtotal" });
  const discount = useWatch({ control: form.control, name: "discount" });
  const applyRetainedTax = useWatch({ control: form.control, name: "apply_retained_tax" });
  const taxRate = prefill?.taxRate ?? 0.16;
  const isPersonaMoral = !!applyRetainedTax;

  // ── Effects ──────────────────────────────────────────────────────────────

  // Error toast for prefill
  useEffect(() => {
    if (!isEditMode && prefillIsError && prefillError && !isAlreadyInvoicedByError) {
      toast({
        variant: "destructive",
        title: "No se pudo cargar el viaje",
        description: getErrorMessage(prefillError),
      });
    }
  }, [prefillIsError, prefillError, isEditMode, isAlreadyInvoicedByError]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isEditMode && isEditableInvoiceError && editableInvoiceError) {
      toast({
        variant: "destructive",
        title: "No se pudo cargar el borrador",
        description: getErrorMessage(editableInvoiceError),
      });
    }
  }, [isEditMode, isEditableInvoiceError, editableInvoiceError]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill form from trip prefill (takes priority over client selector)
  useEffect(() => {
    if (!isEditMode && prefill) {
      const personaMoral = prefill.clientType === "company";
      form.reset({
        receiver_rfc: prefill.receiverRfc ?? "",
        receiver_name: prefill.receiverName ?? "",
        cfdi_usage: prefill.cfdiUsage ?? "S01",
        receiver_tax_regime: prefill.receiverTaxRegime ?? "",
        receiver_postal_code: prefill.receiverPostalCode ?? "",
        payment_form: prefill.paymentForm ?? "99",
        payment_method: prefill.paymentMethod as "PUE" | "PPD",
        currency: prefill.currency ?? "MXN",
        subtotal: prefill.subtotal ?? 0,
        discount: 0,
        apply_retained_tax: personaMoral,
        total_tax: prefill.totalTax ?? 0,
        retained_tax: prefill.retainedTax ?? 0,
        total: prefill.total ?? 0,
        notes: "",
      });
    }
  }, [prefill, form, isEditMode]);

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
      currency: editableInvoice.currency ?? "MXN",
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

  // Auto-fill receiver fields when a client is selected (only if no trip prefill)
  // Note: ClientListItem only has taxId and legalName — taxRegime must be selected manually
  useEffect(() => {
    if (!selectedClientId || prefill || isEditMode) return;
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;
    const personaMoral = client.type === "company";
    form.setValue("receiver_rfc", client.taxId);
    form.setValue("receiver_name", client.legalName);
    form.setValue("apply_retained_tax", personaMoral);
  }, [selectedClientId, clients, prefill, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill postal code from billing address when available
  useEffect(() => {
    if (!billingAddress || prefill || isEditMode) return;
    if (billingAddress.postalCode) {
      form.setValue("receiver_postal_code", billingAddress.postalCode);
    }
  }, [billingAddress, prefill, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-calculate IVA, IVA Retenido and Total when subtotal/discount/applyRetainedTax change
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

  // ── Mutation ─────────────────────────────────────────────────────────────

  const { mutate, isPending } = useCreateInvoice({
    onSuccess: (invoice) => {
      toast({ title: "Factura creada exitosamente" });
      navigate(`/invoices/${invoice.id}`, {
        state: { from: "/invoices/new" },
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error al crear factura",
        description: getErrorMessage(err),
      });
    },
  });

  const { mutate: updateInvoice, isPending: isUpdating } = useUpdateInvoice({
    onSuccess: (invoice) => {
      toast({ title: "Factura actualizada exitosamente" });
      navigate(`/invoices/${invoice.id}`, {
        state: { from: `/invoices/${invoice.id}/edit` },
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error al actualizar factura",
        description: getErrorMessage(err),
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    if (isEditMode) {
      if (!invoiceId) return;
      updateInvoice({
        id: invoiceId,
        payload: {
          receiverRfc: values.receiver_rfc,
          receiverName: values.receiver_name,
          cfdiUsage: values.cfdi_usage,
          receiverTaxRegime: values.receiver_tax_regime,
          receiverPostalCode: values.receiver_postal_code,
          paymentForm: values.payment_form,
          paymentMethod: values.payment_method,
          currency: values.currency,
          subtotal: values.subtotal,
          discount: values.discount,
          totalTax: values.total_tax,
          retainedTax: values.retained_tax,
          total: values.total,
          notes: values.notes || null,
        },
      });
      return;
    }

    if (!hasTripContext) {
      toast({
        variant: "destructive",
        title: "Viaje requerido",
        description: "Para crear una factura debes iniciar desde un viaje completado.",
      });
      return;
    }

    mutate({
      tripIds: tripId ? [tripId] : [],
      receiverRfc: values.receiver_rfc,
      receiverName: values.receiver_name,
      cfdiUsage: values.cfdi_usage,
      receiverTaxRegime: values.receiver_tax_regime,
      receiverPostalCode: values.receiver_postal_code,
      paymentForm: values.payment_form,
      paymentMethod: values.payment_method,
      currency: values.currency,
      subtotal: values.subtotal,
      discount: values.discount,
      totalTax: values.total_tax,
      retainedTax: values.retained_tax,
      total: values.total,
      notes: values.notes || undefined,
    });
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Build readable address string from billing address
  const billingAddressText = billingAddress
    ? [
        billingAddress.street,
        billingAddress.exteriorNumber
          ? `#${billingAddress.exteriorNumber}`
          : undefined,
        billingAddress.interiorNumber
          ? `Int. ${billingAddress.interiorNumber}`
          : undefined,
        billingAddress.city,
        billingAddress.state,
        billingAddress.postalCode ? `C.P. ${billingAddress.postalCode}` : undefined,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  const shellSubtitle = isEditMode && editableInvoice
    ? `Borrador ${editableInvoice.serie}-${editableInvoice.folio}`
    : prefill
      ? `Desde viaje ${prefill.tripCode}`
      : undefined;

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
        title="Editar factura"
        subtitle="Solo borradores son editables"
      >
        <Card>
          <CardHeader>
            <CardTitle>Edición no disponible</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Solo las facturas en estado borrador pueden editarse.
            </p>
            <Button variant="outline" onClick={() => navigate("/finance?tab=invoices")}>
              Volver a finanzas
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
            <CardTitle>Facturar desde un viaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El CFDI se genera desde un viaje con facturación disponible. Abre
              el viaje y usa «Generar factura», o el listado de viajes.
            </p>
            <div className="flex flex-wrap gap-3">
              {canInvoiceFromTrip ? (
                <Button
                  onClick={() =>
                    navigate(FINANCE_INVOICE_FROM_TRIP_CTA.tripsPath)
                  }
                >
                  {FINANCE_INVOICE_FROM_TRIP_CTA.label}
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() => navigate("/finance?tab=invoices")}
              >
                Volver a finanzas
              </Button>
            </div>
          </CardContent>
        </Card>
      </InvoiceFormPageShell>
    );
  }

  if (!isEditMode && hasTripContext && isTripContextLoading) {
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
        subtitle="No se puede crear otra factura para este viaje"
      >
        <Card>
          <CardHeader>
            <CardTitle>Este viaje ya está facturado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{blockedReason}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate(shellBackHref)}>Volver al viaje</Button>
              {linkedInvoiceId ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/invoices/${linkedInvoiceId}`)}
                >
                  Ver factura{linkedInvoiceFolio ? ` (${linkedInvoiceFolio})` : ""}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate("/finance?tab=invoices")}
                >
                  Ir a finanzas
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
              onSubmit(values);
            },
            () => {
              setShowValidationSummary(true);
            },
          )}
          className="space-y-6"
        >
          {/* RECEPTOR */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Datos del Receptor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client selector — only shown when not coming from a trip prefill */}
              {!prefill && !isEditMode && (
                <div className="space-y-1">
                  <label className="text-sm font-medium leading-none">
                    Seleccionar cliente registrado
                  </label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                    disabled={isLoadingClients}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingClients
                            ? "Cargando clientes..."
                            : "Buscar cliente..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-medium">{c.legalName}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {c.taxId}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Billing address info (read-only) */}
                  {billingAddress && billingAddressText && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1 pt-1">
                      <Building2 className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>Domicilio fiscal: {billingAddressText}</span>
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    O llena los campos manualmente si el cliente no está registrado.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="receiver_rfc"
                  render={({ field, fieldState }) => (
                    <FormFieldShell
                      fieldId="receiver_rfc"
                      label="RFC"
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
                  label="Código Postal (domicilio fiscal)"
                  placeholder="12345"
                  maxLength={5}
                />
              </div>

              <RHFTextField
                control={control}
                name="receiver_name"
                label="Nombre / Razón Social"
                placeholder="Nombre del receptor"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <RHFCatalogField
                  control={control}
                  name="receiver_tax_regime"
                  label="Régimen Fiscal"
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
                <RHFCatalogField control={control} name="cfdi_usage" label="Uso CFDI">
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

          {/* CFDI */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Datos CFDI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <RHFCatalogField control={control} name="payment_form" label="Forma de Pago">
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
                <RHFCatalogField control={control} name="payment_method" label="Método de Pago">
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
                <RHFCatalogField control={control} name="currency" label="Moneda">
                  {({ field, fieldState, resolvedId, errorMessage }) => (
                    <CatalogSelect
                      typeCode="sat_moneda"
                      triggerId={resolvedId}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Selecciona moneda"
                      displayFormat="code-name"
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                    />
                  )}
                </RHFCatalogField>
              </div>
            </CardContent>
          </Card>

          {/* IMPORTES */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Importes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(
                  [
                    ["subtotal", "Subtotal"],
                    ["discount", "Descuento"],
                    ["total", "Total"],
                  ] as const
                ).map(([name, label]) => (
                  <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field, fieldState }) => (
                      <FormFieldShell
                        fieldId={name}
                        label={label}
                        errorMessage={fieldState.error?.message}
                      >
                        <Input
                          id={name}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          error={Boolean(fieldState.error)}
                          {...getFieldErrorAriaProps(name, fieldState.error?.message)}
                        />
                      </FormFieldShell>
                    )}
                  />
                ))}
                <Controller
                  control={control}
                  name="total_tax"
                  render={({ field, fieldState }) => (
                    <FormFieldShell
                      fieldId="total_tax"
                      label={
                        <>
                          IVA{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({(taxRate * 100).toFixed(0)}%)
                          </span>
                        </>
                      }
                      errorMessage={fieldState.error?.message}
                    >
                      <Input
                        id="total_tax"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        error={Boolean(fieldState.error)}
                        {...getFieldErrorAriaProps(
                          "total_tax",
                          fieldState.error?.message,
                        )}
                      />
                    </FormFieldShell>
                  )}
                />
              </div>

              {/* IVA Retenido — persona moral (Art. 1-A LIVA) */}
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
                          Aplica retención IVA 4% (persona moral)
                        </label>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Info className="h-3 w-3 shrink-0" />
                          Art. 1-A LIVA — autotransporte terrestre de carga
                        </p>
                      </div>
                    </div>
                  )}
                />

                {isPersonaMoral ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Controller
                      control={control}
                      name="retained_tax"
                      render={({ field, fieldState }) => (
                        <FormFieldShell
                          fieldId="retained_tax"
                          label={
                            <>
                              IVA Retenido{" "}
                              <span className="text-xs font-normal text-muted-foreground">
                                (4%)
                              </span>
                            </>
                          }
                          errorMessage={fieldState.error?.message}
                        >
                          <Input
                            id="retained_tax"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            error={Boolean(fieldState.error)}
                            {...getFieldErrorAriaProps(
                              "retained_tax",
                              fieldState.error?.message,
                            )}
                          />
                        </FormFieldShell>
                      )}
                    />
                  </div>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground">
                IVA y Total se calculan automáticamente al ingresar el Subtotal.
                Puedes ajustarlos manualmente si es necesario.
              </p>
            </CardContent>
          </Card>

          {/* NOTAS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Notas Internas (opcional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RHFTextField
                control={control}
                name="notes"
                label="Notas internas"
                placeholder="Notas internas, referencias, observaciones..."
              />
            </CardContent>
          </Card>

          {showValidationSummary &&
          collectFieldErrorMessages(form.formState.errors).length > 0 ? (
            <FormValidationSummary
              title="Revisa los datos de la factura"
              messages={collectFieldErrorMessages(form.formState.errors)}
            />
          ) : null}

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || isUpdating || (!isEditMode && prefillLoading)}
            >
              {isPending || isUpdating
                ? "Guardando..."
                : isEditMode
                  ? "Guardar cambios"
                  : "Crear borrador"}
            </Button>
          </div>
        </form>
    </InvoiceFormPageShell>
  );
}
