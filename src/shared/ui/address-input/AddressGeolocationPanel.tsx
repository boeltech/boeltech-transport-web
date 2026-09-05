import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Navigation,
  Crosshair,
} from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import { config } from "@shared/config";
import {
  createGeoProviderBundle,
  ResolveStopGeolocationUseCase,
  CalculateSegmentDistanceUseCase,
  type DistanceConfidence,
  type DistanceSource,
  type GeocodingCandidate,
  type GeoProviderId,
  type LatLng,
} from "@shared/geolocation";
import { CoordinatesPostalCodeWarningAlert } from "@shared/geolocation/CoordinatesPostalCodeWarningAlert";
import { coordinatesPostalCodeWarningCopy } from "@shared/geolocation/coordinatesPostalCodeWarningCopy";
import { useCoordinatesPostalCodeWarningValues } from "@shared/geolocation/useCoordinatesPostalCodeWarningValues";
import { AddressGeolocationMap, type GeolocationCandidateMarker } from "./AddressGeolocationMap";
import {
  GEOLOCATION_UX_STATUS_LABEL,
  resolveGeolocationUxStatus,
  type GeolocationDensity,
  type GeolocationUxStatus,
} from "./geolocationUxStatus";

export interface AddressGeolocationPanelProps {
  readonly address: {
    readonly locationName?: string | null;
    readonly street?: string | null;
    readonly exteriorNumber?: string | null;
    readonly interiorNumber?: string | null;
    readonly postalCode?: string | null;
    readonly satMunicipalityCode?: string | null;
    readonly satStateCode?: string | null;
    readonly satCountryCode?: string | null;
  };
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly onCoordinatesChange: (coords: LatLng) => void;
  readonly previousPoint?: {
    readonly latitude?: number | null;
    readonly longitude?: number | null;
    readonly label?: string;
  };
  readonly distanceFromPreviousKm?: number | null;
  readonly onDistanceChange?: (distanceKm: number | undefined) => void;
  readonly onDistanceMetaChange?: (meta: {
    source: DistanceSource;
    confidence: DistanceConfidence;
    provider: GeoProviderId;
    computedAt: string;
  }) => void;
  /** Controla visibilidad de la búsqueda / CTA de ubicar. */
  readonly showSearchControls?: boolean;
  /** Controla visibilidad del bloque "Distancia del tramo". */
  readonly showDistanceSection?: boolean;
  /** Permite calcular tramo y mostrar controles accionables de distancia. */
  readonly distanceEditable?: boolean;
  /** Deshabilita mapa, búsqueda y coordenadas (p. ej. catálogo con geo ya guardada). */
  readonly coordinatesDisabled?: boolean;
  /** Deshabilita solo el bloque «Distancia del tramo» (por defecto sigue `disabled`). */
  readonly distanceDisabled?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
  /**
   * Sin borde/card propio: el título vive en la sección padre (`Confirmación Geográfica`).
   */
  readonly embedded?: boolean;
  /** Densidad del mapa: compacta en sheets; cómoda en páginas. */
  readonly density?: GeolocationDensity;
/**
 * LocationSheet confirm step: map + locate CTA only — hide lat/lng / advanced
 * (ADR-0092 product D5). Map always visible (not on-demand).
 */
readonly confirmationMode?: boolean;
  /** Ubicación requerida: mapa siempre visible + chip «Ubicar automáticamente» (D6/D7). */
  readonly required?: boolean;
}

function buildGeocodingCandidateValue(
  candidate: GeocodingCandidate,
  index: number,
): string {
  return `geo-${index}-${candidate.position.latitude.toFixed(6)}-${candidate.position.longitude.toFixed(6)}`;
}

function geocodingCoordsMatch(
  a: LatLng,
  b: LatLng,
  epsilon = 1e-5,
): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < epsilon &&
    Math.abs(a.longitude - b.longitude) < epsilon
  );
}

/** Checks if address has enough data for geocoding (CP 5-digit + non-empty street). */
function hasMinimalAddressData(address: AddressGeolocationPanelProps["address"]): boolean {
  const cp = (address.postalCode ?? "").trim();
  const street = (address.street ?? "").trim();
  return /^\d{5}$/.test(cp) && street.length > 0;
}

