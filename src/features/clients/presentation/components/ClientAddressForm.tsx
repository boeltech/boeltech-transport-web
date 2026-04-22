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
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useForm, Controller, useWatch, type Resolver } from "react-hook-form";
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
import { Separator } from "@shared/ui/separator";
import { Switch } from "@shared/ui/switch";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { MapPin, User, Clock, Info, AlertTriangle } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

// Importar componente unificado de campos SAT
import {
  AddressFields,
  type SatAddressValues,
} from "@features/catalogs/presentation/components";

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

// ============================================================================
// COMPONENT
// ============================================================================

export const ClientAddressForm = forwardRef<
  ClientAddressFormRef,
  ClientAddressFormProps
>(function ClientAddressForm(
  {
    isBillingAddress = false,
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

  // Watch valores que afectan cascadas
  const satEstadoCode = formValues.satEstadoCode ?? "";
  const satMunicipioCode = formValues.satMunicipioCode ?? "";
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

  // Handler unificado para AddressFields
  const handleAddressChange = useCallback(
    (changes: SatAddressValues) => {
      if (changes.estadoCode !== undefined)
        setValue("satEstadoCode", changes.estadoCode, { shouldValidate: true });
      if (changes.municipioCode !== undefined)
        setValue("satMunicipioCode", changes.municipioCode, {
          shouldValidate: true,
        });
      if (changes.postalCode !== undefined)
        setValue("postalCode", changes.postalCode, { shouldValidate: true });
      if (changes.coloniaCode !== undefined)
        setValue("satColoniaCode", changes.coloniaCode);
      if (changes.localidadCode !== undefined)
        setValue("satLocalidadCode", changes.localidadCode);
    },
    [setValue],
  );

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
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Tipo de Dirección</h3>
            </div>

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
          </div>

          <Separator />
        </>
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
      {/* UBICACIÓN SAT (Carta Porte 3.1)                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Ubicación SAT</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Seleccione la ubicación usando los catálogos del SAT para Carta Porte
          3.1
        </p>

        <AddressFields
          values={{
            estadoCode: satEstadoCode,
            municipioCode: satMunicipioCode,
            postalCode,
            coloniaCode: formValues.satColoniaCode ?? "",
            localidadCode: formValues.satLocalidadCode ?? "",
          }}
          onChange={handleAddressChange}
          errors={{
            estado: errors.satEstadoCode?.message,
            municipio: errors.satMunicipioCode?.message,
            postalCode: errors.postalCode?.message,
          }}
          required={{ estado: true, municipio: true, postalCode: true }}
          disabled={disabled}
          showLocalidadHint
        />
      </div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DIRECCIÓN DESGLOSADA                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <h3 className="font-medium">Dirección</h3>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Calle */}
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="street">Calle</Label>
            <Input
              id="street"
              placeholder="Nombre de la calle"
              disabled={disabled}
              {...register("street")}
            />
          </div>

          {/* Número exterior */}
          <div className="space-y-2">
            <Label htmlFor="exteriorNumber">Número Exterior</Label>
            <Input
              id="exteriorNumber"
              placeholder="123"
              disabled={disabled}
              {...register("exteriorNumber")}
            />
          </div>

          {/* Número interior */}
          <div className="space-y-2">
            <Label htmlFor="interiorNumber">Número Interior</Label>
            <Input
              id="interiorNumber"
              placeholder="A, 101, etc."
              disabled={disabled}
              {...register("interiorNumber")}
            />
          </div>

          {/* Referencia */}
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="reference">Referencia</Label>
            <Input
              id="reference"
              placeholder="Ej: Entre calle A y calle B, frente al parque"
              disabled={disabled}
              {...register("reference")}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DATOS REMITENTE/DESTINATARIO (Carta Porte)                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Datos para Carta Porte</h3>
        </div>

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
      </div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CONTACTO EN ESTA DIRECCIÓN                                              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Contacto en esta Dirección</h3>
        </div>

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
      </div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* OPERACIÓN                                                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Operación</h3>
        </div>

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
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* COORDENADAS (para cálculo automático de distancias)                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Coordenadas</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Opcionales. Permiten calcular automáticamente las distancias entre paradas al crear un viaje.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitud</Label>
            <Controller
              name="latitude"
              control={control}
              render={({ field }) => (
                <Input
                  id="latitude"
                  type="number"
                  placeholder="Ej: 19.432608"
                  step="any"
                  disabled={disabled}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value !== "" ? parseFloat(e.target.value) : null,
                    )
                  }
                />
              )}
            />
            {errors.latitude && (
              <p className="text-sm text-destructive">{errors.latitude.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitud</Label>
            <Controller
              name="longitude"
              control={control}
              render={({ field }) => (
                <Input
                  id="longitude"
                  type="number"
                  placeholder="Ej: -99.133209"
                  step="any"
                  disabled={disabled}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value !== "" ? parseFloat(e.target.value) : null,
                    )
                  }
                />
              )}
            />
            {errors.longitude && (
              <p className="text-sm text-destructive">{errors.longitude.message}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Advertencia si faltan campos para Carta Porte */}
      {(!satEstadoCode || !satMunicipioCode || !postalCode) && (
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
