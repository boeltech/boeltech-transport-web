import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useController,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
} from "react-hook-form";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Checkbox } from "@shared/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@shared/ui/collapsible";
import type {
  AddressInputProps,
  AddressInputLayout,
  SavedAddressOption,
} from "./AddressInput.types";
import { addressInputContainerClass } from "./addressInputContainer";
import { usePostalCodeLookup } from "./use-postal-code-lookup";
import { useSatCatalogs } from "./use-sat-catalogs";
import { AddressPreview } from "./AddressPreview";
import {
  getCp31DomicilioUxRequirements,
  isCp31DomicilioReady,
  type PostalLookupStatus,
} from "@shared/validation/addressRequirements";
import { resolveAddressFormFieldRequirements } from "@shared/validation/addressFormProfileUx";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";

const LAYOUT_CLASS: Record<AddressInputLayout, string> = {
  "single-column": "grid-cols-1",
  "two-column": "grid-cols-1 sm:grid-cols-2",
  compact: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

function getFieldPath(prefix: string, field: string): string {
  if (!prefix) return field;
  return `${prefix}.${field}`;
}

function toShortSatCode(value: string): string {
  if (!value.includes("-")) return value;
  const parts = value.split("-").filter(Boolean);
  return parts[parts.length - 1] ?? value;
}

function resolveMunicipalityCatalogCode(
  rawValue: string,
  municipalities: Array<{ code: string }>,
): string {
  const normalized = rawValue.trim();
  if (!normalized) return "";

  const exact = municipalities.find(
    (municipality) => municipality.code.toUpperCase() === normalized.toUpperCase(),
  );
  if (exact) return exact.code;

  const shortCode = toShortSatCode(normalized);
  const fromShort = municipalities.find(
    (municipality) => toShortSatCode(municipality.code) === shortCode,
  );
  return fromShort?.code ?? normalized;
}

function resolveCatalogCodeByShort(
  rawValue: string,
  options: Array<{ code: string }>,
): string {
  const normalized = rawValue.trim();
  if (!normalized) return "";

  const exact = options.find(
    (option) => option.code.toUpperCase() === normalized.toUpperCase(),
  );
  if (exact) return exact.code;

  const shortCode = toShortSatCode(normalized);
  const fromShort = options.find(
    (option) => toShortSatCode(option.code) === shortCode,
  );
  return fromShort?.code ?? normalized;
}

function useAddressField<TFieldValues extends FieldValues>(
  props: AddressInputProps<TFieldValues>,
  fieldName: string,
) {
  const controller = useController({
    control: props.control,
    name: getFieldPath(props.namePrefix, fieldName) as Path<TFieldValues>,
  });

  return controller;
}

const APPLY_SAVED_OPTS = {
  shouldValidate: true,
  shouldDirty: true,
  shouldTouch: true,
} as const;

function applySavedAddressWithSetValue<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  prefix: string,
  sel: SavedAddressOption,
): void {
  const p = (field: string) => getFieldPath(prefix, field) as Path<T>;

  setValue(p("street"), sel.street as never, APPLY_SAVED_OPTS);
  setValue(p("exteriorNumber"), sel.exteriorNumber as never, APPLY_SAVED_OPTS);
  setValue(p("interiorNumber"), (sel.interiorNumber ?? "") as never, APPLY_SAVED_OPTS);
  setValue(p("reference"), (sel.reference ?? "") as never, APPLY_SAVED_OPTS);
  setValue(p("postalCode"), sel.postalCode as never, APPLY_SAVED_OPTS);
  setValue(p("satCountryCode"), sel.satCountryCode as never, APPLY_SAVED_OPTS);
  setValue(p("satStateCode"), sel.satStateCode as never, APPLY_SAVED_OPTS);
  setValue(
    p("satMunicipalityCode"),
    toShortSatCode(String(sel.satMunicipalityCode ?? "")) as never,
    APPLY_SAVED_OPTS,
  );
  setValue(
    p("satLocalityCode"),
    toShortSatCode(String(sel.satLocalityCode ?? "")) as never,
    APPLY_SAVED_OPTS,
  );
  setValue(p("localityName"), (sel.localityName ?? "") as never, APPLY_SAVED_OPTS);
  setValue(
    p("satNeighborhoodCode"),
    toShortSatCode(String(sel.satNeighborhoodCode ?? "")) as never,
    APPLY_SAVED_OPTS,
  );
  setValue(p("neighborhoodName"), (sel.neighborhoodName ?? "") as never, APPLY_SAVED_OPTS);

  setValue(
    p("latitude"),
    (sel.latitude == null ? null : Number(sel.latitude)) as never,
    APPLY_SAVED_OPTS,
  );
  setValue(
    p("longitude"),
    (sel.longitude == null ? null : Number(sel.longitude)) as never,
    APPLY_SAVED_OPTS,
  );
  setValue(p("isPrimary"), Boolean(sel.isPrimary) as never, APPLY_SAVED_OPTS);
}

