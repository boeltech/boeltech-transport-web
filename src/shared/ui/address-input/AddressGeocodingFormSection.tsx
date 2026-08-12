import type { ReactNode } from "react";
import type { LatLng } from "@shared/geolocation";
import { FieldInlineError } from "@shared/ui/form";

import { AddressGeolocationPanel } from "./AddressGeolocationPanel";
import type { AddressGeolocationPanelProps } from "./AddressGeolocationPanel";
import type { GeolocationPanelMode } from "./geolocationPanelMode";
import type { GeolocationDensity } from "./geolocationUxStatus";

export const GEOCODING_SECTION_ID = "geographic-confirmation";

export const GEOCODING_OPTIONAL_HINT =
  "Opcional. Usa «Ubicar en el mapa» para confirmar el punto a partir del domicilio.";

export const GEOCODING_REQUIRED_HINT =
  "Usa «Ubicar en el mapa» para confirmar el punto. Es necesario para kilómetros entre paradas y el seguimiento del viaje.";

export type AddressGeocodingPanelAddress = AddressGeolocationPanelProps["address"];

const DEFAULT_CATALOG_PANEL_MODE: GeolocationPanelMode = {
  showSearchControls: true,
  showDistanceSection: false,
  distanceEditable: false,
};

export interface AddressGeocodingSectionTitleProps {
  /** En paradas de viaje la ubicación es obligatoria; en catálogos sigue opcional. */
  required?: boolean;
}

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
  /** Override del hint; por defecto opcional u obligatorio según `required`. */
  required?: boolean;
  hint?: string;
  /** compact en sheets angostos; comfortable en páginas. */
  density?: GeolocationDensity;
}

export function AddressGeocodingSectionTitle({
  required = false,
}: AddressGeocodingSectionTitleProps = {}): ReactNode {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {required ? "Ubicar en el mapa" : "Ubicación en mapa"}
      {!required ? (
        <span className="font-normal text-muted-foreground text-xs">(opcional)</span>
      ) : (
        <span className="font-normal text-muted-foreground text-xs">(requerido)</span>
      )}
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
  required = false,
  hint,
  density = "comfortable",
}: AddressGeocodingSectionContentProps) {
  const resolvedHint =
    hint ?? (required ? GEOCODING_REQUIRED_HINT : GEOCODING_OPTIONAL_HINT);

  return (
    <>
      <p className="text-sm text-muted-foreground">{resolvedHint}</p>
      {latitudeError ? (
        <FieldInlineError fieldId="geolocation-coordinates" message={latitudeError} />
      ) : null}
      <AddressGeolocationPanel
        embedded
        density={density}
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