function buildMarkerTooltip(address: AddressGeolocationPanelProps["address"]): string | null {
  const parts: string[] = [];
  const cp = (address.postalCode ?? "").trim();
  if (cp) parts.push(`CP ${cp}`);
  const streetParts = [address.street, address.exteriorNumber].filter(Boolean);
  if (streetParts.length > 0) parts.push(streetParts.join(" "));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function resolveStatusBadgeVariant(
  status: GeolocationUxStatus,
): "success" | "warning" | "info" | "neutral" {
  switch (status) {
    case "confirmed":
      return "success";
    case "ready_to_locate":
      return "info";
    case "pending_confirmation":
    case "pick":
    case "searching":
      return "warning";
    case "empty":
    default:
      return "neutral";
  }
}

function resolveStatusIcon(status: GeolocationUxStatus) {
  switch (status) {
    case "confirmed":
      return <CheckCircle2 className="h-4 w-4 text-success-soft-foreground" aria-hidden />;
    case "pending_confirmation":
      return <AlertTriangle className="h-4 w-4 text-warning-soft-foreground" aria-hidden />;
    default:
      return <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />;
  }
}

/** D2: una sola instrucción contextual (prerequisito o ajuste de pin). */
function resolvePanelInstruction(input: {
  confirmationMode: boolean;
  addressReady: boolean;
  hasCoordinates: boolean;
  showMapSurface: boolean;
  uxStatus: GeolocationUxStatus;
}): string | null {
  const { confirmationMode, addressReady, hasCoordinates, showMapSurface, uxStatus } =
    input;

  if (uxStatus === "searching") return null;
  if (uxStatus === "pick") {
    return "Elige una coincidencia en la lista o en el mapa.";
  }
  if (hasCoordinates) {
    return confirmationMode
      ? "Arrastra el pin o haz clic en el mapa para afinar el punto."
      : "Arrastra el pin o haz clic en el mapa para afinar.";
  }
  if (!addressReady) {
    return confirmationMode
      ? "Completa al menos código postal y calle para ubicar."
      : "Completa al menos CP y calle para ubicar con domicilio.";
  }
  if (showMapSurface) {
    return confirmationMode
      ? "Usa «Ubicar con la dirección» o haz clic en el mapa para colocar el pin."
      : "Usa «Ubicar en el mapa» o haz clic en el mapa para colocar el pin.";
  }
  return null;
}

export function AddressGeolocationPanel({
  address,
  latitude,
  longitude,
  onCoordinatesChange,
  previousPoint,
  distanceFromPreviousKm,
  onDistanceChange,
  onDistanceMetaChange,
  showSearchControls = true,
  showDistanceSection,
  distanceEditable = true,
  coordinatesDisabled,
  distanceDisabled,
  disabled = false,
  className,
  embedded = false,
  density = "comfortable",
  confirmationMode = false,
  required = false,
}: AddressGeolocationPanelProps) {
  const mapAndCoordsDisabled = coordinatesDisabled ?? disabled;
  const segmentDistanceDisabled = distanceDisabled ?? disabled;
  const coordinatesPostalCodeWarning = useCoordinatesPostalCodeWarningValues({
    enabled: !mapAndCoordsDisabled,
    postalCode: address.postalCode,
    satCountryCode: address.satCountryCode,
    satStateCode: address.satStateCode,
    satMunicipalityCode: address.satMunicipalityCode,
    latitude,
    longitude,
  });
  const providers = useMemo(() => createGeoProviderBundle(), []);
  const geocodeUseCase = useMemo(
    () => new ResolveStopGeolocationUseCase(providers.geocodingProvider),
    [providers.geocodingProvider],
  );
  const distanceUseCase = useMemo(
    () => new CalculateSegmentDistanceUseCase(providers.distanceMatrixProvider),
    [providers.distanceMatrixProvider],
  );

  const [manualSearchText, setManualSearchText] = useState("");
  const [candidates, setCandidates] = useState<GeocodingCandidate[]>([]);
  const [selectedCandidateValue, setSelectedCandidateValue] = useState("");
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);
  const [distanceMeta, setDistanceMeta] = useState<{
    source: DistanceSource;
    confidence: DistanceConfidence;
    provider: GeoProviderId;
    computedAt: string;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);

  const mapboxToken = config.geolocation.mapboxPublicToken;
  const hasCoordinates = latitude != null && longitude != null;
  const hasPreviousCoordinates =
    previousPoint?.latitude != null && previousPoint?.longitude != null;
  const addressReady = hasMinimalAddressData(address);
  const mapAlwaysVisible = required || confirmationMode;

  const [mapRevealed, setMapRevealed] = useState(
    () => mapAlwaysVisible || hasCoordinates,
  );

  useEffect(() => {
    if (mapAlwaysVisible || hasCoordinates) {
      setMapRevealed(true);
    }
  }, [mapAlwaysVisible, hasCoordinates]);

  const showMapSurface =
    mapAlwaysVisible ||
    mapRevealed ||
    isGeocoding ||
    candidates.length > 0;

  const uxStatus = resolveGeolocationUxStatus({
    isGeocoding,
    candidateCount: candidates.length,
    selectedCandidateValue,
    hasCoordinates,
    hasMinimalAddressData: addressReady,
    hasCpWarning: coordinatesPostalCodeWarning != null,
  });

  // D3: no liderar con «Sin ubicación…» en vacío opcional.
  const showStatusBadge = mapAlwaysVisible || uxStatus !== "empty";

  const panelInstruction = resolvePanelInstruction({
    confirmationMode,
    addressReady,
    hasCoordinates,
    showMapSurface,
    uxStatus,
  });

  const candidateMarkers: GeolocationCandidateMarker[] | undefined = useMemo(() => {
    if (candidates.length <= 1) return undefined;
    return candidates.map((c) => ({
      latitude: c.position.latitude,
      longitude: c.position.longitude,
      label: c.label,
    }));
  }, [candidates]);

  const selectedCandidateIndex: number | null = useMemo(() => {
    if (candidates.length <= 1 || !selectedCandidateValue) return null;
    const idx = candidates.findIndex(
      (c, i) => buildGeocodingCandidateValue(c, i) === selectedCandidateValue,
    );
    return idx >= 0 ? idx : null;
  }, [candidates, selectedCandidateValue]);

  const markerTooltip = useMemo(() => {
    if (!hasCoordinates) return null;
    return buildMarkerTooltip(address);
  }, [address, hasCoordinates]);

  const handleSelectCandidate = (candidate: GeocodingCandidate, index: number) => {
    setSelectedCandidateValue(buildGeocodingCandidateValue(candidate, index));
    setMapRevealed(true);
    onCoordinatesChange(candidate.position);
    setGeocodeError(null);
  };

  const handleSearch = async () => {
    setMapRevealed(true);
    setIsGeocoding(true);
    setGeocodeError(null);
    setSelectedCandidateValue("");
    setCandidates([]);
    try {
      const outcome = await geocodeUseCase.execute(
        {
          ...address,
          locationName: manualSearchText.trim() || address.locationName || "",
        },
        5,
      );
      if (!outcome.ok) {
        setGeocodeError(outcome.error.message);
        return;
      }
      const nextCandidates = outcome.data.candidates;
      setCandidates(nextCandidates);
      if (nextCandidates.length === 0) {
        setGeocodeError(
          "No se encontraron coincidencias. Revisa el domicilio o usa más opciones.",
        );
        return;
      }
      if (nextCandidates.length === 1) {
        handleSelectCandidate(nextCandidates[0], 0);
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (candidates.length === 0) {
      setSelectedCandidateValue("");
      return;
    }
    if (!hasCoordinates) return;

    const current: LatLng = {
      latitude: latitude as number,
      longitude: longitude as number,
    };
    const matchIndex = candidates.findIndex((candidate) =>
      geocodingCoordsMatch(candidate.position, current),
    );
    if (matchIndex >= 0) {
      setSelectedCandidateValue(
        buildGeocodingCandidateValue(candidates[matchIndex], matchIndex),
      );
    } else {
      setSelectedCandidateValue("");
    }
  }, [candidates, hasCoordinates, latitude, longitude]);

  const notifyManualDistanceEdit = () => {
    onDistanceMetaChange?.({
      source: "manual",
      confidence: "medium",
      provider: "stub",
      computedAt: new Date().toISOString(),
    });
  };

  const handleDistanceKmInputChange = (raw: string) => {
    if (!onDistanceChange) return;
    if (raw.trim() === "") {
      onDistanceChange(undefined);
      setDistanceMeta(null);
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n) || n < 0) return;
    onDistanceChange(n);
    notifyManualDistanceEdit();
  };

  const handleDistanceCalculation = async () => {
    if (!hasCoordinates || !hasPreviousCoordinates || !onDistanceChange) return;
    setIsCalculatingDistance(true);
    setDistanceError(null);
    try {
      const outcome = await distanceUseCase.execute({
        origin: {
          latitude: previousPoint.latitude as number,
          longitude: previousPoint.longitude as number,
        },
        destination: {
          latitude: latitude as number,
          longitude: longitude as number,
        },
        profile: "driving",
      });
      if (!outcome.ok) {
        setDistanceError(outcome.error.message);
        return;
      }
      onDistanceChange(outcome.data.distanceKm);
      const meta = {
        source: outcome.data.source,
        confidence: outcome.data.confidence,
        provider: outcome.data.provider,
        computedAt: outcome.data.computedAt,
      };
      setDistanceMeta(meta);
      onDistanceMetaChange?.(meta);
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  const applyManualCoordinate = (
    nextLatitude: number | null,
    nextLongitude: number | null,
  ) => {
    if (nextLatitude == null || nextLongitude == null) return;
    if (
      Number.isNaN(nextLatitude) ||
      Number.isNaN(nextLongitude) ||
      nextLatitude < -90 ||
      nextLatitude > 90 ||
      nextLongitude < -180 ||
      nextLongitude > 180
    ) {
      return;
    }
    setMapRevealed(true);
    onCoordinatesChange({
      latitude: Number(nextLatitude.toFixed(6)),
      longitude: Number(nextLongitude.toFixed(6)),
    });
  };

  const locateLabel = hasCoordinates
    ? confirmationMode
      ? "Ajustar con la dirección"
      : "Reubicar con domicilio"
    : confirmationMode
      ? "Ubicar con la dirección"
      : "Ubicar en el mapa";

  return (
    <div
      className={cn(
        embedded ? "space-y-3" : "space-y-3 rounded-md border p-3",
        density === "compact" && "space-y-2.5",
        className,
      )}
    >
      {showStatusBadge ? (
        <div className="flex flex-wrap items-center gap-2">
          {resolveStatusIcon(uxStatus)}
          <Badge variant={resolveStatusBadgeVariant(uxStatus)} tone="soft">
            {GEOLOCATION_UX_STATUS_LABEL[uxStatus]}
          </Badge>
        </div>
      ) : null}

      {showSearchControls ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={hasCoordinates ? "outline" : "default"}
              onClick={() => void handleSearch()}
              disabled={mapAndCoordsDisabled || isGeocoding}
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando…
                </>
              ) : (
                locateLabel
              )}
            </Button>
            {!showMapSurface && !mapAlwaysVisible ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setMapRevealed(true)}
                disabled={mapAndCoordsDisabled}
              >
                Mostrar mapa
              </Button>
            ) : null}
            {required && addressReady && !hasCoordinates && !isGeocoding ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-xs"
                onClick={() => void handleSearch()}
                disabled={mapAndCoordsDisabled}
              >
                <Crosshair className="mr-1 h-3.5 w-3.5" />
                Ubicar automáticamente
              </Button>
            ) : null}
          </div>
          {panelInstruction ? (
            <p className="text-muted-foreground text-xs">{panelInstruction}</p>
          ) : null}
        </div>
      ) : panelInstruction ? (
        <p className="text-muted-foreground text-xs">{panelInstruction}</p>
      ) : null}

      {showSearchControls && geocodeError ? (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{geocodeError}</AlertDescription>
        </Alert>
      ) : null}

      {showSearchControls && candidates.length > 1 ? (
        <div className="space-y-2">
          <Label htmlFor="geo-candidate-select">Coincidencias sugeridas</Label>
          <Select
            value={selectedCandidateValue || undefined}
            onValueChange={(value) => {
              const index = candidates.findIndex(
                (candidate, idx) =>
                  buildGeocodingCandidateValue(candidate, idx) === value,
              );
              if (index < 0) return;
              handleSelectCandidate(candidates[index], index);
            }}
            disabled={mapAndCoordsDisabled}
          >
            <SelectTrigger id="geo-candidate-select" className="h-auto min-h-9 py-2">
              <SelectValue placeholder="Selecciona una coincidencia" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {candidates.map((candidate, index) => {
                const value = buildGeocodingCandidateValue(candidate, index);
                return (
                  <SelectItem key={value} value={value} className="items-start py-2">
                    <span className="text-left leading-snug">
                      <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium">{candidate.label}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {showMapSurface ? (
        <div className="min-w-0 space-y-2">
          {mapboxToken ? (
            <AddressGeolocationMap
              token={mapboxToken}
              latitude={latitude}
              longitude={longitude}
              onCoordinatesChange={(coords) => {
                setMapRevealed(true);
                // Ajuste manual (drag/clic): salir del modo coincidencias para no
                // reencuadrar el mapa ni volver a «Elige una coincidencia».
                setCandidates([]);
                setSelectedCandidateValue("");
                setGeocodeError(null);
                onCoordinatesChange(coords);
              }}
              disabled={mapAndCoordsDisabled}
              density={density}
              candidates={candidateMarkers}
              selectedCandidateIndex={selectedCandidateIndex}
              onCandidateSelect={(index) => {
                if (candidates[index]) {
                  handleSelectCandidate(candidates[index], index);
                }
              }}
              markerTooltip={markerTooltip}
            />
          ) : (
            <Alert variant="info">
              <AlertDescription>
                Configura `VITE_MAPBOX_PUBLIC_TOKEN` para habilitar el mapa interactivo.
              </AlertDescription>
            </Alert>
          )}
          {coordinatesPostalCodeWarning ? (
            <CoordinatesPostalCodeWarningAlert
              warning={coordinatesPostalCodeWarning}
              copy={coordinatesPostalCodeWarningCopy}
            />
          ) : null}
        </div>
      ) : null}

      {/* D5: escape hatch unificado — oculto en confirmationMode */}
      {showSearchControls && !confirmationMode ? (
        <Collapsible open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
          <CollapsibleTrigger
            type="button"
            className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/40"
            disabled={mapAndCoordsDisabled}
          >
            <span className="font-medium">Más opciones</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                moreOptionsOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="geo-manual-latitude">Latitud</Label>
                <Input
                  id="geo-manual-latitude"
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  inputMode="decimal"
                  disabled={mapAndCoordsDisabled}
                  value={latitude ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    if (raw === "") return;
                    const parsed = Number(raw);
                    if (Number.isNaN(parsed)) return;
                    applyManualCoordinate(parsed, longitude ?? null);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="geo-manual-longitude">Longitud</Label>
                <Input
                  id="geo-manual-longitude"
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  inputMode="decimal"
                  disabled={mapAndCoordsDisabled}
                  value={longitude ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value.trim();
                    if (raw === "") return;
                    const parsed = Number(raw);
                    if (Number.isNaN(parsed)) return;
                    applyManualCoordinate(latitude ?? null, parsed);
                  }}
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              Proveedor: {providers.providerId.toUpperCase()}
            </p>
            <div className="space-y-2">
              <Label htmlFor="geo-manual-search">Refinar búsqueda</Label>
              <div className="flex gap-2">
                <Input
                  id="geo-manual-search"
                  value={manualSearchText}
                  onChange={(event) => setManualSearchText(event.target.value)}
                  placeholder="Texto adicional (opcional)"
                  disabled={mapAndCoordsDisabled}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleSearch()}
                  disabled={mapAndCoordsDisabled || isGeocoding}
                >
                  {isGeocoding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Buscar"
                  )}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      {onDistanceChange && (showDistanceSection ?? true) ? (
        <div className="space-y-2 rounded-md border border-dashed p-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Distancia del tramo</p>
            <span className="text-destructive text-xs">*</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Obligatorio para Carta Porte (excepto origen). Puedes calcular o capturar el km a mano.
          </p>
          {hasPreviousCoordinates ? (
            <p className="text-xs text-muted-foreground">
              Parada previa: {previousPoint?.label || "Parada anterior"}
            </p>
          ) : distanceEditable ? (
            <p className="text-xs text-muted-foreground">
              La parada anterior no tiene coordenadas confirmadas.
            </p>
          ) : null}
          <div className="flex flex-wrap items-end gap-2">
            {distanceEditable ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleDistanceCalculation()}
                disabled={
                  segmentDistanceDisabled ||
                  !distanceEditable ||
                  !hasCoordinates ||
                  !hasPreviousCoordinates ||
                  isCalculatingDistance
                }
              >
                {isCalculatingDistance ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Calcular tramo"
                )}
              </Button>
            ) : null}
            <div className="flex min-w-[6.5rem] flex-col gap-1">
              <Label htmlFor="geo-distance-from-previous-km" className="text-xs">
                Km (tramo)
              </Label>
              <Input
                id="geo-distance-from-previous-km"
                type="number"
                min={0}
                step={0.1}
                placeholder="0"
                disabled={segmentDistanceDisabled || !distanceEditable}
                value={
                  distanceFromPreviousKm != null && !Number.isNaN(distanceFromPreviousKm)
                    ? distanceFromPreviousKm
                    : ""
                }
                onChange={(e) => handleDistanceKmInputChange(e.target.value)}
                className="h-9 w-[7.5rem]"
              />
            </div>
            {distanceMeta ? (
              <Badge variant="outline" className="mb-0.5">
                {distanceMeta.source} / {distanceMeta.confidence}
              </Badge>
            ) : null}
          </div>
          {distanceError ? (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{distanceError}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default AddressGeolocationPanel;
