import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, MapPin, Navigation } from "lucide-react";
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
import { AddressGeolocationMap } from "./AddressGeolocationMap";

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
  /** Controla visibilidad de la búsqueda manual y selección de candidatos. */
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

  const mapboxToken = config.geolocation.mapboxPublicToken;
  const hasCoordinates = latitude != null && longitude != null;
  const hasPreviousCoordinates =
    previousPoint?.latitude != null && previousPoint?.longitude != null;

  const handleSearch = async () => {
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
      setCandidates(outcome.data.candidates);
      if (outcome.data.candidates.length === 0) {
        setGeocodeError(
          "No se encontraron coincidencias. Ajusta la dirección y vuelve a intentar.",
        );
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSelectCandidate = (candidate: GeocodingCandidate, index: number) => {
    setSelectedCandidateValue(buildGeocodingCandidateValue(candidate, index));
    onCoordinatesChange(candidate.position);
    setGeocodeError(null);
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

  return (
    <div
      className={cn(
        embedded ? "space-y-4" : "space-y-3 rounded-md border p-3",
        className,
      )}
    >
      {embedded ? (
        <p className="text-muted-foreground text-xs">
          Proveedor de mapa:{" "}
          <span className="font-medium text-foreground">
            {providers.providerId.toUpperCase()}
          </span>
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Geolocalizacion</p>
          </div>
          <Badge variant="outline">{providers.providerId.toUpperCase()}</Badge>
        </div>
      )}

      {showSearchControls ? (
        <div className="space-y-2">
          <Label htmlFor="geo-manual-search">Búsqueda en mapa</Label>
          <div className="flex gap-2">
            <Input
              id="geo-manual-search"
              value={manualSearchText}
              onChange={(event) => setManualSearchText(event.target.value)}
              placeholder="Refinar texto de búsqueda (opcional)"
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
      ) : null}

      {showSearchControls && geocodeError ? (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{geocodeError}</AlertDescription>
        </Alert>
      ) : null}

      {showSearchControls && candidates.length > 0 ? (
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
              <SelectValue placeholder="Selecciona una coincidencia para ubicar en el mapa" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {candidates.map((candidate, index) => {
                const value = buildGeocodingCandidateValue(candidate, index);
                return (
                  <SelectItem key={value} value={value} className="items-start py-2">
                    <span className="flex flex-col gap-0.5 text-left">
                      <span className="font-medium leading-snug">{candidate.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {candidate.position.latitude.toFixed(6)},{" "}
                        {candidate.position.longitude.toFixed(6)}
                      </span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="min-w-0 space-y-2">
        <p className="text-xs text-muted-foreground">
          {hasCoordinates
            ? `Ubicación confirmada: ${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`
            : "Haz clic en el mapa para colocar el pin o selecciona un candidato."}
        </p>
        {mapboxToken ? (
          <AddressGeolocationMap
            token={mapboxToken}
            latitude={latitude}
            longitude={longitude}
            onCoordinatesChange={onCoordinatesChange}
            disabled={mapAndCoordsDisabled}
          />
        ) : (
          <Alert variant="info">
            <AlertDescription>
              Configura `VITE_MAPBOX_PUBLIC_TOKEN` para habilitar mapa interactivo.
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
