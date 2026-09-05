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
  type UseFormTrigger,
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
  AddressGeocodingSectionContent,
  AddressGeocodingSectionTitle,
  setFormCoordinates,
  type EntityAddressFormSection,
} from "@shared/ui/address-input";
import {
  LocationField,
  LOCATION_FIELD_COPY,
  emptySatAddressFields,
  locationValueFromSatAddressFields,
  locationValueToSatAddressFields,
  type LocationValue,
} from "@shared/ui/location";
import type { DuplicateCandidate } from "@shared/location/detectPossibleDuplicates";
import type { SearchableOwnerType } from "@shared/ui/address-picker/types";
import { FileText, MapPin, StickyNote, User } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Textarea } from "@shared/ui/text-area";
import { cn } from "@shared/lib/utils/cn";
import { resolveAddressFormFieldRequirements } from "@shared/validation/addressFormProfileUx";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { FormValidationSummary } from "@shared/ui/form";

import { useClientAddresses } from "../../application/hooks/useClientAddresses";
import type { ClientAddressListItem } from "../../domain";
import {
  applyClientAddressFormContext,
  billingAddressFormSchema,
  additionalAddressFormSchema,
  CLIENT_ADDRESS_TYPES,
  type ClientAddressFormContext,
  defaultClientAddressFormValues,
  defaultBillingAddressFormValues,
  type ClientAddressFormData,
  type ClientAddressTypeValue,
} from "../validation/clientAddressSchema";
import {
  ADDRESS_TYPE_CONFIG,
  CLIENT_ADDRESS_FISCAL_COPY,
} from "../config/clientConfig";
import { showsClientUbicacionFields } from "../config/clientAddressPurpose";
import { resolveClientCreateApiField } from "../helpers/applyClientApiFieldErrors";
import { clientDetailCopy } from "../copy/clientDetailCopy";

const locationCopy = clientDetailCopy.address;

const fiscalCopy = CLIENT_ADDRESS_FISCAL_COPY;

// ============================================================================
// TYPES
// ============================================================================

export interface ClientAddressFormRef {
  triggerValidation: () => Promise<boolean>;
  /** Valores actuales de RHF (con contexto fiscal/adicional aplicado). */
  getValues: () => ClientAddressFormData;
  /** Errores SAT (p. ej. estado/CP obligatorios XSD) en campos del formulario. */
  applySatFieldErrors: (fieldErrors: Record<string, string>) => void;
  /** Errores de validación API mapeados a campos del domicilio. */
  applyApiValidationErrors: (
    entries: ReadonlyArray<{ field: string; message: string }>,
  ) => string[];
  clearApiFieldErrors: () => void;
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
  /** Prioriza hits internos del cliente en LocationField (ADR-0092). */
  clientId?: string | null;
  /** Al editar, excluye esta id del warning anti-duplicados (D-F). */
  excludeAddressId?: string | null;
  /** Callback cuando se envía el formulario */
  onSubmit?: (data: ClientAddressFormData) => void;
  /** Callback cuando cambian los datos */
  onChange?: (data: ClientAddressFormData, isValid: boolean) => void;
  /** Deshabilitar edición */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /** Restringe tipos en el select (p. ej. directorio del tenant). */
  addressTypeOptions?: readonly ClientAddressTypeValue[];
  /** Oculta el switch de dirección principal (directorio del tenant). */
  hidePrimarySwitch?: boolean;
  /** Sustituye el aviso informativo del formulario. */
  infoMessage?: string;
  /** Restrict LocationField internal search (ADR-0092 F5 directory). */
  locationOwnerTypes?: SearchableOwnerType[];
  locationSearchLabel?: string;
  locationSearchPlaceholder?: string;
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
    prev.clientId === next.clientId &&
    prev.excludeAddressId === next.excludeAddressId &&
    prev.onSubmit === next.onSubmit &&
    prev.onChange === next.onChange &&
    prev.className === next.className &&
    prev.hidePrimarySwitch === next.hidePrimarySwitch &&
    prev.infoMessage === next.infoMessage &&
    prev.locationSearchLabel === next.locationSearchLabel &&
    prev.locationSearchPlaceholder === next.locationSearchPlaceholder &&
    prev.locationOwnerTypes === next.locationOwnerTypes
  );
}