interface AddressSavedChooserProps<T extends FieldValues> {
  control: Control<T>;
  namePrefix: string;
  savedAddresses: SavedAddressOption[];
  onSelectSaved?: (address: SavedAddressOption) => void;
  disabled: boolean;
  setValue?: UseFormSetValue<T>;
}

/**
 * Observa sólo CP + calle fuera del bloque postal para que al escribir en calle no
 * re-renderice Selects/catálogo SAT ni queries derivadas del CP en el mismo árbol.
 */
function AddressSavedAddressesBlock<T extends FieldValues>({
  control,
  namePrefix,
  savedAddresses,
  onSelectSaved,
  disabled,
  setValue,
}: AddressSavedChooserProps<T>) {
  const postalPath = getFieldPath(namePrefix, "postalCode") as Path<T>;
  const streetPath = getFieldPath(namePrefix, "street") as Path<T>;
  const postalValue = useWatch({ control, name: postalPath });
  const streetValue = useWatch({ control, name: streetPath });

  const selectedSavedAddress = useMemo(
    () => {
      if (savedAddresses.length === 0 || !setValue) return null;
      return (
      savedAddresses.find(
        (item) =>
          item.postalCode === String(postalValue ?? "") &&
          item.street === String(streetValue ?? ""),
      ) ?? null
      );
    },
    [savedAddresses, postalValue, setValue, streetValue],
  );

  const handleSavedAddressSelection = useCallback(
    (savedAddressId: string) => {
      if (!setValue) return;
      const selected = savedAddresses.find((item) => item.id === savedAddressId);
      if (!selected) return;
      applySavedAddressWithSetValue(setValue, namePrefix, selected);
      onSelectSaved?.(selected);
    },
    [namePrefix, onSelectSaved, savedAddresses, setValue],
  );

  if (savedAddresses.length === 0 || !setValue) return null;

  return (
    <div className="space-y-2">
      <Label>Dirección guardada</Label>
      <Select
        value={selectedSavedAddress?.id ?? ""}
        onValueChange={handleSavedAddressSelection}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una dirección guardada" />
        </SelectTrigger>
        <SelectContent>
          {savedAddresses.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedSavedAddress ? (
        <AddressPreview address={selectedSavedAddress} />
      ) : null}
    </div>
  );
}

interface AddressStreetFieldsProps<T extends FieldValues> {
  control: Control<T>;
  namePrefix: string;
  disabled: boolean;
  /** Sobreescribe `disabled` solo para inputs lat/lng (ver `AddressInputProps.disableCoordinates`). */
  disableCoordinates?: boolean;
  showLatLng: boolean;
  /** En `carta-porte` (CP31 mínimo) calle y número exterior son opcionales en paquete/UX. */
  requireStreetFields: boolean;
  /** En contextos operativos donde lat/lng son obligatorias (p. ej. `trip_stop` para
   * cálculo de distancias y trazabilidad). SoT: `matriz-reglas-cp31-por-capas.md`
   * y `@boeltech/cfdi-domain/validadores/address-form-profiles`. */
  requireCoordinates: boolean;
}

