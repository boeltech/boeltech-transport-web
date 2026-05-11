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
  memo,
} from "react";
import {
  useForm,
  Controller,
  useWatch,
  type Control,
  type Resolver,
  type UseFormSetValue,
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
import { Switch } from "@shared/ui/switch";
import {
  EntityAddressForm,
  AddressInput,
  AddressGeolocationPanel,
  ADDRESS_FORM_COPY,
  type EntityAddressFormSection,
} from "@shared/ui/address-input";
import { MapPin, User } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import { ADDRESS_TYPE_LABELS, type AddressType } from "../../domain";
import {
  applyClientAddressFormContext,
  clientAddressFormSchema,
  type ClientAddressFormContext,
  defaultClientAddressFormValues,
  defaultBillingAddressFormValues,
  type ClientAddressFormData,
} from "../validation/clientAddressSchema";
import { ADDRESS_TYPE_CONFIG } from "../config/clientConfig";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientAddressFormRef {
  triggerValidation: () => Promise<boolean>;
}

export interface ClientAddressFormProps {
  /** Contexto de uso del formulario: fiscal en alta o dirección adicional. */
  formContext?: ClientAddressFormContext;
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

/**
 * Omitir `defaultValues` en igualdad de props: igual que `ClientForm`, el wizard
 * pasa snapshots nuevos cada tecla sólo por referencia — RHF no rehidrata en caliente.
 */
function clientAddressOuterPropsAreEqual(
  prev: ClientAddressFormProps,
  next: ClientAddressFormProps,
): boolean {
  return (
    prev.formContext === next.formContext &&
    prev.hideLocationSectionTitle === next.hideLocationSectionTitle &&
    prev.disabled === next.disabled &&
    prev.clientRfc === next.clientRfc &&
    prev.clientName === next.clientName &&
    prev.onSubmit === next.onSubmit &&
    prev.onChange === next.onChange &&
    prev.className === next.className
  );
}

/** Firma por campos (evita `JSON.stringify` del snapshot completo en cada tecla). */
const CLIENT_ADDRESS_NOTIFY_KEYS = [
  "addressType",
  "isPrimary",
  "locationName",
  "street",
  "exteriorNumber",
  "interiorNumber",
  "reference",
  "postalCode",
  "satCountryCode",
  "satStateCode",
  "satMunicipalityCode",
  "satLocalityCode",
  "satNeighborhoodCode",
  "neighborhoodName",
  "latitude",
  "longitude",
  "rfcRemitenteDestinatario",
  "nombreRemitenteDestinatario",
  "contactName",
  "contactPhone",
  "contactEmail",
  "businessHours",
  "notes",
  "specialInstructions",
] as const satisfies readonly (keyof ClientAddressFormData)[];

function clientAddressValuesNotifyKey(
  v: ClientAddressFormData,
  isValid: boolean,
): string {
  let out = "";
  for (const k of CLIENT_ADDRESS_NOTIFY_KEYS) {
    const val = v[k];
    out += `${k}:${
      val === undefined || val === null ? "" : String(val)
    }\x1f`;
  }
  return `${out}|${String(isValid)}`;
}

function LocationAddressFields({
  mode,
  control,
  setValue,
  disabled,
}: {
  mode: "carta-porte" | "cfdi";
  control: Control<ClientAddressFormData>;
  setValue: UseFormSetValue<ClientAddressFormData>;
  disabled: boolean;
}) {
  return (
    <>
      <AddressInput<ClientAddressFormData>
        mode={mode}
        control={control}
        setValue={setValue}
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

const ClientAddressFormRoot = forwardRef<
  ClientAddressFormRef,
  ClientAddressFormProps
>(function ClientAddressForm(
  {
    formContext = "additional",
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
  const isBillingContext = formContext === "billingOnCreate";
  const copy = ADDRESS_FORM_COPY[formContext];
  const contextConfig = isBillingContext
    ? {
        forceAddressType: true,
        forcePrimary: true,
        showTypeSection: false,
        mode: "carta-porte" as const,
      }
    : {
        forceAddressType: false,
        forcePrimary: false,
        showTypeSection: true,
        mode: "carta-porte" as const,
      };

  const hasClientFiscalData = Boolean(clientRfc || clientName);
  const [useClientFiscalData, setUseClientFiscalData] = useState(
    hasClientFiscalData,
  );
  const hasInitializedFiscalModeRef = useRef(false);

  // Se usa un único schema para evitar incompatibilidades de tipos entre variantes.
  // Para dirección fiscal, se fuerzan valores en runtime.
  const defaults = isBillingContext
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
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const lastParentNotifyKey = useRef<string>("");

  useEffect(() => {
    if (!contextConfig.forceAddressType && !contextConfig.forcePrimary) return;

    if (contextConfig.forceAddressType) {
      setValue("addressType", "billing");
    }
    if (contextConfig.forcePrimary) {
      setValue("isPrimary", true);
    }
  }, [contextConfig.forceAddressType, contextConfig.forcePrimary, setValue]);

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

    queueMicrotask(() =>
      setUseClientFiscalData(!hasCurrentValues || matchesClientData),
    );
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
    const contextAwareValues = applyClientAddressFormContext(
      formValues as ClientAddressFormData,
      formContext,
    );
    const key = clientAddressValuesNotifyKey(
      contextAwareValues as ClientAddressFormData,
      isValid,
    );
    if (key === lastParentNotifyKey.current) return;
    lastParentNotifyKey.current = key;
    onChangeRef.current?.(contextAwareValues, isValid);
  }, [formContext, formValues, isValid]);

  // Submit handler
  const handleFormSubmit = (data: ClientAddressFormData) => {
    onSubmit?.(applyClientAddressFormContext(data, formContext));
  };

  const preAddressSections: EntityAddressFormSection[] = [];
  if (contextConfig.showTypeSection) {
    preAddressSections.push({
      id: "address-context-additional",
      title: "Contexto de direccion",
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
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
                      {(Object.keys(ADDRESS_TYPE_LABELS) as AddressType[]).map((type) => {
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
            <div className="space-y-2">
              <Label htmlFor="locationName">Nombre del Lugar</Label>
              <Input
                id="locationName"
                placeholder={copy.locationNamePlaceholder}
                disabled={disabled}
                {...register("locationName")}
              />
            </div>
          </div>
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
        </>
      ),
    });
  }
  if (isBillingContext) {
    preAddressSections.push({
      id: "address-context-billing",
      title: "Contexto de direccion",
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <div className="space-y-2">
          <Label htmlFor="locationName">Nombre del Lugar</Label>
          <Input
            id="locationName"
            placeholder={copy.locationNamePlaceholder}
            disabled={disabled}
            {...register("locationName")}
          />
        </div>
      ),
    });
  }

  const postAddressSections: EntityAddressFormSection[] = [
    {
      id: "geo-confirmation",
      title: "Confirmacion geografica",
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <AddressGeolocationPanel
          address={{
            locationName: formValues.locationName,
            street: formValues.street,
            exteriorNumber: formValues.exteriorNumber,
            interiorNumber: formValues.interiorNumber,
            postalCode: formValues.postalCode,
            satMunicipalityCode: formValues.satMunicipalityCode,
            satStateCode: formValues.satStateCode,
            satCountryCode: formValues.satCountryCode,
          }}
          latitude={formValues.latitude}
          longitude={formValues.longitude}
          onCoordinatesChange={(coords) => {
            setValue("latitude", coords.latitude, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setValue("longitude", coords.longitude, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          disabled={disabled}
        />
      ),
    },
    {
      id: "fiscal-operational",
      title: "Datos fiscales operativos",
      icon: <User className="h-4 w-4" />,
      content: (
        <>
          <p className="text-sm text-muted-foreground">{copy.cartaPorteDescription}</p>
          <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/30 p-3">
            <div className="space-y-1">
              <Label htmlFor="useClientFiscalData" className="cursor-pointer">
                Usar datos fiscales del cliente
              </Label>
              <p className="text-xs text-muted-foreground">{copy.fiscalDataDescription}</p>
            </div>
            <Switch
              id="useClientFiscalData"
              checked={useClientFiscalData}
              onCheckedChange={setUseClientFiscalData}
              disabled={disabled || !hasClientFiscalData}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rfcRemitenteDestinatario">RFC Remitente/Destinatario</Label>
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
              <p className="text-xs text-muted-foreground">{copy.fiscalRfcHint}</p>
            </div>
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
        </>
      ),
    },
    {
      id: "contact-operation",
      title: "Contacto en esta ubicación",
      icon: <User className="h-4 w-4" />,
      content: (
        <>
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
                <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>
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
              <Label htmlFor="specialInstructions">Instrucciones Especiales</Label>
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
        </>
      ),
    },
  ];

  return (
    <EntityAddressForm
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-6", className)}
      formContext={formContext}
      addressMode={contextConfig.mode}
      infoMessage={copy.globalInfoMessage}
      satStateCode={satStateCode}
      satMunicipalityCode={satMunicipalityCode}
      postalCode={postalCode}
      hasClientFiscalData={hasClientFiscalData}
      useClientFiscalData={useClientFiscalData}
      hideLocationSectionTitle={hideLocationSectionTitle}
      preAddressSections={preAddressSections}
      addressInputSection={
        <LocationAddressFields
          mode={contextConfig.mode}
          control={control}
          setValue={setValue}
          disabled={disabled}
        />
      }
      postAddressSections={postAddressSections}
    />
  );
});

export const ClientAddressForm = memo(
  ClientAddressFormRoot,
  clientAddressOuterPropsAreEqual,
) as typeof ClientAddressFormRoot;

export default ClientAddressForm;






