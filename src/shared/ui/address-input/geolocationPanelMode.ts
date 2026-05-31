export interface ResolveGeolocationPanelModeInput {
  isOriginStop: boolean;
  /** @deprecated Ya no restringe la UI; se conserva por compatibilidad de llamadas. */
  hasClientPrefill?: boolean;
  /** @deprecated Ya no restringe la UI; se conserva por compatibilidad de llamadas. */
  catalogHasStoredCoordinates?: boolean;
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
  if (input.isOriginStop) {
    return {
      showSearchControls: true,
      showDistanceSection: false,
      distanceEditable: false,
    };
  }

  return {
    showSearchControls: true,
    showDistanceSection: true,
    distanceEditable: true,
  };
}
