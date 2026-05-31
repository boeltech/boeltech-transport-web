import type { ReactNode } from "react";
import type { LatLng } from "@shared/geolocation";
import { FieldInlineError } from "@shared/ui/form";

import { AddressGeolocationPanel } from "./AddressGeolocationPanel";
import type { AddressGeolocationPanelProps } from "./AddressGeolocationPanel";
import type { GeolocationPanelMode } from "./geolocationPanelMode";

export const GEOCODING_SECTION_ID = "geographic-confirmation";

export const GEOCODING_OPTIONAL_HINT =
  "Opcional. Confirma en el mapa o con latitud y longitud para ubicar el punto con precisión en rutas y seguimiento.";

export type AddressGeocodingPanelAddress = AddressGeolocationPanelProps["address"];

const DEFAULT_CATALOG_PANEL_MODE: GeolocationPanelMode = {
  showSearchControls: true,
  showDistanceSection: false,
  distanceEditable: false,
};

export interface AddressGeocodingSectionContentProps {
  address: AddressGeocodingPanelAddress;
  latitude?: number | null;
  longitude?: number | null;
  onCoordinatesChange: (coords: LatLng) => void;
  disabled?: boolean;
  coordinatesDisabled?: boolean;
  distanceDisabled?: boolean;
  latitudeError?: string | null;
  panelMode?: GeolocationPanelMode;
  previousPoint?: AddressGeolocationPanelProps["previousPoint"];
  distanceFromPreviousKm?: number | null;
  onDistanceChange?: AddressGeolocationPanelProps["onDistanceChange"];
  onDistanceMetaChange?: AddressGeolocationPanelProps["onDistanceMetaChange"];
}

export function AddressGeocodingSectionTitle(): ReactNode {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      Ubicación en mapa
      <span className="font-normal text-muted-foreground text-xs">(opcional)</span>
    </span>
  );
}

export function AddressGeocodingSectionContent({
  address,
  latitude,
  longitude,
  onCoordinatesChange,
  disabled = false,
  coordinatesDisabled,
  distanceDisabled,
  latitudeError,
  panelMode = DEFAULT_CATALOG_PANEL_MODE,
  previousPoint,
  distanceFromPreviousKm,
  onDistanceChange,
  onDistanceMetaChange,
}: AddressGeocodingSectionContentProps) {
  return (
    <>
      <p className="text-sm text-muted-foreground">{GEOCODING_OPTIONAL_HINT}</p>
      {latitudeError ? (
        <FieldInlineError fieldId="geolocation-coordinates" message={latitudeError} />
      ) : null}
      <AddressGeolocationPanel
        embedded
        address={address}
        latitude={latitude}
        longitude={longitude}
        onCoordinatesChange={onCoordinatesChange}
        previousPoint={previousPoint}
        distanceFromPreviousKm={distanceFromPreviousKm}
        onDistanceChange={onDistanceChange}
        onDistanceMetaChange={onDistanceMetaChange}
        showSearchControls={panelMode.showSearchControls}
        showDistanceSection={panelMode.showDistanceSection}
        distanceEditable={panelMode.distanceEditable}
        disabled={disabled}
        coordinatesDisabled={coordinatesDisabled}
        distanceDisabled={distanceDisabled}
      />
    </>
  );
}
