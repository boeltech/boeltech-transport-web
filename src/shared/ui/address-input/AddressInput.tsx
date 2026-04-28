import { useEffect, useMemo, useRef, useState } from "react";
import { useController, type FieldValues, type Path } from "react-hook-form";
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
  AddressInputMode,
  SavedAddressOption,
} from "./AddressInput.types";
import { usePostalCodeLookup } from "./use-postal-code-lookup";
import { useSatCatalogs } from "./use-sat-catalogs";
import { AddressPreview } from "./AddressPreview";

const LAYOUT_CLASS: Record<AddressInputLayout, string> = {
  "single-column": "grid-cols-1",
  "two-column": "grid-cols-1 sm:grid-cols-2",
  compact: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

const MODE_REQUIRED_FIELDS: Record<
  AddressInputMode,
  {
    locality: boolean;
    neighborhood: boolean;
  }
> = {
  "carta-porte": {
    locality: true,
    neighborhood: true,
  },
  cfdi: {
    locality: false,
    neighborhood: false,
  },
  personal: {
    locality: false,
    neighborhood: false,
  },
  basic: {
    locality: false,
    neighborhood: false,
  },
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

function mapSavedAddressToValue(address: SavedAddressOption, fieldName: string) {
  const record: Record<string, unknown> = {
    street: address.street,
    exteriorNumber: address.exteriorNumber,
    interiorNumber: address.interiorNumber ?? "",
    reference: address.reference ?? "",
    postalCode: address.postalCode,
    satCountryCode: address.satCountryCode,
    satStateCode: address.satStateCode,
    satMunicipalityCode: address.satMunicipalityCode,
    satLocalityCode: address.satLocalityCode ?? "",
    satNeighborhoodCode: address.satNeighborhoodCode ?? "",
    neighborhoodName: address.neighborhoodName ?? "",
    latitude: address.latitude ?? "",
    longitude: address.longitude ?? "",
    isPrimary: address.isPrimary ?? false,
  };

  return record[fieldName];
}

export default function AddressInput<TFieldValues extends FieldValues = FieldValues>(
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
  } = props;

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const lastAppliedPostalCodeRef = useRef<string>("");
  const lastKnownMunicipalityShortRef = useRef<string>("");
  const requiredByMode = MODE_REQUIRED_FIELDS[mode];

  const postalCodeField = useAddressField(props, "postalCode");
  const countryField = useAddressField(props, "satCountryCode");
  const stateField = useAddressField(props, "satStateCode");
  const municipalityField = useAddressField(props, "satMunicipalityCode");
  const localityField = useAddressField(props, "satLocalityCode");
  const neighborhoodField = useAddressField(props, "satNeighborhoodCode");
  const neighborhoodNameField = useAddressField(props, "neighborhoodName");
  const streetField = useAddressField(props, "street");
  const exteriorField = useAddressField(props, "exteriorNumber");
  const interiorField = useAddressField(props, "interiorNumber");
  const referenceField = useAddressField(props, "reference");
  const latitudeField = useAddressField(props, "latitude");
  const longitudeField = useAddressField(props, "longitude");
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

  const selectedSavedAddress = useMemo(() => {
    const currentPostalCode = String(postalCodeField.field.value ?? "");
    const currentStreet = String(streetField.field.value ?? "");

    return (
      savedAddresses.find(
        (item) =>
          item.postalCode === currentPostalCode && item.street === currentStreet,
      ) ?? null
    );
  }, [postalCodeField.field.value, savedAddresses, streetField.field.value]);

  const hasPostalLookupData = Boolean(postalLookup.data);
  const postalLookupFound = postalLookup.data?.found ?? true;
  const catalogNeighborhoodOptions =
    (postalLookup.data?.neighborhoods.length ?? 0) > 0
      ? postalLookup.data?.neighborhoods ?? []
      : neighborhoodsByPostalCode.map((item) => ({
          code: item.code,
          name: item.name,
        }));
  const lookupHasNeighborhoods = catalogNeighborhoodOptions.length > 0;
  const shouldUseManualNeighborhood = !lookupHasNeighborhoods;
  const hasMultipleNeighborhoods =
    catalogNeighborhoodOptions.length > 1;
  const hasMultipleLocalities = (postalLookup.data?.localities.length ?? 0) > 1;
  const hasNeighborhoodValue = Boolean(
    neighborhoodField.field.value || neighborhoodNameField.field.value,
  );
  useEffect(() => {
    const currentShort = toShortSatCode(String(municipalityField.field.value ?? "").trim());
    if (currentShort) {
      lastKnownMunicipalityShortRef.current = currentShort;
    }
  }, [municipalityField.field.value]);

  const municipalityRawForDisplay =
    String(municipalityField.field.value ?? "").trim() ||
    lastKnownMunicipalityShortRef.current;
  const municipalityCatalogValue = useMemo(
    () =>
      resolveMunicipalityCatalogCode(
        municipalityRawForDisplay,
        municipalities,
      ),
    [municipalityRawForDisplay, municipalities],
  );

  useEffect(() => {
    if (!postalLookup.data || !postalLookupFound) return;

    if (postalLookup.data.postalCode === lastAppliedPostalCodeRef.current) return;

    if (postalLookup.data.stateCode) {
      stateField.field.onChange(postalLookup.data.stateCode);
    }

    if (postalLookup.data.municipalityCode) {
      municipalityField.field.onChange(
        toShortSatCode(postalLookup.data.municipalityCode),
      );
    }

    if (postalLookup.data.localities.length === 1) {
      localityField.field.onChange(postalLookup.data.localities[0]?.code ?? "");
    }

    if (postalLookup.data.neighborhoods.length === 1) {
      neighborhoodField.field.onChange(
        postalLookup.data.neighborhoods[0]?.code ?? "",
      );
      neighborhoodNameField.field.onChange(
        postalLookup.data.neighborhoods[0]?.name ?? "",
      );
    }

    lastAppliedPostalCodeRef.current = postalLookup.data.postalCode;
  }, [
    localityField.field,
    municipalityField.field,
    neighborhoodField.field,
    neighborhoodNameField.field,
    municipalities,
    postalLookup.data,
    postalLookupFound,
    stateField.field,
  ]);

  const getErrorProps = (
    fieldId: string,
    message?: string,
  ): { "aria-invalid": boolean; "aria-describedby"?: string } => ({
    "aria-invalid": Boolean(message),
    ...(message ? { "aria-describedby": `${fieldId}-error` } : {}),
  });

  const renderError = (fieldId: string, message?: string) =>
    message ? (
      <p id={`${fieldId}-error`} className="text-destructive text-xs">
        {message}
      </p>
    ) : null;

  useEffect(() => {
    if (mode !== "carta-porte" || !onCartaPorteReadyChange) return;

    const isReady = Boolean(
      stateField.field.value &&
        municipalityField.field.value &&
        postalCodeField.field.value &&
        localityField.field.value &&
        neighborhoodField.field.value,
    );

    onCartaPorteReadyChange(isReady);
  }, [
    localityField.field.value,
    mode,
    municipalityField.field.value,
    neighborhoodField.field.value,
    onCartaPorteReadyChange,
    postalCodeField.field.value,
    stateField.field.value,
  ]);

  const handleSavedAddressSelection = (savedAddressId: string) => {
    const selected = savedAddresses.find((item) => item.id === savedAddressId);
    if (!selected) return;

    const setFieldValue = (fieldName: string, targetField: { onChange: (value: unknown) => void }) => {
      targetField.onChange(mapSavedAddressToValue(selected, fieldName));
    };

    setFieldValue("street", streetField.field);
    setFieldValue("exteriorNumber", exteriorField.field);
    setFieldValue("interiorNumber", interiorField.field);
    setFieldValue("reference", referenceField.field);
    setFieldValue("postalCode", postalCodeField.field);
    setFieldValue("satCountryCode", countryField.field);
    setFieldValue("satStateCode", stateField.field);
    municipalityField.field.onChange(
      toShortSatCode(String(mapSavedAddressToValue(selected, "satMunicipalityCode") ?? "")),
    );
    lastKnownMunicipalityShortRef.current = toShortSatCode(
      String(mapSavedAddressToValue(selected, "satMunicipalityCode") ?? "").trim(),
    );
    setFieldValue("satLocalityCode", localityField.field);
    setFieldValue("satNeighborhoodCode", neighborhoodField.field);
    setFieldValue("neighborhoodName", neighborhoodNameField.field);
    setFieldValue("latitude", latitudeField.field);
    setFieldValue("longitude", longitudeField.field);
    setFieldValue("isPrimary", isPrimaryField.field);

    onSelectSaved?.(selected);
  };

  const containerClass = cn("space-y-4 rounded-lg border p-4", {
    "opacity-70": disabled,
  });

  const content = (
    <div className={containerClass}>
      {extraSlots?.beforeAddress}

      {savedAddresses.length > 0 && (
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
          {selectedSavedAddress && <AddressPreview address={selectedSavedAddress} />}
        </div>
      )}

      <div className={cn("grid gap-3", LAYOUT_CLASS[layout])}>
        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-postal-code`}>Codigo postal *</Label>
          <Input
            id={`${props.namePrefix}-postal-code`}
            value={String(postalCodeField.field.value ?? "")}
            onChange={(event) => {
              const numericValue = event.target.value.replace(/\D/g, "").slice(0, 5);
              postalCodeField.field.onChange(numericValue);
              neighborhoodField.field.onChange("");
              neighborhoodNameField.field.onChange("");

              if (numericValue !== lastAppliedPostalCodeRef.current) {
                stateField.field.onChange("");
                municipalityField.field.onChange("");
                lastKnownMunicipalityShortRef.current = "";
                localityField.field.onChange("");
              }
            }}
            onBlur={postalCodeField.field.onBlur}
            maxLength={5}
            inputMode="numeric"
            autoFocus={autoFocusFirstField}
            disabled={disabled}
            error={Boolean(postalCodeField.fieldState.error)}
            {...getErrorProps(
              `${props.namePrefix}-postal-code`,
              postalCodeField.fieldState.error?.message,
            )}
          />
          {renderError(
            `${props.namePrefix}-postal-code`,
            postalCodeField.fieldState.error?.message,
          )}
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
              lastKnownMunicipalityShortRef.current = "";
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
          {renderError(
            `${props.namePrefix}-state`,
            stateField.fieldState.error?.message,
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-municipality`}>Municipio *</Label>
          <Select
            value={municipalityCatalogValue}
            onValueChange={(value) => {
              const shortMunicipalityCode = toShortSatCode(value);
              municipalityField.field.onChange(shortMunicipalityCode);
              lastKnownMunicipalityShortRef.current = shortMunicipalityCode;
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
          {renderError(
            `${props.namePrefix}-municipality`,
            municipalityField.fieldState.error?.message,
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-locality`}>
            Localidad {requiredByMode.locality ? "*" : ""}
          </Label>
          <Select
            value={String(localityField.field.value ?? "")}
            onValueChange={localityField.field.onChange}
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
          {renderError(
            `${props.namePrefix}-locality`,
            localityField.fieldState.error?.message,
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-neighborhood`}>
            Colonia {requiredByMode.neighborhood ? "*" : ""}
          </Label>
          {shouldUseManualNeighborhood ? (
            <Input
              id={`${props.namePrefix}-neighborhood`}
              value={String(neighborhoodNameField.field.value ?? "")}
              onChange={(event) => neighborhoodNameField.field.onChange(event.target.value)}
              disabled={disabled}
              placeholder="Captura colonia manual"
              error={Boolean(neighborhoodNameField.fieldState.error)}
              {...getErrorProps(
                `${props.namePrefix}-neighborhood`,
                neighborhoodNameField.fieldState.error?.message,
              )}
            />
          ) : (
            <Select
              value={String(neighborhoodField.field.value ?? "")}
              onValueChange={(value) => {
                const selectedNeighborhood = catalogNeighborhoodOptions.find(
                  (item) => item.code === value,
                );
                neighborhoodField.field.onChange(value);
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
          {renderError(
            `${props.namePrefix}-neighborhood`,
            neighborhoodNameField.fieldState.error?.message,
          )}
        </div>

        <div className="space-y-2 sm:col-span-2 lg:col-span-2">
          <Label htmlFor={`${props.namePrefix}-street`}>Calle *</Label>
          <Input
            id={`${props.namePrefix}-street`}
            value={String(streetField.field.value ?? "")}
            onChange={(event) => streetField.field.onChange(event.target.value)}
            disabled={disabled}
            error={Boolean(streetField.fieldState.error)}
            {...getErrorProps(
              `${props.namePrefix}-street`,
              streetField.fieldState.error?.message,
            )}
          />
          {renderError(
            `${props.namePrefix}-street`,
            streetField.fieldState.error?.message,
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-ext-number`}>Numero exterior *</Label>
          <Input
            id={`${props.namePrefix}-ext-number`}
            value={String(exteriorField.field.value ?? "")}
            onChange={(event) => exteriorField.field.onChange(event.target.value)}
            disabled={disabled}
            error={Boolean(exteriorField.fieldState.error)}
            {...getErrorProps(
              `${props.namePrefix}-ext-number`,
              exteriorField.fieldState.error?.message,
            )}
          />
          {renderError(
            `${props.namePrefix}-ext-number`,
            exteriorField.fieldState.error?.message,
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${props.namePrefix}-int-number`}>Numero interior</Label>
          <Input
            id={`${props.namePrefix}-int-number`}
            value={String(interiorField.field.value ?? "")}
            onChange={(event) => interiorField.field.onChange(event.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <Label htmlFor={`${props.namePrefix}-reference`}>Referencia</Label>
          <Input
            id={`${props.namePrefix}-reference`}
            value={String(referenceField.field.value ?? "")}
            onChange={(event) => referenceField.field.onChange(event.target.value)}
            disabled={disabled}
          />
        </div>

        {showLatLng && (
          <>
            <div className="space-y-2">
              <Label htmlFor={`${props.namePrefix}-latitude`}>Latitud</Label>
              <Input
                id={`${props.namePrefix}-latitude`}
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
              <Label htmlFor={`${props.namePrefix}-longitude`}>Longitud</Label>
              <Input
                id={`${props.namePrefix}-longitude`}
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
        )}
      </div>

      {postalLookup.isError && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No se pudo consultar el catalogo SAT para el CP capturado.
          </AlertDescription>
        </Alert>
      )}

      {postalLookup.isLoading && (
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

      {hasPostalLookupData && postalLookupFound && hasMultipleNeighborhoods && (
        <Alert variant="info">
          <AlertDescription>
            Se encontraron multiples colonias para el CP. Selecciona la correcta.
          </AlertDescription>
        </Alert>
      )}

      {hasPostalLookupData && postalLookupFound && hasMultipleLocalities && (
        <Alert variant="info">
          <AlertDescription>
            Se encontraron multiples localidades para el CP. Selecciona la que
            corresponda.
          </AlertDescription>
        </Alert>
      )}

      {mode === "carta-porte" && hasPostalLookupData && lookupHasNeighborhoods && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Direccion con datos SAT aptos para Carta Porte cuando completes los
            campos obligatorios.
          </AlertDescription>
        </Alert>
      )}

      {mode === "carta-porte" && requiredByMode.neighborhood && !hasNeighborhoodValue && (
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
