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
  useMemo,
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
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
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
  ADDRESS_FORM_COPY,
  buildGeocodingEntityFormSection,
  type EntityAddressFormSection,
} from "@shared/ui/address-input";
import { FileText, MapPin } from "lucide-react";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import { resolveAddressFormFieldRequirements } from "@shared/validation/addressFormProfileUx";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { FormValidationSummary } from "@shared/ui/form";

import {
  applyClientAddressFormContext,
  billingAddressFormSchema,
  additionalAddressFormSchema,
  CLIENT_ADDRESS_TYPES,
  type ClientAddressFormContext,
  defaultClientAddressFormValues,
  defaultBillingAddressFormValues,
  type ClientAddressFormData,
} from "../validation/clientAddressSchema";
import {
  ADDRESS_TYPE_CONFIG,
  CLIENT_ADDRESS_FISCAL_COPY,
} from "../config/clientConfig";

const fiscalCopy = CLIENT_ADDRESS_FISCAL_COPY;

// ============================================================================
// TYPES
// ============================================================================

export interface ClientAddressFormRef {
  triggerValidation: () => Promise<boolean>;
  /** Errores SAT (p. ej. estado/CP obligatorios XSD) en campos del formulario. */
  applySatFieldErrors: (fieldErrors: Record<string, string>) => void;
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
  "localityName",
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
  formContext,
  addressType,
  control,
  setValue,
  disabled,
}: {
  formContext: ClientAddressFormContext;
  addressType?: string;
  control: Control<ClientAddressFormData>;
  setValue: UseFormSetValue<ClientAddressFormData>;
  disabled: boolean;
}) {
  return (
    <>
      <AddressInput<ClientAddressFormData>
        variant="carta-porte"
        formContext={formContext}
        addressType={addressType}
        control={control}
        setValue={setValue}
        namePrefix=""
        layout="compact"
        showPrimaryToggle={false}
        hideInformativeAlerts
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
      }
    : {
        forceAddressType: false,
        forcePrimary: false,
        showTypeSection: true,
      };

  const [showValidationSummary, setShowValidationSummary] = useState(false);

  // Se usa un único schema para evitar incompatibilidades de tipos entre variantes.
  // Para dirección fiscal, se fuerzan valores en runtime.
  const defaults = isBillingContext
    ? defaultBillingAddressFormValues
    : defaultClientAddressFormValues;

  const addressFormSchema = isBillingContext
    ? billingAddressFormSchema
    : additionalAddressFormSchema;

  const form = useForm<ClientAddressFormData, unknown, ClientAddressFormData>({
    resolver: zodResolver(addressFormSchema) as Resolver<ClientAddressFormData>,
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
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isValid },
  } = form;

  const validationMessages = collectFieldErrorMessages(errors);
  const shouldShowValidationSummary = showValidationSummary && !isValid;

  const applySatFieldErrors = useCallback(
    (fieldErrors: Record<string, string>) => {
      const satKeys = Object.keys(fieldErrors).filter(Boolean);
      if (satKeys.length > 0) {
        clearErrors(satKeys as (keyof ClientAddressFormData)[]);
        for (const [key, message] of Object.entries(fieldErrors)) {
          if (!key || !message) continue;
          setError(key as keyof ClientAddressFormData, {
            type: "sat",
            message,
          });
        }
        setShowValidationSummary(true);
        const firstKey = satKeys[0];
        if (firstKey) {
          void setFocus(firstKey as keyof ClientAddressFormData);
        }
      }
    },
    [clearErrors, setError, setFocus],
  );

  useImperativeHandle(
    ref,
    () => ({
      triggerValidation: async () => {
        const ok = await trigger(undefined, { shouldFocus: true });
        if (!ok) setShowValidationSummary(true);
        else setShowValidationSummary(false);
        return ok;
      },
      applySatFieldErrors,
    }),
    [applySatFieldErrors, trigger],
  );

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

  const profileUx = useMemo(
    () =>
      resolveAddressFormFieldRequirements({
        formContext,
        addressType: formValues.addressType,
        variant: "carta-porte",
      }),
    [formContext, formValues.addressType],
  );

  // Pre-llenar remitente/destinatario desde el cliente si el formulario viene vacío.
  useEffect(() => {
    if (!clientRfc && !clientName) return;
    const currentRfc = (formValues.rfcRemitenteDestinatario ?? "").trim();
    const currentName = (formValues.nombreRemitenteDestinatario ?? "").trim();
    if (!currentRfc && clientRfc) {
      setValue("rfcRemitenteDestinatario", clientRfc.toUpperCase(), {
        shouldDirty: false,
      });
    }
    if (!currentName && clientName) {
      setValue("nombreRemitenteDestinatario", clientName, {
        shouldDirty: false,
      });
    }
  }, [
    clientName,
    clientRfc,
    formValues.nombreRemitenteDestinatario,
    formValues.rfcRemitenteDestinatario,
    setValue,
  ]);

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
      title: "Identificación del lugar",
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
                      {CLIENT_ADDRESS_TYPES.map((type) => {
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
              <Label htmlFor="locationName">
                Nombre del Lugar{" "}
                {profileUx.requireLocationName ? (
                  <span className="text-destructive">*</span>
                ) : null}
              </Label>
              <Input
                id="locationName"
                placeholder={copy.locationNamePlaceholder}
                disabled={disabled}
                error={Boolean(errors.locationName)}
                {...register("locationName")}
                {...getFieldErrorAriaProps(
                  "locationName",
                  errors.locationName?.message,
                )}
              />
              <FieldInlineError
                fieldId="locationName"
                message={errors.locationName?.message}
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
      title: "Identificación del lugar",
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <div className="space-y-2">
          <Label htmlFor="locationName">
            Nombre del Lugar <span className="text-destructive">*</span>
          </Label>
          <Input
            id="locationName"
            placeholder={copy.locationNamePlaceholder}
            disabled={disabled}
            error={Boolean(errors.locationName)}
            {...register("locationName")}
            {...getFieldErrorAriaProps(
              "locationName",
              errors.locationName?.message,
            )}
          />
          <FieldInlineError
            fieldId="locationName"
            message={errors.locationName?.message}
          />
        </div>
      ),
    });
  }

  const handleApplyClientFiscalData = useCallback(() => {
    if (clientRfc) {
      setValue("rfcRemitenteDestinatario", clientRfc.toUpperCase(), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (clientName) {
      setValue("nombreRemitenteDestinatario", clientName, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [clientName, clientRfc, setValue]);

  const fiscalOperativoSection: EntityAddressFormSection = {
    id: "client-address-fiscal-operativo",
    title: fiscalCopy.sectionTitle,
    icon: <FileText className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">{fiscalCopy.hint}</p>
        {clientRfc || clientName ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={handleApplyClientFiscalData}
          >
            {fiscalCopy.useClientData}
          </Button>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rfcRemitenteDestinatario">{fiscalCopy.rfcLabel}</Label>
            <Input
              id="rfcRemitenteDestinatario"
              placeholder={fiscalCopy.rfcPlaceholder}
              className="uppercase"
              maxLength={13}
              disabled={disabled}
              error={Boolean(errors.rfcRemitenteDestinatario)}
              {...register("rfcRemitenteDestinatario", {
                setValueAs: (value: string) =>
                  typeof value === "string" ? value.toUpperCase() : value,
              })}
              {...getFieldErrorAriaProps(
                "rfcRemitenteDestinatario",
                errors.rfcRemitenteDestinatario?.message,
              )}
            />
            <FieldInlineError
              fieldId="rfcRemitenteDestinatario"
              message={errors.rfcRemitenteDestinatario?.message}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="nombreRemitenteDestinatario">
              {fiscalCopy.nombreLabel}
            </Label>
            <Input
              id="nombreRemitenteDestinatario"
              placeholder={fiscalCopy.nombrePlaceholder}
              disabled={disabled}
              error={Boolean(errors.nombreRemitenteDestinatario)}
              {...register("nombreRemitenteDestinatario")}
              {...getFieldErrorAriaProps(
                "nombreRemitenteDestinatario",
                errors.nombreRemitenteDestinatario?.message,
              )}
            />
            <FieldInlineError
              fieldId="nombreRemitenteDestinatario"
              message={errors.nombreRemitenteDestinatario?.message}
            />
          </div>
        </div>
      </div>
    ),
  };

  const geocodingSection = buildGeocodingEntityFormSection({
    address: {
      locationName: formValues.locationName,
      street: formValues.street,
      exteriorNumber: formValues.exteriorNumber,
      interiorNumber: formValues.interiorNumber,
      postalCode: formValues.postalCode,
      satMunicipalityCode: formValues.satMunicipalityCode,
      satStateCode: formValues.satStateCode,
      satCountryCode: formValues.satCountryCode,
    },
    latitude: formValues.latitude,
    longitude: formValues.longitude,
    latitudeError: errors.latitude?.message,
    onCoordinatesChange: (coords) => {
      setValue("latitude", coords.latitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("longitude", coords.longitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    disabled,
  });

  const postAddressSections = [geocodingSection, fiscalOperativoSection];

  return (
    <EntityAddressForm
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-6", className)}
      formContext={formContext}
      addressVariant="carta-porte"
      addressType={formValues.addressType}
      infoMessage={copy.globalInfoMessage}
      satStateCode={satStateCode}
      satMunicipalityCode={satMunicipalityCode}
      postalCode={postalCode}
      hideLocationSectionTitle={hideLocationSectionTitle}
      locationSectionTitle="Domicilio"
      preAddressSections={preAddressSections}
      addressInputSection={
        <LocationAddressFields
          formContext={formContext}
          addressType={formValues.addressType}
          control={control}
          setValue={setValue}
          disabled={disabled}
        />
      }
      postAddressSections={postAddressSections}
    >
      {shouldShowValidationSummary ? (
        <FormValidationSummary
          messages={validationMessages}
          title={
            isBillingContext ? "Revisa la dirección fiscal" : "Revisa la dirección"
          }
        />
      ) : null}
    </EntityAddressForm>
  );
});

export const ClientAddressForm = memo(
  ClientAddressFormRoot,
  clientAddressOuterPropsAreEqual,
) as typeof ClientAddressFormRoot;

export default ClientAddressForm;






