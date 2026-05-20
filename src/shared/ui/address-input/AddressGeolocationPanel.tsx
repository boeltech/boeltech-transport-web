import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, MapPin, Navigation } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
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
  readonly disabled?: boolean;
  readonly className?: string;
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
  disabled = false,
  className,
}: AddressGeolocationPanelProps) {
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
          "No se encontraron coincidencias. Ajusta la direccion y vuelve a intentar.",
        );
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSelectCandidate = (candidate: GeocodingCandidate) => {
    onCoordinatesChange(candidate.position);
    setGeocodeError(null);
  };

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
    <div className={cn("space-y-3 rounded-md border p-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium">Geolocalizacion</p>
        </div>
        <Badge variant="outline">{providers.providerId.toUpperCase()}</Badge>
      </div>

      {showSearchControls ? (
        <div className="space-y-2">
          <Label htmlFor="geo-manual-search">Busqueda en mapa</Label>
          <div className="flex gap-2">
            <Input
              id="geo-manual-search"
              value={manualSearchText}
              onChange={(event) => setManualSearchText(event.target.value)}
              placeholder="Refinar texto de busqueda (opcional)"
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSearch()}
              disabled={disabled || isGeocoding}
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
          <p className="text-xs font-medium text-muted-foreground">
            Coincidencias sugeridas
          </p>
          <div className="space-y-2">
            {candidates.map((candidate) => (
              <button
                key={`${candidate.label}-${candidate.position.latitude}-${candidate.position.longitude}`}
                type="button"
                className="w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => handleSelectCandidate(candidate)}
                disabled={disabled}
              >
                <p className="font-medium">{candidate.label}</p>
                <p className="text-xs text-muted-foreground">
                  {candidate.position.latitude.toFixed(6)},{" "}
                  {candidate.position.longitude.toFixed(6)}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {hasCoordinates
            ? `Ubicacion confirmada: ${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`
            : "Haz clic en el mapa para colocar el pin o selecciona un candidato."}
        </p>
        {mapboxToken ? (
          <AddressGeolocationMap
            token={mapboxToken}
            latitude={latitude}
            longitude={longitude}
            onCoordinatesChange={onCoordinatesChange}
            disabled={disabled}
          />
        ) : (
          <Alert variant="info">
            <AlertDescription>
              Configura `VITE_MAPBOX_PUBLIC_TOKEN` para habilitar mapa interactivo.
            </AlertDescription>
          </Alert>
        )}
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
                  disabled ||
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
                disabled={disabled || !distanceEditable}
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
