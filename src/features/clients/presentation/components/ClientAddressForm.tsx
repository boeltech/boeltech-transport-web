/**
 * ClientAddressForm Component
 * Clean Architecture - Presentation Layer
 *
 * Formulario para capturar dirección de cliente con campos Carta Porte 3.1.
 * Usado en:
 * - Paso 2 del wizard de creación de cliente (dirección fiscal)
 * - Modal de agregar/editar dirección
 *
 * Ubicación: src/features/clients/presentation/components/ClientAddressForm.tsx
 */

import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  useForm,
  Controller,
  useWatch,
  type Control,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Card, CardContent } from "@shared/ui/card";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Switch } from "@shared/ui/switch";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { MapPin, User, Clock, Info, AlertTriangle } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import AddressInput from "@shared/ui/address-input/AddressInput";

import { ADDRESS_TYPE_LABELS, type AddressType } from "../../domain";
import {
  clientAddressFormSchema,
  defaultClientAddressFormValues,
  defaultBillingAddressFormValues,
  type ClientAddressFormData,
  //   type BillingAddressFormData,
} from "../validation/clientAddressSchema";
import { ADDRESS_TYPE_CONFIG } from "../config/clientConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientAddressFormRef {
  triggerValidation: () => Promise<boolean>;
}

