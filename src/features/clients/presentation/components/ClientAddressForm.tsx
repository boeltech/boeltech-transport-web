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

import { useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
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

// Importar componentes de catálogos SAT
import {
  EstadoSelect,
  MunicipioSelect,
  ColoniaCombobox,
  LocalidadCombobox,
} from "@features/catalogs/presentation/components";

import { ADDRESS_TYPE_LABELS, type AddressType } from "../../domain";
import {
  clientAddressFormSchema,
  billingAddressFormSchema,
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
  // Seleccionar schema y defaults según tipo
  const schema = isBillingAddress
    ? billingAddressFormSchema
    : clientAddressFormSchema;
  const defaults = isBillingAddress
    ? defaultBillingAddressFormValues
    : defaultClientAddressFormValues;

  const form = useForm<ClientAddressFormData>({
    resolver: zodResolver(schema),
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

  // Observar todos los valores reactivamente (compatible con React Compiler)
  const formValues = useWatch({ control });

  // Watch valores que afectan cascadas
  const satEstadoCode = formValues.satEstadoCode ?? "";
  const satMunicipioCode = formValues.satMunicipioCode ?? "";
  const postalCode = formValues.postalCode ?? "";

  // Notificar cambios al padre
  useEffect(() => {
    onChange?.(formValues as ClientAddressFormData, isValid);
  }, [formValues, isValid, onChange]);

  // Limpiar dependencias cuando cambia el estado
  const handleEstadoChange = (value: string) => {
    setValue("satEstadoCode", value);
    setValue("satMunicipioCode", "");
    setValue("satLocalidadCode", "");
    // Nota: Colonia depende de CP, no de Estado
  };

  // Limpiar localidad cuando cambia municipio
  // El catálogo devuelve código compuesto "AGU-001" → guardar solo el código corto "001"
  const handleMunicipioChange = (value: string) => {
    const shortCode = value.includes("-") ? value.split("-")[1] : value;
    setValue("satMunicipioCode", shortCode, { shouldValidate: true });
    setValue("satLocalidadCode", "");
  };

  // Limpiar colonia cuando cambia CP
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
    setValue("postalCode", value, { shouldValidate: true });
    if (value.length !== 5) {
      setValue("satColoniaCode", "");
    }
  };

  const handleColoniaChange = (value: string) => {
    // El catálogo devuelve "12345-0001" → guardar solo el código corto "0001"
    const shortCode = value.includes("-") ? value.split("-")[1] : value;
    setValue("satColoniaCode", shortCode);
  };

  const handleLocalidadChange = (value: string) => {
    // El catálogo devuelve "AGU-01" → guardar solo el código corto "01"
    const shortCode = value.includes("-") ? value.split("-")[1] : value;
    setValue("satLocalidadCode", shortCode);
  };

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

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Estado */}
          <div className="space-y-2">
            <Label>
              Estado <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="satEstadoCode"
              control={control}
              render={({ field }) => (
                <EstadoSelect
                  value={field.value}
                  onValueChange={handleEstadoChange}
                  disabled={disabled}
                  placeholder="Seleccione estado"
                />
              )}
            />
            {errors.satEstadoCode && (
              <p className="text-sm text-destructive">
                {errors.satEstadoCode.message}
              </p>
            )}
          </div>

          {/* Municipio */}
          <div className="space-y-2">
            <Label>
              Municipio <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="satMunicipioCode"
              control={control}
              render={({ field }) => (
                <MunicipioSelect
                  value={field.value ? `${satEstadoCode}-${field.value}` : ""}
                  onValueChange={handleMunicipioChange}
                  estadoCode={satEstadoCode}
                  disabled={disabled || !satEstadoCode}
                  placeholder={
                    satEstadoCode
                      ? "Seleccione municipio"
                      : "Primero seleccione estado"
                  }
                />
              )}
            />
            {errors.satMunicipioCode && (
              <p className="text-sm text-destructive">
                {errors.satMunicipioCode.message}
              </p>
            )}
          </div>

          {/* Código Postal */}
          <div className="space-y-2">
            <Label htmlFor="postalCode">
              Código Postal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="postalCode"
              placeholder="12345"
              maxLength={5}
              disabled={disabled}
              value={postalCode}
              onChange={handlePostalCodeChange}
            />
            {errors.postalCode && (
              <p className="text-sm text-destructive">
                {errors.postalCode.message}
              </p>
            )}
          </div>

          {/* Colonia */}
          <div className="space-y-2">
            <Label>Colonia</Label>
            <Controller
              name="satColoniaCode"
              control={control}
              render={({ field }) => (
                <ColoniaCombobox
                  value={field.value ? `${postalCode}-${field.value}` : ""}
                  onValueChange={(value) => {
                    handleColoniaChange(value);
                  }}
                  codigoPostal={postalCode}
                  disabled={disabled || !postalCode || postalCode.length !== 5}
                  placeholder={
                    postalCode?.length === 5
                      ? "Buscar colonia..."
                      : "Ingrese código postal primero"
                  }
                />
              )}
            />
          </div>

          {/* Localidad (opcional, para zonas rurales) */}
          <div className="space-y-2 sm:col-span-2">
            <Label>Localidad (opcional)</Label>
            <Controller
              name="satLocalidadCode"
              control={control}
              render={({ field }) => (
                <LocalidadCombobox
                  value={field.value ? `${satEstadoCode}-${field.value}` : ""}
                  onValueChange={(value) => {
                    handleLocalidadChange(value);
                  }}
                  estadoCode={satEstadoCode}
                  disabled={disabled || !satEstadoCode}
                  placeholder="Solo para zonas rurales"
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              La localidad solo es necesaria para zonas rurales o cuando no hay
              código postal definido
            </p>
          </div>
        </div>
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
              disabled={disabled}
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
              disabled={disabled}
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
