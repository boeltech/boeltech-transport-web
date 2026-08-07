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
 * Reglas UI del panel de mapa en el sheet de parada (Paso 2 Ruta).
 * La distancia del tramo vive en el conector del timeline (D3), no en el sheet.
 */
export function resolveGeolocationPanelMode(
  _input: ResolveGeolocationPanelModeInput,
): GeolocationPanelMode {
  void _input;
  return {
    showSearchControls: true,
    showDistanceSection: false,
    distanceEditable: false,
  };
}
