import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useController,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
  type UseFormSetValue,
} from "react-hook-form";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
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
import { usePostalCodeLookup } from "./use-postal-code-lookup";
import { useSatCatalogs } from "./use-sat-catalogs";
import { AddressPreview } from "./AddressPreview";
import {
  getAddressModeRequirements,
  isAddressReadyForMode,
  isCartaPorteSatMinimumMet,
  type PostalLookupStatus,
} from "@shared/validation/addressRequirements";

const LAYOUT_CLASS: Record<AddressInputLayout, string> = {
  "single-column": "grid-cols-1",
  "two-column": "grid-cols-1 sm:grid-cols-2",
  compact: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

function getAddressFieldAriaProps(
  fieldId: string,
  message?: string,
): { "aria-invalid": boolean; "aria-describedby"?: string } {
  return {
    "aria-invalid": Boolean(message),
    ...(message ? { "aria-describedby": `${fieldId}-error` } : {}),
  };
}

function AddressFieldInlineError({
  fieldId,
  message,
}: {
  fieldId: string;
  message?: string;
}) {
  return message ? (
    <p id={`${fieldId}-error`} className="text-destructive text-xs">
      {message}
    </p>
  ) : null;
}

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
      <Label>Direccion guardada</Label>
      <Select
        value={selectedSavedAddress?.id ?? ""}
        onValueChange={handleSavedAddressSelection}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una direccion guardada" />
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
  showLatLng: boolean;
}

