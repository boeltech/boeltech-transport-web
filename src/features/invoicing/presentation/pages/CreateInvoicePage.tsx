import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, Info } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Checkbox } from "@shared/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
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
import { Skeleton } from "@shared/ui/skeleton";

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

  // Client selector state — independent of trip prefill
  const [selectedClientId, setSelectedClientId] = useState<string>("");

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
  });

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

  if (isEditMode && isLoadingEditableInvoice) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isEditMode && (!editableInvoice || editableInvoice.status !== "draft")) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Factura</h1>
        </div>
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
      </div>
    );
  }

  if (!isEditMode && !hasTripContext) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Editar Factura" : "Nueva Factura"}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Creación desde viaje obligatoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para alinear el flujo con backend, la factura debe crearse desde un
              viaje completado (`trip_id`).
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/trips")}>Ir a viajes</Button>
              <Button variant="outline" onClick={() => navigate("/finance?tab=invoices")}>
                Volver a finanzas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isEditMode && hasTripContext && isTripContextLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isEditMode && (isBlockedByTripContext || isAlreadyInvoicedByError)) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nueva Factura</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Este viaje ya está facturado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{blockedReason}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/trips")}>Volver a viajes</Button>
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
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Factura</h1>
          {isEditMode && editableInvoice && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Editando borrador{" "}
              <span className="font-medium">
                {editableInvoice.serie}-{editableInvoice.folio}
              </span>
            </p>
          )}
          {prefill && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Pre-llenado desde viaje{" "}
              <span className="font-medium">{prefill.tripCode}</span>
            </p>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <FormField
                  control={form.control}
                  name="receiver_rfc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFC</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="XAXX010101000"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiver_postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal (domicilio fiscal)</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" maxLength={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="receiver_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre / Razón Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del receptor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receiver_tax_regime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Régimen Fiscal</FormLabel>
                      <FormControl>
                        <RegimenFiscalSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecciona régimen"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cfdi_usage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uso CFDI</FormLabel>
                      <FormControl>
                        <UsoCfdiSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecciona uso"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="payment_form"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pago</FormLabel>
                      <FormControl>
                        <FormaPagoSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecciona"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <FormControl>
                        <MetodoPagoSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecciona"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <FormControl>
                        <CatalogSelect
                          typeCode="sat_moneda"
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Selecciona moneda"
                          displayFormat="code-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="subtotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtotal</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descuento</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total_tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        IVA{" "}
                        <span className="text-xs text-muted-foreground font-normal">
                          ({(taxRate * 100).toFixed(0)}%)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* IVA Retenido — persona moral (Art. 1-A LIVA) */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="apply_retained_tax"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                          }}
                        />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel className="font-normal cursor-pointer">
                          Aplica retención IVA 4% (persona moral)
                        </FormLabel>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3 shrink-0" />
                          Art. 1-A LIVA — autotransporte terrestre de carga
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {isPersonaMoral && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="retained_tax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            IVA Retenido{" "}
                            <span className="text-xs text-muted-foreground font-normal">
                              (4%)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
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
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Notas internas, referencias, observaciones..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

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
      </Form>
    </div>
  );
}