/** Campos domicilio: aislados del bloque postal para reducir coste por tecla en calle. */
function AddressInputStreetFieldsInner<T extends FieldValues>({
  control,
  namePrefix,
  disabled,
  disableCoordinates,
  showLatLng,
  requireStreetFields,
  requireCoordinates,
}: AddressStreetFieldsProps<T>) {
  const coordinatesDisabled = disableCoordinates ?? disabled;
  const streetField = useController({
    control,
    name: getFieldPath(namePrefix, "street") as Path<T>,
  });
  const exteriorField = useController({
    control,
    name: getFieldPath(namePrefix, "exteriorNumber") as Path<T>,
  });
  const interiorField = useController({
    control,
    name: getFieldPath(namePrefix, "interiorNumber") as Path<T>,
  });
  const referenceField = useController({
    control,
    name: getFieldPath(namePrefix, "reference") as Path<T>,
  });
  const latitudeField = useController({
    control,
    name: getFieldPath(namePrefix, "latitude") as Path<T>,
  });
  const longitudeField = useController({
    control,
    name: getFieldPath(namePrefix, "longitude") as Path<T>,
  });
  return (
    <div className="contents">
      <div className="space-y-2 sm:col-span-2 lg:col-span-2">
        <Label htmlFor={`${namePrefix}-street`}>
          Calle {requireStreetFields ? "*" : ""}
        </Label>
        <Input
          id={`${namePrefix}-street`}
          value={String(streetField.field.value ?? "")}
          onChange={(event) => streetField.field.onChange(event.target.value)}
          disabled={disabled}
          error={Boolean(streetField.fieldState.error)}
          {...getFieldErrorAriaProps(
            `${namePrefix}-street`,
            streetField.fieldState.error?.message,
          )}
        />
        <FieldInlineError
          fieldId={`${namePrefix}-street`}
          message={streetField.fieldState.error?.message}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${namePrefix}-ext-number`}>
          Número exterior {requireStreetFields ? "*" : ""}
        </Label>
        <Input
          id={`${namePrefix}-ext-number`}
          value={String(exteriorField.field.value ?? "")}
          onChange={(event) => exteriorField.field.onChange(event.target.value)}
          disabled={disabled}
          error={Boolean(exteriorField.fieldState.error)}
          {...getFieldErrorAriaProps(
            `${namePrefix}-ext-number`,
            exteriorField.fieldState.error?.message,
          )}
        />
        <FieldInlineError
          fieldId={`${namePrefix}-ext-number`}
          message={exteriorField.fieldState.error?.message}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${namePrefix}-int-number`}>Número interior</Label>
        <Input
          id={`${namePrefix}-int-number`}
          value={String(interiorField.field.value ?? "")}
          onChange={(event) => interiorField.field.onChange(event.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor={`${namePrefix}-reference`}>Referencia</Label>
        <Input
          id={`${namePrefix}-reference`}
          value={String(referenceField.field.value ?? "")}
          onChange={(event) => referenceField.field.onChange(event.target.value)}
          disabled={disabled}
        />
      </div>

      {showLatLng ? (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${namePrefix}-latitude`}>
              Latitud{" "}
              {requireCoordinates ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="font-normal text-muted-foreground">(opcional)</span>
              )}
            </Label>
            <Input
              id={`${namePrefix}-latitude`}
              type="number"
              step="any"
              min={-90}
              max={90}
              value={String(latitudeField.field.value ?? "")}
              onChange={(event) => {
                const value = event.target.value.trim();
                if (value === "") {
                  latitudeField.field.onChange(null);
                  return;
                }

                const parsed = Number(value);
                if (!Number.isNaN(parsed)) {
                  latitudeField.field.onChange(parsed);
                }
              }}
              disabled={coordinatesDisabled}
              inputMode="decimal"
              error={Boolean(latitudeField.fieldState.error)}
              {...getFieldErrorAriaProps(
                `${namePrefix}-latitude`,
                latitudeField.fieldState.error?.message,
              )}
            />
            <FieldInlineError
              fieldId={`${namePrefix}-latitude`}
              message={latitudeField.fieldState.error?.message}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${namePrefix}-longitude`}>
              Longitud{" "}
              {requireCoordinates ? (
                <span className="text-destructive">*</span>
              ) : (
                <span className="font-normal text-muted-foreground">(opcional)</span>
              )}
            </Label>
            <Input
              id={`${namePrefix}-longitude`}
              type="number"
              step="any"
              min={-180}
              max={180}
              value={String(longitudeField.field.value ?? "")}
              onChange={(event) => {
                const value = event.target.value.trim();
                if (value === "") {
                  longitudeField.field.onChange(null);
                  return;
                }

                const parsed = Number(value);
                if (!Number.isNaN(parsed)) {
                  longitudeField.field.onChange(parsed);
                }
              }}
              disabled={coordinatesDisabled}
              inputMode="decimal"
              error={Boolean(longitudeField.fieldState.error)}
              {...getFieldErrorAriaProps(
                `${namePrefix}-longitude`,
                longitudeField.fieldState.error?.message,
              )}
            />
            <FieldInlineError
              fieldId={`${namePrefix}-longitude`}
              message={longitudeField.fieldState.error?.message}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

const MemoAddressStreetFields = memo(
  AddressInputStreetFieldsInner,
) as typeof AddressInputStreetFieldsInner;

function AddressInputRoot<TFieldValues extends FieldValues = FieldValues>(
  props: AddressInputProps<TFieldValues>,
) {
  const {
    variant: variantProp,
    formContext,
    addressType: addressTypeProp,
    savedAddresses = [],
    onSelectSaved,
    layout = "compact",
    collapsible = false,
    defaultExpanded = true,
    showLatLng = true,
    showPrimaryToggle = false,
    autoFocusFirstField = false,
    onCartaPorteReadyChange,
    extraSlots,
    disabled = false,
    disableCoordinates,
    hideInformativeAlerts = false,
    embedded = false,
    control,
    namePrefix,
    setValue,
  } = props;

  const variant = variantProp ?? "carta-porte";

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const lastAppliedPostalCodeRef = useRef<string>("");

  const postalCodeField = useAddressField(props, "postalCode");
  const countryField = useAddressField(props, "satCountryCode");
  const stateField = useAddressField(props, "satStateCode");
  const municipalityField = useAddressField(props, "satMunicipalityCode");
  const localityField = useAddressField(props, "satLocalityCode");
  const localityNameField = useAddressField(props, "localityName");
  const neighborhoodField = useAddressField(props, "satNeighborhoodCode");
  const neighborhoodNameField = useAddressField(props, "neighborhoodName");
  const isPrimaryField = useAddressField(props, "isPrimary");

  const addressTypePath = getFieldPath(namePrefix, "addressType") as Path<TFieldValues>;
  const watchedAddressType = useWatch({
    control,
    name: addressTypePath,
    disabled: addressTypeProp !== undefined,
  });
  const resolvedAddressType =
    addressTypeProp ?? (watchedAddressType != null ? String(watchedAddressType) : undefined);

  const profileUx = useMemo(
    () =>
      resolveAddressFormFieldRequirements({
        formContext,
        addressType: resolvedAddressType,
        variant,
      }),
    [formContext, variant, resolvedAddressType],
  );

  const postalLookup = usePostalCodeLookup(String(postalCodeField.field.value ?? ""));
  const {
    countries,
    states,
    municipalities,
    neighborhoodsByPostalCode,
    isLoadingMunicipalities,
    isLoadingNeighborhoodsByPostalCode,
  } = useSatCatalogs(
    String(stateField.field.value ?? ""),
    String(postalCodeField.field.value ?? ""),
  );

  const hasPostalLookupData = Boolean(postalLookup.data);
  const postalLookupFound = postalLookup.data?.found ?? true;
  const postalLookupStatus: PostalLookupStatus = useMemo(() => {
    const cp = String(postalCodeField.field.value ?? "").trim();
    const isCpReady = /^\d{5}$/.test(cp);
    if (!isCpReady) return "idle";
    if (postalLookup.isLoading) return "loading";
    if (postalLookup.isError) return "error";
    if (!postalLookup.data) return "idle";
    return postalLookup.data.found ? "success" : "not_found";
  }, [
    postalCodeField.field.value,
    postalLookup.data,
    postalLookup.isError,
    postalLookup.isLoading,
  ]);
  const requiredByMode = useMemo(
    () => getCp31DomicilioUxRequirements(variant),
    [variant],
  );
  const requireStreetFields = profileUx.requireStreetFields;
  const requiredMark = (required: boolean) => (required ? " *" : "");
  const catalogNeighborhoodOptions = useMemo(
    () =>
      (postalLookup.data?.neighborhoods.length ?? 0) > 0
        ? postalLookup.data?.neighborhoods ?? []
        : neighborhoodsByPostalCode.map((item) => ({
            code: item.code,
            name: item.name,
          })),
    [postalLookup.data?.neighborhoods, neighborhoodsByPostalCode],
  );
  const lookupHasNeighborhoods = catalogNeighborhoodOptions.length > 0;
  const hasPersistedNeighborhoodName = Boolean(
    String(neighborhoodNameField.field.value ?? "").trim(),
  );
  const hasPersistedNeighborhoodCode = Boolean(
    String(neighborhoodField.field.value ?? "").trim(),
  );
  const lookupHasLocalities = (postalLookup.data?.localities.length ?? 0) > 0;
  const hasMultipleNeighborhoods =
    catalogNeighborhoodOptions.length > 1;
  const hasMultipleLocalities = (postalLookup.data?.localities.length ?? 0) > 1;

  const addressReadyForMode = useMemo(
    () =>
      isCp31DomicilioReady({
        variant,
        satCountryCode: String(countryField.field.value ?? ""),
        satStateCode: String(stateField.field.value ?? ""),
        satMunicipalityCode: String(municipalityField.field.value ?? ""),
        satLocalityCode: String(localityField.field.value ?? ""),
        satNeighborhoodCode: String(neighborhoodField.field.value ?? ""),
        postalCode: String(postalCodeField.field.value ?? ""),
        postalLookupStatus,
      }),
    [
      countryField.field.value,
      localityField.field.value,
      variant,
      municipalityField.field.value,
      neighborhoodField.field.value,
      postalCodeField.field.value,
      postalLookupStatus,
      stateField.field.value,
    ],
  );

  const municipalityRawForDisplay = String(
    municipalityField.field.value ?? "",
  ).trim();
  const localityRawForDisplay = String(localityField.field.value ?? "").trim();
  const neighborhoodRawForDisplay = String(
    neighborhoodField.field.value ?? "",
  ).trim();
  const municipalityCatalogValue = useMemo(
    () =>
      resolveMunicipalityCatalogCode(
        municipalityRawForDisplay,
        municipalities,
      ),
    [municipalityRawForDisplay, municipalities],
  );
  const localityCatalogValue = useMemo(
    () =>
      resolveCatalogCodeByShort(
        localityRawForDisplay,
        postalLookup.data?.localities ?? [],
      ),
    [localityRawForDisplay, postalLookup.data?.localities],
  );
  const neighborhoodCatalogValue = useMemo(
    () =>
      resolveCatalogCodeByShort(
        neighborhoodRawForDisplay,
        catalogNeighborhoodOptions,
      ),
    [catalogNeighborhoodOptions, neighborhoodRawForDisplay],
  );

  // Dirección ya persistida: marcar CP como aplicado para no pisar municipio/colonia al hidratar.
  useEffect(() => {
    const cp = String(postalCodeField.field.value ?? "").trim();
    if (!/^\d{5}$/.test(cp)) return;

    const hasPersistedSatFields =
      Boolean(String(stateField.field.value ?? "").trim()) ||
      Boolean(String(municipalityField.field.value ?? "").trim()) ||
      Boolean(String(localityField.field.value ?? "").trim()) ||
      Boolean(String(localityNameField.field.value ?? "").trim()) ||
      hasPersistedNeighborhoodCode ||
      hasPersistedNeighborhoodName;

    if (hasPersistedSatFields) {
      lastAppliedPostalCodeRef.current = cp;
    }
  }, [
    hasPersistedNeighborhoodCode,
    hasPersistedNeighborhoodName,
    localityField.field.value,
    localityNameField.field.value,
    municipalityField.field.value,
    neighborhoodField.field.value,
    neighborhoodNameField.field.value,
    postalCodeField.field.value,
    stateField.field.value,
  ]);

  useEffect(() => {
    const data = postalLookup.data;
    if (!data || !postalLookupFound) return;
    if (data.postalCode === lastAppliedPostalCodeRef.current) return;

    const stateEmpty = !String(stateField.field.value ?? "").trim();
    const municipalityEmpty = !String(municipalityField.field.value ?? "").trim();
    const localityEmpty = !String(localityField.field.value ?? "").trim();
    const neighborhoodEmpty = !String(neighborhoodField.field.value ?? "").trim();
    const neighborhoodNameEmpty = !String(neighborhoodNameField.field.value ?? "").trim();

    if (data.stateCode && stateEmpty) {
      stateField.field.onChange(data.stateCode);
    }
    if (data.municipalityCode && municipalityEmpty) {
      municipalityField.field.onChange(toShortSatCode(data.municipalityCode));
    }
    const localityNameEmpty = !String(localityNameField.field.value ?? "").trim();
    if (data.localities.length === 1 && localityEmpty && localityNameEmpty) {
      localityField.field.onChange(toShortSatCode(data.localities[0]?.code ?? ""));
      localityNameField.field.onChange(data.localities[0]?.name ?? "");
    }
    if (
      data.neighborhoods.length === 1 &&
      neighborhoodEmpty &&
      neighborhoodNameEmpty
    ) {
      neighborhoodField.field.onChange(data.neighborhoods[0]?.code ?? "");
      neighborhoodNameField.field.onChange(data.neighborhoods[0]?.name ?? "");
    }

    lastAppliedPostalCodeRef.current = data.postalCode;
  }, [
    localityField.field,
    localityNameField.field,
    municipalityField.field,
    neighborhoodField.field,
    neighborhoodNameField.field,
    postalLookup.data,
    postalLookupFound,
    stateField.field,
  ]);

  useEffect(() => {
    if (variant !== "carta-porte" || !onCartaPorteReadyChange) return;
    onCartaPorteReadyChange(addressReadyForMode);
  }, [addressReadyForMode, variant, onCartaPorteReadyChange]);

  const containerClass = embedded
    ? cn("space-y-4", disabled && "opacity-70")
    : addressInputContainerClass(disabled);

  const content = (
    <div className={containerClass}>
      {extraSlots?.beforeAddress}

      <AddressSavedAddressesBlock<TFieldValues>
        control={control}
        namePrefix={namePrefix}
        savedAddresses={savedAddresses}
        onSelectSaved={onSelectSaved}
        disabled={disabled}
        setValue={setValue}
      />

      <div className={cn("grid gap-3", LAYOUT_CLASS[layout])}>
        <div className="contents">
        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-postal-code`}>
            Código postal{requiredMark(profileUx.requirePostalCode)}
          </Label>
          <Input
            id={`${props.namePrefix}-postal-code`}
            value={String(postalCodeField.field.value ?? "")}
            onChange={(event) => {
              const numericValue = event.target.value.replace(/\D/g, "").slice(0, 5);
              if (numericValue !== postalCodeField.field.value) {
                postalCodeField.field.onChange(numericValue);
              }

              if (neighborhoodField.field.value) {
                neighborhoodField.field.onChange("");
              }
              if (neighborhoodNameField.field.value) {
                neighborhoodNameField.field.onChange("");
              }

              const needsResetHierarchy =
                numericValue !== lastAppliedPostalCodeRef.current;
              if (!needsResetHierarchy) return;

              if (stateField.field.value) stateField.field.onChange("");
              if (municipalityField.field.value) {
                municipalityField.field.onChange("");
              }
              if (localityField.field.value) localityField.field.onChange("");
            }}
            onBlur={postalCodeField.field.onBlur}
            maxLength={5}
            inputMode="numeric"
            autoFocus={autoFocusFirstField}
            disabled={disabled}
            error={Boolean(postalCodeField.fieldState.error)}
            {...getFieldErrorAriaProps(
              `${props.namePrefix}-postal-code`,
              postalCodeField.fieldState.error?.message,
            )}
          />
          <FieldInlineError
            fieldId={`${props.namePrefix}-postal-code`}
            message={postalCodeField.fieldState.error?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-country`}>
            País{requiredMark(profileUx.requireCountry)}
          </Label>
          <Select
            value={String(countryField.field.value ?? "MEX")}
            onValueChange={countryField.field.onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona país" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-state`}>
            Estado{requiredMark(profileUx.requireState)}
          </Label>
          <Select
            value={String(stateField.field.value ?? "")}
            onValueChange={(value) => {
              stateField.field.onChange(value);
              municipalityField.field.onChange("");
              localityField.field.onChange("");
              neighborhoodField.field.onChange("");
              neighborhoodNameField.field.onChange("");
            }}
            disabled={disabled}
          >
            <SelectTrigger
              id={`${props.namePrefix}-state`}
              error={Boolean(stateField.fieldState.error)}
              {...getFieldErrorAriaProps(
                `${props.namePrefix}-state`,
                stateField.fieldState.error?.message,
              )}
            >
              <SelectValue placeholder="Selecciona estado" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldInlineError
            fieldId={`${props.namePrefix}-state`}
            message={stateField.fieldState.error?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-municipality`}>
            Municipio {requiredByMode.requireMunicipality ? "*" : ""}
            {requiredByMode.recommendMunicipality && !requiredByMode.requireMunicipality ? (
              <span className="font-normal text-muted-foreground"> (recomendado)</span>
            ) : null}
          </Label>
          {/*
            Radix Select no muestra etiqueta si el primer value no coincide con ningún Item
            (ej. "039" vs catálogo "JAL-039"). En la 1ª visita el catálogo suele llegar async;
            al poblar `municipalities` el resolved value cambia a compuesto: sin remount a veces
            el trigger queda en blanco hasta la 2ª entrada. La key fuerza resync al cargar items.
          */}
          <Select
            key={`${props.namePrefix}-municipality-${municipalityCatalogValue}-${municipalities.length}-${isLoadingMunicipalities ? 1 : 0}`}
            value={municipalityCatalogValue}
            onValueChange={(value) => {
              const shortMunicipalityCode = toShortSatCode(value);
              municipalityField.field.onChange(shortMunicipalityCode);
              localityField.field.onChange("");
            }}
            disabled={disabled || isLoadingMunicipalities}
          >
            <SelectTrigger
              id={`${props.namePrefix}-municipality`}
              error={Boolean(municipalityField.fieldState.error)}
              {...getFieldErrorAriaProps(
                `${props.namePrefix}-municipality`,
                municipalityField.fieldState.error?.message,
              )}
            >
              <SelectValue placeholder="Selecciona municipio" />
            </SelectTrigger>
            <SelectContent>
              {municipalities.map((municipality) => (
                <SelectItem key={municipality.code} value={municipality.code}>
                  {municipality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldInlineError
            fieldId={`${props.namePrefix}-municipality`}
            message={municipalityField.fieldState.error?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-locality`}>
            Localidad {requiredByMode.requireLocality ? "*" : ""}
          </Label>
          {lookupHasLocalities ? (
            <Select
              value={localityCatalogValue}
              onValueChange={(value) => {
                const selected = (postalLookup.data?.localities ?? []).find(
                  (item) => item.code === value,
                );
                localityField.field.onChange(toShortSatCode(value));
                localityNameField.field.onChange(selected?.name ?? "");
              }}
              disabled={disabled}
            >
              <SelectTrigger
                id={`${props.namePrefix}-locality`}
                error={Boolean(localityField.fieldState.error)}
                {...getFieldErrorAriaProps(
                  `${props.namePrefix}-locality`,
                  localityField.fieldState.error?.message,
                )}
              >
                <SelectValue placeholder="Selecciona localidad (catálogo SAT)" />
              </SelectTrigger>
              <SelectContent>
                {(postalLookup.data?.localities ?? []).map((locality) => (
                  <SelectItem key={locality.code} value={locality.code}>
                    {locality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            id={`${props.namePrefix}-locality-manual`}
            value={String(localityNameField.field.value ?? "")}
            onChange={(event) => {
              localityNameField.field.onChange(event.target.value);
              if (event.target.value.trim()) {
                localityField.field.onChange("");
              }
            }}
            disabled={disabled}
            placeholder={
              lookupHasLocalities
                ? "O captura localidad manual"
                : "Captura localidad manual"
            }
            error={Boolean(localityNameField.fieldState.error)}
            {...getFieldErrorAriaProps(
              `${props.namePrefix}-locality-manual`,
              localityNameField.fieldState.error?.message,
            )}
          />
          <FieldInlineError
            fieldId={`${props.namePrefix}-locality`}
            message={
              localityField.fieldState.error?.message ??
              localityNameField.fieldState.error?.message
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-neighborhood`}>
            Colonia {requiredByMode.requireNeighborhood ? "*" : ""}
          </Label>
          {lookupHasNeighborhoods ? (
            <Select
              key={`${props.namePrefix}-neighborhood-${neighborhoodCatalogValue}-${catalogNeighborhoodOptions.length}-${isLoadingNeighborhoodsByPostalCode ? 1 : 0}`}
              value={neighborhoodCatalogValue}
              onValueChange={(value) => {
                const selectedNeighborhood = catalogNeighborhoodOptions.find(
                  (item) => item.code === value,
                );
                neighborhoodField.field.onChange(toShortSatCode(value));
                neighborhoodNameField.field.onChange(selectedNeighborhood?.name ?? "");
              }}
              disabled={disabled || isLoadingNeighborhoodsByPostalCode}
            >
              <SelectTrigger
                id={`${props.namePrefix}-neighborhood`}
                error={Boolean(neighborhoodField.fieldState.error)}
                {...getFieldErrorAriaProps(
                  `${props.namePrefix}-neighborhood`,
                  neighborhoodField.fieldState.error?.message,
                )}
              >
                <SelectValue placeholder="Selecciona colonia (catálogo SAT)" />
              </SelectTrigger>
              <SelectContent>
                {catalogNeighborhoodOptions.map((neighborhood) => (
                  <SelectItem key={neighborhood.code} value={neighborhood.code}>
                    {neighborhood.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Input
            id={`${props.namePrefix}-neighborhood-manual`}
            value={String(neighborhoodNameField.field.value ?? "")}
            onChange={(event) => {
              neighborhoodNameField.field.onChange(event.target.value);
              if (event.target.value.trim()) {
                neighborhoodField.field.onChange("");
              }
            }}
            disabled={disabled}
            placeholder={
              lookupHasNeighborhoods
                ? "O captura colonia manual"
                : "Captura colonia manual"
            }
            error={Boolean(neighborhoodNameField.fieldState.error)}
            {...getFieldErrorAriaProps(
              `${props.namePrefix}-neighborhood-manual`,
              neighborhoodNameField.fieldState.error?.message,
            )}
          />
          <FieldInlineError
            fieldId={`${props.namePrefix}-neighborhood`}
            message={neighborhoodNameField.fieldState.error?.message}
          />
        </div>
        </div>

        <MemoAddressStreetFields
          control={control}
          namePrefix={namePrefix}
          disabled={disabled}
          disableCoordinates={disableCoordinates}
          showLatLng={showLatLng}
          requireStreetFields={requireStreetFields}
          requireCoordinates={profileUx.requireCoordinates}
        />
      </div>

      {postalLookup.isError && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No se pudo consultar el catálogo SAT para el CP capturado.
          </AlertDescription>
        </Alert>
      )}

      {postalLookup.isLoading && !hideInformativeAlerts && (
        <Alert variant="info">
          <AlertDescription>
            Consultando catálogo SAT para el código postal...
          </AlertDescription>
        </Alert>
      )}

      {hasPostalLookupData &&
        postalLookupFound &&
        hasMultipleNeighborhoods &&
        !hideInformativeAlerts && (
        <Alert variant="info">
          <AlertDescription>
            Se encontraron múltiples colonias para el CP. Selecciona la correcta.
          </AlertDescription>
        </Alert>
      )}

      {hasPostalLookupData &&
        postalLookupFound &&
        hasMultipleLocalities &&
        !hideInformativeAlerts && (
        <Alert variant="info">
          <AlertDescription>
            Se encontraron múltiples localidades para el CP. Selecciona la que
            corresponda.
          </AlertDescription>
        </Alert>
      )}

      {showPrimaryToggle && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={Boolean(isPrimaryField.field.value)}
            onCheckedChange={(checked) => isPrimaryField.field.onChange(Boolean(checked))}
            disabled={disabled}
            id={`${props.namePrefix}-is-primary`}
          />
          <Label htmlFor={`${props.namePrefix}-is-primary`}>
            Marcar como dirección principal
          </Label>
        </div>
      )}

      {extraSlots?.afterAddress}
    </div>
  );

  if (!collapsible) {
    return content;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left font-medium"
        disabled={disabled}
      >
        <span>Dirección</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">{content}</CollapsibleContent>
    </Collapsible>
  );
}

function addressInputPropsAreEqual(
  prev: AddressInputProps<FieldValues>,
  next: AddressInputProps<FieldValues>,
): boolean {
  return (
    prev.variant === next.variant &&
    prev.formContext === next.formContext &&
    prev.addressType === next.addressType &&
    prev.control === next.control &&
    prev.setValue === next.setValue &&
    prev.namePrefix === next.namePrefix &&
    prev.savedAddresses === next.savedAddresses &&
    prev.onSelectSaved === next.onSelectSaved &&
    prev.layout === next.layout &&
    prev.collapsible === next.collapsible &&
    prev.defaultExpanded === next.defaultExpanded &&
    prev.showLatLng === next.showLatLng &&
    prev.showPrimaryToggle === next.showPrimaryToggle &&
    prev.autoFocusFirstField === next.autoFocusFirstField &&
    prev.onCartaPorteReadyChange === next.onCartaPorteReadyChange &&
    prev.extraSlots === next.extraSlots &&
    prev.disabled === next.disabled &&
    prev.disableCoordinates === next.disableCoordinates &&
    prev.hideInformativeAlerts === next.hideInformativeAlerts &&
    prev.embedded === next.embedded
  );
}

const AddressInput = memo(
  AddressInputRoot,
  addressInputPropsAreEqual,
) as typeof AddressInputRoot;

export default AddressInput;