/** Campos domicilio: aislados del bloque postal para reducir coste por tecla en calle. */
function AddressInputStreetFieldsInner<T extends FieldValues>({
  control,
  namePrefix,
  disabled,
  showLatLng,
}: AddressStreetFieldsProps<T>) {
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
        <Label htmlFor={`${namePrefix}-street`}>Calle *</Label>
        <Input
          id={`${namePrefix}-street`}
          value={String(streetField.field.value ?? "")}
          onChange={(event) => streetField.field.onChange(event.target.value)}
          disabled={disabled}
          error={Boolean(streetField.fieldState.error)}
          {...getAddressFieldAriaProps(
            `${namePrefix}-street`,
            streetField.fieldState.error?.message,
          )}
        />
        <AddressFieldInlineError
          fieldId={`${namePrefix}-street`}
          message={streetField.fieldState.error?.message}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${namePrefix}-ext-number`}>Numero exterior *</Label>
        <Input
          id={`${namePrefix}-ext-number`}
          value={String(exteriorField.field.value ?? "")}
          onChange={(event) => exteriorField.field.onChange(event.target.value)}
          disabled={disabled}
          error={Boolean(exteriorField.fieldState.error)}
          {...getAddressFieldAriaProps(
            `${namePrefix}-ext-number`,
            exteriorField.fieldState.error?.message,
          )}
        />
        <AddressFieldInlineError
          fieldId={`${namePrefix}-ext-number`}
          message={exteriorField.fieldState.error?.message}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${namePrefix}-int-number`}>Numero interior</Label>
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
            <Label htmlFor={`${namePrefix}-latitude`}>Latitud</Label>
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
              disabled={disabled}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${namePrefix}-longitude`}>Longitud</Label>
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
              disabled={disabled}
              inputMode="decimal"
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
    mode,
    savedAddresses = [],
    onSelectSaved,
    layout = "compact",
    collapsible = false,
    defaultExpanded = true,
    showLatLng = false,
    showPrimaryToggle = false,
    autoFocusFirstField = false,
    onCartaPorteReadyChange,
    extraSlots,
    disabled = false,
    hideInformativeAlerts = false,
    embedded = false,
    control,
    namePrefix,
    setValue,
  } = props;

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const lastAppliedPostalCodeRef = useRef<string>("");
  const requiredByMode = getAddressModeRequirements(mode);

  const postalCodeField = useAddressField(props, "postalCode");
  const countryField = useAddressField(props, "satCountryCode");
  const stateField = useAddressField(props, "satStateCode");
  const municipalityField = useAddressField(props, "satMunicipalityCode");
  const localityField = useAddressField(props, "satLocalityCode");
  const neighborhoodField = useAddressField(props, "satNeighborhoodCode");
  const neighborhoodNameField = useAddressField(props, "neighborhoodName");
  const isPrimaryField = useAddressField(props, "isPrimary");

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
  /** Colonia guardada solo como texto (sin código SAT) debe seguir en input manual. */
  const prefersManualNeighborhood =
    hasPersistedNeighborhoodName && !hasPersistedNeighborhoodCode;
  const shouldUseManualNeighborhood =
    prefersManualNeighborhood || !lookupHasNeighborhoods;
  const hasMultipleNeighborhoods =
    catalogNeighborhoodOptions.length > 1;
  const hasMultipleLocalities = (postalLookup.data?.localities.length ?? 0) > 1;
  const hasNeighborhoodValue = Boolean(
    neighborhoodField.field.value || neighborhoodNameField.field.value,
  );

  const addressReadyForMode = useMemo(
    () =>
      isAddressReadyForMode({
        mode,
        satCountryCode: String(countryField.field.value ?? ""),
        satStateCode: String(stateField.field.value ?? ""),
        satMunicipalityCode: String(municipalityField.field.value ?? ""),
        postalCode: String(postalCodeField.field.value ?? ""),
        postalLookupStatus,
      }),
    [
      countryField.field.value,
      mode,
      municipalityField.field.value,
      postalCodeField.field.value,
      postalLookupStatus,
      stateField.field.value,
    ],
  );

  const cartaPorteSatMinimumMet = useMemo(
    () =>
      isCartaPorteSatMinimumMet({
        mode,
        satCountryCode: String(countryField.field.value ?? ""),
        satStateCode: String(stateField.field.value ?? ""),
        postalCode: String(postalCodeField.field.value ?? ""),
        postalLookupStatus,
      }),
    [
      countryField.field.value,
      mode,
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
      hasPersistedNeighborhoodCode ||
      hasPersistedNeighborhoodName;

    if (hasPersistedSatFields) {
      lastAppliedPostalCodeRef.current = cp;
    }
  }, [
    hasPersistedNeighborhoodCode,
    hasPersistedNeighborhoodName,
    localityField.field.value,
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
    if (data.localities.length === 1 && localityEmpty) {
      localityField.field.onChange(toShortSatCode(data.localities[0]?.code ?? ""));
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
    municipalityField.field,
    neighborhoodField.field,
    neighborhoodNameField.field,
    postalLookup.data,
    postalLookupFound,
    stateField.field,
  ]);

  useEffect(() => {
    if (mode !== "carta-porte" || !onCartaPorteReadyChange) return;
    onCartaPorteReadyChange(addressReadyForMode);
  }, [addressReadyForMode, mode, onCartaPorteReadyChange]);

  const containerClass = cn("space-y-4", {
    "rounded-lg border p-4": !embedded,
    "opacity-70": disabled,
  });

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
          <Label htmlFor={`${props.namePrefix}-postal-code`}>Codigo postal *</Label>
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
            {...getAddressFieldAriaProps(
              `${props.namePrefix}-postal-code`,
              postalCodeField.fieldState.error?.message,
            )}
          />
          <AddressFieldInlineError
            fieldId={`${props.namePrefix}-postal-code`}
            message={postalCodeField.fieldState.error?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-country`}>Pais *</Label>
          <Select
            value={String(countryField.field.value ?? "MEX")}
            onValueChange={countryField.field.onChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona pais" />
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
          <Label htmlFor={`${props.namePrefix}-state`}>Estado *</Label>
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
            <SelectTrigger id={`${props.namePrefix}-state`}>
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
          <AddressFieldInlineError
            fieldId={`${props.namePrefix}-state`}
            message={stateField.fieldState.error?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-municipality`}>
            Municipio
            {mode === "carta-porte" ? (
              <span className="font-normal text-muted-foreground"> (opcional)</span>
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
            <SelectTrigger id={`${props.namePrefix}-municipality`}>
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
          <AddressFieldInlineError
            fieldId={`${props.namePrefix}-municipality`}
            message={municipalityField.fieldState.error?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-locality`}>
            Localidad {requiredByMode.requireLocality ? "*" : ""}
          </Label>
          <Select
            value={localityCatalogValue}
            onValueChange={(value) =>
              localityField.field.onChange(toShortSatCode(value))
            }
            disabled={disabled || (postalLookup.data?.localities.length ?? 0) === 0}
          >
            <SelectTrigger id={`${props.namePrefix}-locality`}>
              <SelectValue placeholder="Selecciona localidad" />
            </SelectTrigger>
            <SelectContent>
              {(postalLookup.data?.localities ?? []).map((locality) => (
                <SelectItem key={locality.code} value={locality.code}>
                  {locality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddressFieldInlineError
            fieldId={`${props.namePrefix}-locality`}
            message={localityField.fieldState.error?.message}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-neighborhood`}>
            Colonia {requiredByMode.requireNeighborhood ? "*" : ""}
          </Label>
          {shouldUseManualNeighborhood ? (
            <Input
              id={`${props.namePrefix}-neighborhood`}
              value={String(neighborhoodNameField.field.value ?? "")}
              onChange={(event) => neighborhoodNameField.field.onChange(event.target.value)}
              disabled={disabled}
              placeholder="Captura colonia manual"
              error={Boolean(neighborhoodNameField.fieldState.error)}
              {...getAddressFieldAriaProps(
                `${props.namePrefix}-neighborhood`,
                neighborhoodNameField.fieldState.error?.message,
              )}
            />
          ) : (
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
              <SelectTrigger id={`${props.namePrefix}-neighborhood`}>
                <SelectValue placeholder="Selecciona colonia" />
              </SelectTrigger>
              <SelectContent>
                {catalogNeighborhoodOptions.map((neighborhood) => (
                  <SelectItem key={neighborhood.code} value={neighborhood.code}>
                    {neighborhood.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <AddressFieldInlineError
            fieldId={`${props.namePrefix}-neighborhood`}
            message={neighborhoodNameField.fieldState.error?.message}
          />
        </div>
        </div>

        <MemoAddressStreetFields
          control={control}
          namePrefix={namePrefix}
          disabled={disabled}
          showLatLng={showLatLng}
        />
      </div>

      {postalLookup.isError && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No se pudo consultar el catalogo SAT para el CP capturado.
          </AlertDescription>
        </Alert>
      )}

      {postalLookup.isLoading && !hideInformativeAlerts && (
        <Alert variant="info">
          <AlertDescription>
            Consultando catalogo SAT para el codigo postal...
          </AlertDescription>
        </Alert>
      )}

      {hasPostalLookupData && !postalLookupFound && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            El CP no existe en el catalogo SAT. Captura manualmente estado,
            municipio y colonia para continuar.
          </AlertDescription>
        </Alert>
      )}

      {hasPostalLookupData && postalLookupFound && !lookupHasNeighborhoods && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            CP sin coincidencia completa en lookup directo. Se intento cargar
            colonias desde catalogo SAT; si tampoco hay resultados, captura
            colonia manual.
          </AlertDescription>
        </Alert>
      )}

      {hasPostalLookupData &&
        postalLookupFound &&
        hasMultipleNeighborhoods &&
        !hideInformativeAlerts && (
        <Alert variant="info">
          <AlertDescription>
            Se encontraron multiples colonias para el CP. Selecciona la correcta.
          </AlertDescription>
        </Alert>
      )}

      {hasPostalLookupData &&
        postalLookupFound &&
        hasMultipleLocalities &&
        !hideInformativeAlerts && (
        <Alert variant="info">
          <AlertDescription>
            Se encontraron multiples localidades para el CP. Selecciona la que
            corresponda.
          </AlertDescription>
        </Alert>
      )}

      {cartaPorteSatMinimumMet && !hideInformativeAlerts && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Minimo SAT de ubicacion cubierto (pais, estado, codigo postal).
            Municipio, localidad y colonia son opcionales en el complemento si no
            se envian.
          </AlertDescription>
        </Alert>
      )}

      {mode === "carta-porte" && requiredByMode.requireNeighborhood && !hasNeighborhoodValue && (
        <Alert variant="warning">
          <AlertDescription>
            Para Carta Porte debes seleccionar colonia SAT o capturar colonia
            manual si no hay catalogo.
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
            Marcar como direccion principal
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
        <span>Direccion</span>
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
    prev.mode === next.mode &&
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
    prev.hideInformativeAlerts === next.hideInformativeAlerts &&
    prev.embedded === next.embedded
  );
}

const AddressInput = memo(
  AddressInputRoot,
  addressInputPropsAreEqual,
) as typeof AddressInputRoot;

export default AddressInput;
