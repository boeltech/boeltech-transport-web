/**
 * LocationField — orchestrator: empty → Picker; value → Card; edit → Sheet.
 */

import { useId, useMemo, useState } from "react";

import type { LatLng } from "@shared/geolocation/contracts/geoPorts";
import { cn } from "@shared/lib/utils/cn";
import { Label } from "@shared/ui/label";

import { LOCATION_FIELD_COPY } from "./locationFieldCopy";
import { LocationCard } from "./LocationCard";
import type { LocationFieldProps, LocationValue } from "./LocationField.types";
import {
  LocationPicker,
  type LocationCreateRequestOptions,
} from "./LocationPicker";
import { LocationSheet } from "./LocationSheet";

export function LocationField({
  value,
  onChange,
  context,
  clientId,
  ownerTypes,
  filterItem,
  includeInternal = true,
  existingAddresses,
  label,
  placeholder,
  disabled = false,
  error,
  className,
  showCartaPorteStatus = false,
  onCreateRequest,
}: LocationFieldProps) {
  const fieldId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDraft, setSheetDraft] = useState<LocationValue | null>(null);
  const [preferMapPin, setPreferMapPin] = useState(false);

  const resolvedPlaceholder =
    placeholder ??
    (includeInternal
      ? LOCATION_FIELD_COPY.searchPlaceholder
      : LOCATION_FIELD_COPY.searchPlaceholderCreateOnly);
  const emptyHint = includeInternal
    ? LOCATION_FIELD_COPY.emptyHint
    : LOCATION_FIELD_COPY.emptyHintCreateOnly;

  const cardVariant =
    context === "tripStop" || context === "operational"
      ? "operational"
      : context === "geoPoint"
        ? "compact"
        : "default";

  const proximity = useMemo((): LatLng | null => {
    if (
      value?.latitude != null &&
      value?.longitude != null &&
      Number.isFinite(value.latitude) &&
      Number.isFinite(value.longitude)
    ) {
      return { latitude: value.latitude, longitude: value.longitude };
    }
    return null;
  }, [value?.latitude, value?.longitude]);

  const openCreateSheet = (
    draft?: LocationValue | null,
    opts?: LocationCreateRequestOptions,
  ) => {
    setPreferMapPin(Boolean(opts?.preferMapPin));
    setSheetDraft(draft ?? { locationName: null });
    setSheetOpen(true);
    setPickerOpen(false);
  };

  const handlePickerSelect = (next: LocationValue) => {
    // Mapbox / create drafts: always CONFIRMAR in Sheet (ADR-0092 D-C / arco).
    if (!next.sourceAddressId?.trim()) {
      openCreateSheet(next);
      return;
    }
    onChange(next);
    setPickerOpen(false);
  };

  const handleCreateRequest = (opts?: LocationCreateRequestOptions) => {
    if (onCreateRequest) {
      onCreateRequest();
      return;
    }
    openCreateSheet(value, opts);
  };

  const showPicker = !value || pickerOpen;
  const pickerPlaceholder = value
    ? LOCATION_FIELD_COPY.changeSearchPlaceholder
    : resolvedPlaceholder;

  return (
    <div className={cn("space-y-3", className)} data-context={context}>
      {label ? (
        <div className="space-y-1">
          <Label htmlFor={showPicker ? fieldId : undefined}>{label}</Label>
          {!value ? (
            <p className="text-xs text-muted-foreground">{emptyHint}</p>
          ) : null}
        </div>
      ) : !value ? (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      ) : null}

      {value ? (
        <LocationCard
          value={value}
          variant={cardVariant}
          context={context}
          showCartaPorteStatus={showCartaPorteStatus}
          disabled={disabled}
          onChangeRequest={() => setPickerOpen(true)}
          onEditRequest={() => openCreateSheet(value)}
        />
      ) : null}

      {showPicker ? (
        <LocationPicker
          id={fieldId}
          open={value ? pickerOpen : undefined}
          onOpenChange={value ? setPickerOpen : undefined}
          onSelect={handlePickerSelect}
          onCreateRequest={handleCreateRequest}
          clientId={clientId}
          ownerTypes={ownerTypes}
          filterItem={filterItem}
          includeInternal={includeInternal}
          proximity={proximity}
          placeholder={pickerPlaceholder}
          ariaLabel={label ?? LOCATION_FIELD_COPY.searchLabel}
          disabled={disabled}
          error={error}
          onlyGeolocated={context === "tripStop" || context === "geoPoint"}
        />
      ) : null}

      <LocationSheet
        open={sheetOpen}
        onOpenChange={(next) => {
          setSheetOpen(next);
          if (!next) setPreferMapPin(false);
        }}
        value={sheetDraft}
        context={context}
        onSave={(next) => {
          onChange(next);
          setSheetOpen(false);
          setPreferMapPin(false);
        }}
        disabled={disabled}
        showMap={context !== "fiscal"}
        preferMapPin={preferMapPin && context !== "fiscal"}
        existingAddresses={existingAddresses}
      />
    </div>
  );
}