export interface ClientAddressFormProps {
  /** Si es true, se usa el schema de dirección fiscal (billing obligatorio) */
  isBillingAddress?: boolean;
  /** Wizard de alta: oculta el título de la sección de ubicación (el paso ya lo indica) */
  hideLocationSectionTitle?: boolean;
  /** Valores iniciales del formulario */
  defaultValues?: Partial<ClientAddressFormData>;
  /** Pre-llenar RFC del cliente */
  clientRfc?: string;
  /** Pre-llenar nombre del cliente */
  clientName?: string;
  /** Callback cuando se envía el formulario */
  onSubmit?: (data: ClientAddressFormData) => void;
  /** Callback cuando cambian los datos */
  onChange?: (data: ClientAddressFormData, isValid: boolean) => void;
  /** Deshabilitar edición */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

function LocationAddressFields({
  isBillingAddress,
  control,
  disabled,
}: {
  isBillingAddress: boolean;
  control: Control<ClientAddressFormData>;
  disabled: boolean;
}) {
  return (
    <>
      <p className="text-sm text-muted-foreground">
        {isBillingAddress
          ? "Captura la dirección fiscal con catálogos SAT (requerido para CFDI y Carta Porte)."
          : "Selecciona estado, municipio, código postal y colonia según los catálogos del SAT."}
      </p>
      <AddressInput<ClientAddressFormData>
        mode={isBillingAddress ? "carta-porte" : "cfdi"}
        control={control}
        namePrefix=""
        layout="compact"
        showLatLng
        showPrimaryToggle={false}
        disabled={disabled}
      />
    </>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ClientAddressForm = forwardRef<
  ClientAddressFormRef,
  ClientAddressFormProps
>(function ClientAddressForm(
  {
    isBillingAddress = false,
    hideLocationSectionTitle = false,
    defaultValues,
    clientRfc,
    clientName,
    onSubmit,
    onChange,
    disabled = false,
    className,
  },
  ref,
) {
  const hasClientFiscalData = Boolean(clientRfc || clientName);
  const [useClientFiscalData, setUseClientFiscalData] = useState(
    hasClientFiscalData,
  );
  const hasInitializedFiscalModeRef = useRef(false);

  // Se usa un único schema para evitar incompatibilidades de tipos entre variantes.
  // Para dirección fiscal, se fuerzan valores en runtime.
  const defaults = isBillingAddress
    ? defaultBillingAddressFormValues
    : defaultClientAddressFormValues;

  const form = useForm<ClientAddressFormData, unknown, ClientAddressFormData>({
    resolver: zodResolver(clientAddressFormSchema) as Resolver<ClientAddressFormData>,
    defaultValues: {
      ...defaults,
      ...defaultValues,
      // Pre-llenar RFC y nombre del cliente
      rfcRemitenteDestinatario:
        defaultValues?.rfcRemitenteDestinatario || clientRfc || "",
      nombreRemitenteDestinatario:
        defaultValues?.nombreRemitenteDestinatario || clientName || "",
    },
    mode: "onChange",
  });

  const {
    register,
    control,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors, isValid },
  } = form;

  useImperativeHandle(ref, () => ({
    triggerValidation: () => trigger(),
  }));

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastParentNotifyKey = useRef<string>("");

  useEffect(() => {
    if (!isBillingAddress) return;

    setValue("addressType", "billing");
    setValue("isPrimary", true);
  }, [isBillingAddress, setValue]);

  // Observar todos los valores reactivamente (compatible con React Compiler)
  const formValues = useWatch({ control });

  const satStateCode = formValues.satStateCode ?? "";
  const satMunicipalityCode = formValues.satMunicipalityCode ?? "";
  const postalCode = formValues.postalCode ?? "";

  // Inicializar modo de uso de datos fiscales con base en valores existentes.
  // Si la dirección ya tenía un remitente/destinatario diferente al cliente,
  // mantenemos el modo manual para no sobreescribir datos históricos.
  useEffect(() => {
    if (!hasClientFiscalData || hasInitializedFiscalModeRef.current) return;

    const normalizeRfc = (value?: string) =>
      (value ?? "")
        .trim()
        .toUpperCase();
    const normalizeName = (value?: string) =>
      (value ?? "")
        .trim()
        .toLowerCase();

    const currentRfc = normalizeRfc(formValues.rfcRemitenteDestinatario);
    const currentName = normalizeName(formValues.nombreRemitenteDestinatario);
    const clientRfcNormalized = normalizeRfc(clientRfc);
    const clientNameNormalized = normalizeName(clientName);

    const hasCurrentValues = Boolean(currentRfc || currentName);
    const matchesClientData =
      (!clientRfcNormalized || currentRfc === clientRfcNormalized) &&
      (!clientNameNormalized || currentName === clientNameNormalized);

    setUseClientFiscalData(!hasCurrentValues || matchesClientData);
    hasInitializedFiscalModeRef.current = true;
  }, [
    clientName,
    clientRfc,
    formValues.nombreRemitenteDestinatario,
    formValues.rfcRemitenteDestinatario,
    hasClientFiscalData,
  ]);

  useEffect(() => {
    if (!useClientFiscalData || !hasClientFiscalData) return;

    if (clientRfc) {
      setValue("rfcRemitenteDestinatario", clientRfc.toUpperCase(), {
        shouldValidate: true,
      });
    }
    if (clientName) {
      setValue("nombreRemitenteDestinatario", clientName, {
        shouldValidate: true,
      });
    }
  }, [clientName, clientRfc, hasClientFiscalData, setValue, useClientFiscalData]);

  // Notificar cambios al padre (onChange no va en deps: identidad inestable → bucle infinito con setState del padre).
  // Dedup por contenido: useWatch puede entregar nueva referencia en renders sin cambios reales de valores.
  useEffect(() => {
    const key = JSON.stringify(formValues) + "|" + String(isValid);
    if (key === lastParentNotifyKey.current) return;
    lastParentNotifyKey.current = key;
    onChangeRef.current?.(formValues as ClientAddressFormData, isValid);
  }, [formValues, isValid]);

  // Submit handler
  const handleFormSubmit = (data: ClientAddressFormData) => {
    onSubmit?.(data);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-6", className)}
    >
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TIPO Y CONFIGURACIÓN                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {!isBillingAddress && (
        <FormSectionCard
          title="Tipo de Dirección"
          icon={<MapPin className="h-4 w-4" />}
          contentClassName="space-y-4"
        >

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Tipo de dirección */}
              <div className="space-y-2">
                <Label htmlFor="addressType">
                  Tipo <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="addressType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(ADDRESS_TYPE_LABELS) as AddressType[]
                        ).map((type) => {
                          const config = ADDRESS_TYPE_CONFIG[type];
                          const Icon = config.icon;
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Nombre del lugar */}
              <div className="space-y-2">
                <Label htmlFor="locationName">Nombre del Lugar</Label>
                <Input
                  id="locationName"
                  placeholder="Ej: Bodega Principal, Sucursal Norte"
                  disabled={disabled}
                  {...register("locationName")}
                />
              </div>
            </div>

            {/* Es dirección primaria */}
            <div className="flex items-center gap-2">
              <Controller
                name="isPrimary"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isPrimary"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                )}
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">
                Dirección principal
              </Label>
            </div>
        </FormSectionCard>
      )}

      {/* Info para dirección fiscal */}
      {isBillingAddress && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta dirección se usará como domicilio fiscal en los CFDI y Carta
            Porte.
          </AlertDescription>
        </Alert>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Dirección (SAT + calle + CP + coordenadas vía AddressInput)            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {hideLocationSectionTitle ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <LocationAddressFields
              isBillingAddress={isBillingAddress}
              control={control}
              disabled={disabled}
            />
          </CardContent>
        </Card>
      ) : (
        <FormSectionCard
          title="Ubicación y domicilio"
          icon={<MapPin className="h-4 w-4" />}
          contentClassName="space-y-4"
        >
          <LocationAddressFields
            isBillingAddress={isBillingAddress}
            control={control}
            disabled={disabled}
          />
        </FormSectionCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DATOS REMITENTE/DESTINATARIO (Carta Porte)                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <FormSectionCard
        title="Datos para Carta Porte"
        icon={<User className="h-4 w-4" />}
        contentClassName="space-y-4"
      >

        <p className="text-sm text-muted-foreground">
          Estos datos se usarán en el complemento Carta Porte del CFDI
        </p>

        <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/30 p-3">
          <div className="space-y-1">
            <Label htmlFor="useClientFiscalData" className="cursor-pointer">
              Usar datos fiscales del cliente
            </Label>
            <p className="text-xs text-muted-foreground">
              Recomendado para la mayoría de los casos. Desactiva esta opción
              solo si esta ubicación maneja remitente/destinatario distinto.
            </p>
          </div>
          <Switch
            id="useClientFiscalData"
            checked={useClientFiscalData}
            onCheckedChange={setUseClientFiscalData}
            disabled={disabled || !hasClientFiscalData}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* RFC Remitente/Destinatario */}
          <div className="space-y-2">
            <Label htmlFor="rfcRemitenteDestinatario">
              RFC Remitente/Destinatario
            </Label>
            <Input
              id="rfcRemitenteDestinatario"
              placeholder="RFC del remitente o destinatario"
              className="uppercase"
              maxLength={13}
              disabled={disabled || useClientFiscalData}
              {...register("rfcRemitenteDestinatario", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
            <p className="text-xs text-muted-foreground">
              Normalmente el RFC del cliente
            </p>
          </div>

          {/* Nombre Remitente/Destinatario */}
          <div className="space-y-2">
            <Label htmlFor="nombreRemitenteDestinatario">
              Nombre Remitente/Destinatario
            </Label>
            <Input
              id="nombreRemitenteDestinatario"
              placeholder="Nombre o razón social"
              disabled={disabled || useClientFiscalData}
              {...register("nombreRemitenteDestinatario")}
            />
          </div>
        </div>
      </FormSectionCard>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CONTACTO EN ESTA DIRECCIÓN                                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <FormSectionCard
        title="Contacto en esta Dirección"
        icon={<User className="h-4 w-4" />}
        contentClassName="space-y-4"
      >

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="contactName">Nombre</Label>
            <Input
              id="contactName"
              placeholder="Nombre del contacto"
              disabled={disabled}
              {...register("contactName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Teléfono</Label>
            <Input
              id="contactPhone"
              placeholder="55 1234 5678"
              disabled={disabled}
              {...register("contactPhone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="contacto@ejemplo.com"
              disabled={disabled}
              {...register("contactEmail")}
            />
            {errors.contactEmail && (
              <p className="text-sm text-destructive">
                {errors.contactEmail.message}
              </p>
            )}
          </div>
        </div>
      </FormSectionCard>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* OPERACIÓN                                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <FormSectionCard
        title="Operación"
        icon={<Clock className="h-4 w-4" />}
        contentClassName="space-y-4"
      >

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessHours">Horario de Atención</Label>
            <Input
              id="businessHours"
              placeholder="Ej: Lun-Vie 9:00-18:00"
              disabled={disabled}
              {...register("businessHours")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="specialInstructions">
              Instrucciones Especiales
            </Label>
            <Textarea
              id="specialInstructions"
              placeholder="Instrucciones de acceso, requisitos de seguridad, etc."
              rows={2}
              disabled={disabled}
              {...register("specialInstructions")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre esta dirección"
              rows={2}
              disabled={disabled}
              {...register("notes")}
            />
          </div>
        </div>
      </FormSectionCard>

      {/* Advertencia si faltan campos para Carta Porte */}
      {(!satStateCode || !satMunicipalityCode || !postalCode) && (
        <Alert
          variant="default"
          className="border-amber-500 bg-amber-50 dark:bg-amber-950"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Para generar Carta Porte 3.1 válida, debes completar Estado,
            Municipio y Código Postal.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
});

export default ClientAddressForm;






