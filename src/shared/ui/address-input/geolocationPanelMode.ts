export interface ResolveGeolocationPanelModeInput {
  isOriginStop: boolean;
  hasClientPrefill: boolean;
  /** True when the selected client address row already had lat/lng persisted in the catalog (not only filled in-session via geocode). */
  catalogHasStoredCoordinates: boolean;
}

export interface GeolocationPanelMode {
  showSearchControls: boolean;
  showDistanceSection: boolean;
  distanceEditable: boolean;
}

/**
 * Reglas UI del card Geolocalización para el diálogo de paradas (Paso 2 Ruta).
 */
export function resolveGeolocationPanelMode(
  input: ResolveGeolocationPanelModeInput,
): GeolocationPanelMode {
  const { isOriginStop, hasClientPrefill, catalogHasStoredCoordinates } = input;

  if (isOriginStop) {
    if (hasClientPrefill && catalogHasStoredCoordinates) {
      return {
        showSearchControls: false,
        showDistanceSection: false,
        distanceEditable: false,
      };
    }

    return {
      showSearchControls: true,
      showDistanceSection: false,
      distanceEditable: false,
    };
  }

  if (hasClientPrefill && catalogHasStoredCoordinates) {
    return {
      showSearchControls: false,
      showDistanceSection: true,
      distanceEditable: true,
    };
  }

  return {
    showSearchControls: true,
    showDistanceSection: true,
    distanceEditable: true,
  };
}
