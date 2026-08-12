import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Navigation,
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
import { AddressGeolocationMap } from "./AddressGeolocationMap";
import {
  GEOLOCATION_UX_STATUS_LABEL,
  resolveGeolocationUxStatus,
  type GeolocationDensity,
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
  density = "comfortable",
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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const mapboxToken = config.geolocation.mapboxPublicToken;
  const hasCoordinates = latitude != null && longitude != null;
  const hasPreviousCoordinates =
    previousPoint?.latitude != null && previousPoint?.longitude != null;

  const uxStatus = resolveGeolocationUxStatus({
    isGeocoding,
    candidateCount: candidates.length,
    selectedCandidateValue,
    hasCoordinates,
  });

  const handleSelectCandidate = (candidate: GeocodingCandidate, index: number) => {
    setSelectedCandidateValue(buildGeocodingCandidateValue(candidate, index));
    onCoordinatesChange(candidate.position);
    setGeocodeError(null);
  };

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
      const nextCandidates = outcome.data.candidates;
      setCandidates(nextCandidates);
      if (nextCandidates.length === 0) {
        setGeocodeError(
          "No se encontraron coincidencias. Revisa el domicilio o usa opciones avanzadas.",
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
    onCoordinatesChange({
      latitude: Number(nextLatitude.toFixed(6)),
      longitude: Number(nextLongitude.toFixed(6)),
    });
  };

  const statusBadgeVariant =
    uxStatus === "confirmed"
      ? "success"
      : uxStatus === "pick" || uxStatus === "searching"
        ? "warning"
        : "neutral";

  return (
    <div
      className={cn(
        embedded ? "space-y-3" : "space-y-3 rounded-md border p-3",
        density === "compact" && "space-y-2.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {uxStatus === "confirmed" ? (
          <CheckCircle2
            className="h-4 w-4 text-success-soft-foreground"
            aria-hidden
          />
        ) : (
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
        <Badge variant={statusBadgeVariant} tone="soft">
          {GEOLOCATION_UX_STATUS_LABEL[uxStatus]}
        </Badge>
      </div>

      {showSearchControls ? (
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
            ) : hasCoordinates ? (
              "Volver a ubicar"
            ) : (
              "Ubicar en el mapa"
            )}
          </Button>
          <p className="text-muted-foreground text-xs">
            Usa el domicilio capturado. Luego puedes ajustar el pin en el mapa.
          </p>
        </div>
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
                    <span className="text-left font-medium leading-snug">
                      {candidate.label}
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
            ? "Puedes arrastrar el pin o hacer clic en el mapa para afinar."
            : "Coloca el pin con «Ubicar en el mapa» o haz clic en el mapa."}
        </p>
        {mapboxToken ? (
          <AddressGeolocationMap
            token={mapboxToken}
            latitude={latitude}
            longitude={longitude}
            onCoordinatesChange={onCoordinatesChange}
            disabled={mapAndCoordsDisabled}
            density={density}
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

      {showSearchControls ? (
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger
            type="button"
            className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted/40"
            disabled={mapAndCoordsDisabled}
          >
            <span className="font-medium">Opciones avanzadas</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                advancedOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="geo-advanced-latitude">Latitud</Label>
                <Input
                  id="geo-advanced-latitude"
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
                <Label htmlFor="geo-advanced-longitude">Longitud</Label>
                <Input
                  id="geo-advanced-longitude"
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