const SAT_ADDRESS_FIELD_KEYS = [
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
] as const satisfies readonly (keyof ClientAddressFormData)[];

function applySatSliceToClientForm(
  setValue: UseFormSetValue<ClientAddressFormData>,
  trigger: UseFormTrigger<ClientAddressFormData>,
  slice: ReturnType<typeof locationValueToSatAddressFields>,
) {
  for (const key of SAT_ADDRESS_FIELD_KEYS) {
    if (key === "latitude" || key === "longitude") continue;
    setValue(key, slice[key], { shouldDirty: true, shouldValidate: true });
  }
  void setFormCoordinates(setValue, trigger, {
    latitude: slice.latitude,
    longitude: slice.longitude,
  });
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

function mapClientAddressToDuplicateCandidate(
  item: ClientAddressListItem,
): DuplicateCandidate {
  return {
    id: item.id,
    postalCode: item.postalCode ?? null,
    street: item.address ?? null,
    exteriorNumber: null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
  };
}

function LocationAddressFields({
  formContext,
  addressType,
  control,
  setValue,
  disabled,
  clientId,
  excludeAddressId,
  locationValue,
  onLocationChange,
  locationOwnerTypes,
  locationSearchLabel,
  locationSearchPlaceholder,
}: {
  formContext: ClientAddressFormContext;
  addressType?: string;
  control: Control<ClientAddressFormData>;
  setValue: UseFormSetValue<ClientAddressFormData>;
  disabled: boolean;
  clientId?: string | null;
  excludeAddressId?: string | null;
  locationValue: LocationValue | null;
  onLocationChange: (value: LocationValue | null) => void;
  locationOwnerTypes?: SearchableOwnerType[];
  locationSearchLabel?: string;
  locationSearchPlaceholder?: string;
}) {
  const locationContext =
    formContext === "billingOnCreate" ? "fiscal" : "operational";
  const resolvedOwnerTypes =
    locationOwnerTypes ??
    (formContext === "billingOnCreate"
      ? (["tenant"] as SearchableOwnerType[])
      : clientId
        ? (["client", "tenant"] as SearchableOwnerType[])
        : (["tenant"] as SearchableOwnerType[]));

  const { data: siblingAddresses } = useClientAddresses(
    clientId ?? undefined,
  );

  const existingAddresses = useMemo(() => {
    if (!siblingAddresses?.length) return undefined;
    const exclude = excludeAddressId?.trim() || null;
    return siblingAddresses
      .filter((item) => !exclude || item.id !== exclude)
      .map(mapClientAddressToDuplicateCandidate);
  }, [siblingAddresses, excludeAddressId]);

  return (
    <div className="space-y-4">
      <LocationField
        context={locationContext}
        value={locationValue}
        onChange={onLocationChange}
        label={locationSearchLabel ?? locationCopy.locationSearchLabel}
        placeholder={
          locationSearchPlaceholder ?? locationCopy.locationSearchPlaceholder
        }
        disabled={disabled}
        clientId={clientId}
        ownerTypes={resolvedOwnerTypes}
        includeInternal={false}
        existingAddresses={existingAddresses}
        showCartaPorteStatus={formContext === "billingOnCreate"}
      />
      <div className="space-y-3 border-t border-border pt-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {LOCATION_FIELD_COPY.satDetailTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {LOCATION_FIELD_COPY.satDetailHint}
          </p>
        </div>
        <AddressInput<ClientAddressFormData>
          variant="carta-porte"
          formContext={formContext}
          addressType={addressType}
          control={control}
          setValue={setValue}
          namePrefix=""
          layout="compact"
          showLatLng={false}
          showPrimaryToggle={false}
          hideInformativeAlerts
          disabled={disabled}
        />
      </div>
    </div>
  );
}

const MemoLocationAddressFields = memo(LocationAddressFields);

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
    clientId = null,
    excludeAddressId = null,
    onSubmit,
    onChange,
    disabled = false,
    className,
    addressTypeOptions,
    hidePrimarySwitch = false,
    infoMessage,
    locationOwnerTypes,
    locationSearchLabel,
    locationSearchPlaceholder,
  },
  ref,
) {
  const typeOptions = addressTypeOptions ?? CLIENT_ADDRESS_TYPES;
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
    getValues,
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

  const applyApiValidationErrors = useCallback(
    (entries: ReadonlyArray<{ field: string; message: string }>) => {
      const unmapped: string[] = [];
      let firstField: keyof ClientAddressFormData | null = null;
      for (const entry of entries) {
        const target = resolveClientCreateApiField(entry.field);
        if (target?.form === "address") {
          setError(target.field, {
            type: "server",
            message: entry.message,
          });
          if (!firstField) firstField = target.field;
        } else if (entry.message.trim()) {
          unmapped.push(entry.message.trim());
        }
      }
      if (firstField) {
        setShowValidationSummary(true);
        void setFocus(firstField);
      }
      return unmapped;
    },
    [setError, setFocus],
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
      getValues: () =>
        applyClientAddressFormContext(getValues(), formContext),
      applySatFieldErrors,
      applyApiValidationErrors,
      clearApiFieldErrors: () => {
        clearErrors();
      },
    }),
    [
      applyApiValidationErrors,
      applySatFieldErrors,
      clearErrors,
      formContext,
      getValues,
      trigger,
    ],
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
    if (isBillingContext) return;
    if (!showsClientUbicacionFields(formValues.addressType)) return;
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
    formValues.addressType,
    formValues.nombreRemitenteDestinatario,
    formValues.rfcRemitenteDestinatario,
    isBillingContext,
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
                      {typeOptions.map((type) => {
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
          {hidePrimarySwitch ? null : (
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
          )}
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

  const locationFieldValue = useMemo(() => {
    const localityCode = (formValues.satLocalityCode ?? "").trim();
    const neighborhoodCode = (formValues.satNeighborhoodCode ?? "").trim();
    // Free-text names without SAT code stay in RHF for submit; omit from LocationField
    // so typing colonia/localidad manual does not rebuild the Location card every keystroke.
    return locationValueFromSatAddressFields({
      locationName: formValues.locationName,
      street: formValues.street,
      exteriorNumber: formValues.exteriorNumber,
      interiorNumber: formValues.interiorNumber,
      reference: formValues.reference,
      postalCode: formValues.postalCode,
      satCountryCode: formValues.satCountryCode,
      satStateCode: formValues.satStateCode,
      satMunicipalityCode: formValues.satMunicipalityCode,
      satLocalityCode: formValues.satLocalityCode,
      localityName: localityCode ? formValues.localityName : null,
      satNeighborhoodCode: formValues.satNeighborhoodCode,
      neighborhoodName: neighborhoodCode ? formValues.neighborhoodName : null,
      latitude: formValues.latitude,
      longitude: formValues.longitude,
    });
  }, [
    formValues.exteriorNumber,
    formValues.interiorNumber,
    formValues.latitude,
    formValues.locationName,
    formValues.longitude,
    formValues.postalCode,
    formValues.reference,
    formValues.satCountryCode,
    formValues.satLocalityCode,
    formValues.satMunicipalityCode,
    formValues.satNeighborhoodCode,
    formValues.satStateCode,
    formValues.street,
    // Names only invalidate LocationField when a SAT code is selected.
    formValues.satLocalityCode?.trim()
      ? formValues.localityName
      : null,
    formValues.satNeighborhoodCode?.trim()
      ? formValues.neighborhoodName
      : null,
  ]);

  const handleLocationChange = useCallback(
    (value: LocationValue | null) => {
      if (!value) {
        applySatSliceToClientForm(setValue, trigger, emptySatAddressFields());
        return;
      }
      applySatSliceToClientForm(
        setValue,
        trigger,
        locationValueToSatAddressFields(value),
      );
      const rfc = value.remitenteRfc?.trim() || value.destinatarioRfc?.trim();
      const partyName =
        value.remitenteName?.trim() || value.destinatarioName?.trim();
      if (rfc) {
        setValue("rfcRemitenteDestinatario", rfc.toUpperCase(), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      if (partyName) {
        setValue("nombreRemitenteDestinatario", partyName, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [setValue, trigger],
  );

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

  const showUbicacionFields =
    !isBillingContext && showsClientUbicacionFields(formValues.addressType);

  const contactSection: EntityAddressFormSection = {
    id: "client-address-contact",
    title: locationCopy.contactSectionTitle,
    icon: <User className="h-4 w-4" />,
    content: (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="contactName">{locationCopy.contactName}</Label>
          <Input
            id="contactName"
            disabled={disabled}
            error={Boolean(errors.contactName)}
            {...register("contactName")}
            {...getFieldErrorAriaProps(
              "contactName",
              errors.contactName?.message,
            )}
          />
          <FieldInlineError
            fieldId="contactName"
            message={errors.contactName?.message}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">{locationCopy.contactPhone}</Label>
          <Input
            id="contactPhone"
            disabled={disabled}
            error={Boolean(errors.contactPhone)}
            {...register("contactPhone")}
            {...getFieldErrorAriaProps(
              "contactPhone",
              errors.contactPhone?.message,
            )}
          />
          <FieldInlineError
            fieldId="contactPhone"
            message={errors.contactPhone?.message}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">{locationCopy.contactEmail}</Label>
          <Input
            id="contactEmail"
            type="email"
            disabled={disabled}
            error={Boolean(errors.contactEmail)}
            {...register("contactEmail")}
            {...getFieldErrorAriaProps(
              "contactEmail",
              errors.contactEmail?.message,
            )}
          />
          <FieldInlineError
            fieldId="contactEmail"
            message={errors.contactEmail?.message}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="businessHours">{locationCopy.businessHours}</Label>
          <Input
            id="businessHours"
            disabled={disabled}
            error={Boolean(errors.businessHours)}
            {...register("businessHours")}
            {...getFieldErrorAriaProps(
              "businessHours",
              errors.businessHours?.message,
            )}
          />
          <FieldInlineError
            fieldId="businessHours"
            message={errors.businessHours?.message}
          />
        </div>
      </div>
    ),
  };

  const notesSection: EntityAddressFormSection = {
    id: "client-address-notes",
    title: locationCopy.notesSectionTitle,
    icon: <StickyNote className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="specialInstructions">
            {locationCopy.specialInstructions}
          </Label>
          <Textarea
            id="specialInstructions"
            rows={3}
            disabled={disabled}
            error={Boolean(errors.specialInstructions)}
            {...register("specialInstructions")}
            {...getFieldErrorAriaProps(
              "specialInstructions",
              errors.specialInstructions?.message,
            )}
          />
          <FieldInlineError
            fieldId="specialInstructions"
            message={errors.specialInstructions?.message}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">{locationCopy.notes}</Label>
          <Textarea
            id="notes"
            rows={3}
            disabled={disabled}
            error={Boolean(errors.notes)}
            {...register("notes")}
            {...getFieldErrorAriaProps("notes", errors.notes?.message)}
          />
          <FieldInlineError fieldId="notes" message={errors.notes?.message} />
        </div>
      </div>
    ),
  };

  const postAddressSections: EntityAddressFormSection[] = [];
  if (showUbicacionFields) {
    postAddressSections.push(fiscalOperativoSection);
  }
  if (!isBillingContext) {
    postAddressSections.push(contactSection, notesSection);
  }

  const clientGeoInlineExtras = showUbicacionFields ? (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">
          <AddressGeocodingSectionTitle />
        </p>
      </div>
      <AddressGeocodingSectionContent
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
        latitudeError={errors.latitude?.message}
        onCoordinatesChange={(coords) => {
          void setFormCoordinates(setValue, trigger, coords);
        }}
        disabled={disabled}
      />
    </div>
  ) : undefined;

  return (
    <EntityAddressForm
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn("space-y-6", className)}
      formContext={formContext}
      addressVariant="carta-porte"
      addressType={formValues.addressType}
      infoMessage={infoMessage ?? copy.globalInfoMessage}
      satStateCode={satStateCode}
      satMunicipalityCode={satMunicipalityCode}
      postalCode={postalCode}
      hideLocationSectionTitle={hideLocationSectionTitle}
      locationSectionTitle="Domicilio"
      preAddressSections={preAddressSections}
      addressInputSection={
        <MemoLocationAddressFields
          formContext={formContext}
          addressType={formValues.addressType}
          control={control}
          setValue={setValue}
          disabled={disabled}
          clientId={clientId}
          excludeAddressId={excludeAddressId}
          locationValue={locationFieldValue}
          onLocationChange={handleLocationChange}
          locationOwnerTypes={locationOwnerTypes}
          locationSearchLabel={locationSearchLabel}
          locationSearchPlaceholder={locationSearchPlaceholder}
        />
      }
      addressInlineExtras={clientGeoInlineExtras}
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






