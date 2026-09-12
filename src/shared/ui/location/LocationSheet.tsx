/**
 * LocationSheet — confirm step (ADR-0092): name → address → map pin.
 * SAT refinement stays in AddressInput under LocationField (outside this sheet).
 */

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";

import { resolveMapboxToSat } from "@shared/geolocation/addressResolver";
import type { LatLng } from "@shared/geolocation/contracts/geoPorts";
import { useDebounce } from "@shared/hooks";
import {
  detectPossibleDuplicates,
  type DuplicateCandidate,
  type DuplicateWarning,
} from "@shared/location/detectPossibleDuplicates";
import { cn } from "@shared/lib/utils/cn";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";

import { LOCATION_FIELD_COPY } from "./locationFieldCopy";
import type {
  AmbiguityField,
  LocationContext,
  LocationValue,
} from "./LocationField.types";

/** D3: evita parpadeo del resolve SAT al tipar en el sheet. */
const SAT_RESOLVE_DEBOUNCE_MS = 350;

/** Mínimo para habilitar Usar: solo nombre, o umbral tripStop (ADR-0092). */
export type LocationSheetRequirements = "name" | "tripStop";

function requirementsForContext(
  context: LocationContext | undefined,
): LocationSheetRequirements {
  return context === "tripStop" ? "tripStop" : "name";
}

const AddressGeolocationPanel = lazy(
  () => import("@shared/ui/address-input/AddressGeolocationPanel"),
);

const EMPTY_EXISTING_ADDRESSES: readonly DuplicateCandidate[] = [];

export interface LocationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: LocationValue | null;
  onSave: (value: LocationValue) => void;
  title?: string;
  showMap?: boolean;
  /**
   * When true (low Mapbox confidence create), surface map/pin guidance
   * and scroll the map section into view (ADR-0092 SQ-D6).
   */
  preferMapPin?: boolean;
  /**
   * Completeness gate for Usar. Defaults from `context` when provided
   * (`tripStop` → coords + CP + name).
   */
  requirements?: LocationSheetRequirements;
  /** Prefer this over bare `requirements` when set (LocationField passes context). */
  context?: LocationContext;
  disabled?: boolean;
  className?: string;
  /** Optional catalog for non-blocking duplicate warnings (D8). */
  existingAddresses?: readonly DuplicateCandidate[];
}

type AutoSatSnapshot = {
  satStateCode: string | null;
  satMunicipalityCode: string | null;
  neighborhoodName: string | null;
  satNeighborhoodCode: string | null;
};

function sameNullable(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? null) === (b ?? null);
}

function canAutoWrite(
  current: string | null,
  lastAuto: string | null | undefined,
): boolean {
  if (current == null || current === "") return true;
  if (lastAuto === undefined) return false;
  return sameNullable(current, lastAuto);
}

export function LocationSheet({
  open,
  onOpenChange,
  value = null,
  onSave,
  title = LOCATION_FIELD_COPY.sheetTitle,
  showMap = true,
  preferMapPin = false,
  requirements: requirementsProp,
  context,
  disabled = false,
  className,
  existingAddresses = EMPTY_EXISTING_ADDRESSES,
}: LocationSheetProps) {
  const requirements =
    requirementsProp ?? requirementsForContext(context);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const lastAutoSatRef = useRef<Partial<AutoSatSnapshot>>({});
  const satFieldsRef = useRef({
    satStateCode: null as string | null,
    satMunicipalityCode: null as string | null,
    neighborhoodName: null as string | null,
    satNeighborhoodCode: null as string | null,
  });
  const [locationName, setLocationName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [street, setStreet] = useState("");
  const [exteriorNumber, setExteriorNumber] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [satStateCode, setSatStateCode] = useState<string | null>(null);
  const [satMunicipalityCode, setSatMunicipalityCode] = useState<string | null>(
    null,
  );
  const [neighborhoodName, setNeighborhoodName] = useState<string | null>(null);
  const [satNeighborhoodCode, setSatNeighborhoodCode] = useState<string | null>(
    null,
  );
  const [isResolving, setIsResolving] = useState(false);
  const [satAmbiguities, setSatAmbiguities] = useState<AmbiguityField[]>([]);
  const [geocodingAccuracy, setGeocodingAccuracy] = useState<
    LocationValue["geocodingAccuracy"]
  >(null);
  const [duplicateWarnings, setDuplicateWarnings] = useState<
    DuplicateWarning[]
  >([]);
  const hasAmbiguity = satAmbiguities.length > 0;

  satFieldsRef.current = {
    satStateCode,
    satMunicipalityCode,
    neighborhoodName,
    satNeighborhoodCode,
  };

  const debouncedLocationName = useDebounce(locationName, SAT_RESOLVE_DEBOUNCE_MS);
  const debouncedPostalCode = useDebounce(postalCode, SAT_RESOLVE_DEBOUNCE_MS);
  const debouncedStreet = useDebounce(street, SAT_RESOLVE_DEBOUNCE_MS);
  const debouncedExteriorNumber = useDebounce(
    exteriorNumber,
    SAT_RESOLVE_DEBOUNCE_MS,
  );
  const debouncedLatitude = useDebounce(latitude, SAT_RESOLVE_DEBOUNCE_MS);
  const debouncedLongitude = useDebounce(longitude, SAT_RESOLVE_DEBOUNCE_MS);

  useEffect(() => {
    if (!open) return;
    setLocationName(value?.locationName ?? "");
    setPostalCode(value?.postalCode ?? "");
    setStreet(value?.street ?? "");
    setExteriorNumber(value?.exteriorNumber ?? "");
    setLatitude(value?.latitude ?? null);
    setLongitude(value?.longitude ?? null);
    setSatStateCode(value?.satStateCode ?? null);
    setSatMunicipalityCode(value?.satMunicipalityCode ?? null);
    setNeighborhoodName(value?.neighborhoodName ?? null);
    setSatNeighborhoodCode(value?.satNeighborhoodCode ?? null);
    setGeocodingAccuracy(value?.geocodingAccuracy ?? null);
    // Prefill is user/catalog data — do not treat as auto-written until resolve fills.
    lastAutoSatRef.current = {};
    setSatAmbiguities(value?.satAmbiguities ? [...value.satAmbiguities] : []);
    setDuplicateWarnings([]);
    setIsResolving(false);
    const t = window.setTimeout(() => {
      if (preferMapPin && showMap && mapSectionRef.current) {
        mapSectionRef.current.scrollIntoView({ block: "nearest" });
      } else {
        nameInputRef.current?.focus();
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, value, preferMapPin, showMap]);

  useEffect(() => {
    if (!open || !/^\d{5}$/.test(debouncedPostalCode.trim())) {
      setIsResolving(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setIsResolving(true);
      try {
        const hasCoords =
          debouncedLatitude != null &&
          debouncedLongitude != null &&
          Number.isFinite(debouncedLatitude) &&
          Number.isFinite(debouncedLongitude);
        const result = await resolveMapboxToSat({
          label: [
            debouncedStreet,
            debouncedExteriorNumber,
            debouncedPostalCode,
            debouncedLocationName,
          ]
            .filter(Boolean)
            .join(" "),
          postalCode: debouncedPostalCode.trim(),
          position: hasCoords
            ? { latitude: debouncedLatitude, longitude: debouncedLongitude }
            : null,
        });
        if (cancelled) return;

        const {
          satStateCode: currentState,
          satMunicipalityCode: currentMunicipality,
          neighborhoodName: currentNeighborhoodName,
          satNeighborhoodCode: currentNeighborhoodCode,
        } = satFieldsRef.current;
        const prevAuto = lastAutoSatRef.current;
        const nextAuto: Partial<AutoSatSnapshot> = { ...prevAuto };

        let nextState = currentState;
        if (
          result.resolved.satStateCode &&
          !result.ambiguities.includes("state") &&
          !result.ambiguities.includes("postalCode") &&
          canAutoWrite(currentState, prevAuto.satStateCode)
        ) {
          nextState = result.resolved.satStateCode;
          nextAuto.satStateCode = nextState;
        }

        let nextMunicipality = currentMunicipality;
        if (
          result.resolved.satMunicipalityCode &&
          !result.ambiguities.includes("municipality") &&
          !result.ambiguities.includes("postalCode") &&
          canAutoWrite(currentMunicipality, prevAuto.satMunicipalityCode)
        ) {
          nextMunicipality = result.resolved.satMunicipalityCode;
          nextAuto.satMunicipalityCode = nextMunicipality;
        }

        let nextNeighborhoodName = currentNeighborhoodName;
        if (
          result.resolved.neighborhoodName &&
          !result.ambiguities.includes("neighborhood") &&
          canAutoWrite(currentNeighborhoodName, prevAuto.neighborhoodName)
        ) {
          nextNeighborhoodName = result.resolved.neighborhoodName;
          nextAuto.neighborhoodName = nextNeighborhoodName;
        }

        let nextNeighborhoodCode = currentNeighborhoodCode;
        if (
          result.resolved.satNeighborhoodCode &&
          !result.ambiguities.includes("neighborhood") &&
          canAutoWrite(currentNeighborhoodCode, prevAuto.satNeighborhoodCode)
        ) {
          nextNeighborhoodCode = result.resolved.satNeighborhoodCode;
          nextAuto.satNeighborhoodCode = nextNeighborhoodCode;
        }

        lastAutoSatRef.current = nextAuto;
        setSatStateCode(nextState);
        setSatMunicipalityCode(nextMunicipality);
        setNeighborhoodName(nextNeighborhoodName);
        setSatNeighborhoodCode(nextNeighborhoodCode);
        const mergedAmbiguities: AmbiguityField[] =
          result.ambiguities.length > 0
            ? result.ambiguities
            : (value?.satAmbiguities ?? []);
        setSatAmbiguities([...mergedAmbiguities]);
      } catch {
        if (!cancelled) {
          setSatAmbiguities(["postalCode"]);
        }
      } finally {
        if (!cancelled) setIsResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    debouncedPostalCode,
    debouncedStreet,
    debouncedExteriorNumber,
    debouncedLocationName,
    debouncedLatitude,
    debouncedLongitude,
    value?.satAmbiguities,
  ]);

  useEffect(() => {
    if (!open || existingAddresses.length === 0) {
      setDuplicateWarnings([]);
      return;
    }
    setDuplicateWarnings(
      detectPossibleDuplicates(
        {
          postalCode,
          street,
          exteriorNumber,
          latitude,
          longitude,
          id: value?.sourceAddressId,
        },
        existingAddresses,
      ),
    );
  }, [
    open,
    existingAddresses,
    postalCode,
    street,
    exteriorNumber,
    latitude,
    longitude,
    value?.sourceAddressId,
  ]);

  const handleCoordinatesChange = (coords: LatLng) => {
    setLatitude(coords.latitude);
    setLongitude(coords.longitude);
    // User-moved pin → manual (ADR-0092 H6).
    setGeocodingAccuracy("manual");
  };

  const handleSave = () => {
    if (isResolving) return;
    onSave({
      ...value,
      locationName: locationName.trim() || null,
      postalCode: postalCode.trim() || null,
      street: street.trim() || null,
      exteriorNumber: exteriorNumber.trim() || null,
      satStateCode,
      satMunicipalityCode,
      neighborhoodName,
      satNeighborhoodCode,
      latitude,
      longitude,
      geolocationPending: latitude == null || longitude == null,
      geocodingAccuracy:
        latitude != null && longitude != null
          ? geocodingAccuracy === "approximate" ||
            geocodingAccuracy === "exact" ||
            geocodingAccuracy === "manual"
            ? geocodingAccuracy
            : "manual"
          : "address_only",
      satCountryCode: value?.satCountryCode ?? "MEX",
      satAmbiguities: satAmbiguities.length > 0 ? [...satAmbiguities] : undefined,
    });
    onOpenChange(false);
  };

  const hasTripStopCoords =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  const canSaveByRequirements =
    requirements === "tripStop"
      ? Boolean(
          locationName.trim() &&
            /^\d{5}$/.test(postalCode.trim()) &&
            hasTripStopCoords,
        )
      : Boolean(locationName.trim());
  const saveDisabled = disabled || isResolving || !canSaveByRequirements;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl md:max-w-2xl",
          className,
        )}
      >
        <SheetHeader className="shrink-0 space-y-1 border-b px-6 py-4 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {LOCATION_FIELD_COPY.sheetDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Zone 1 — identity */}
          <div className="space-y-1.5">
            <Label htmlFor="location-sheet-name">
              {LOCATION_FIELD_COPY.nameLabel}
            </Label>
            <Input
              ref={nameInputRef}
              id="location-sheet-name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder={LOCATION_FIELD_COPY.namePlaceholder}
              disabled={disabled}
              autoComplete="off"
            />
          </div>

          {/* Zone 2 — address essentials + status SAT (sin hueco space-y-6 vacío) */}
          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="location-sheet-street">
                  {LOCATION_FIELD_COPY.streetLabel}
                </Label>
                <Input
                  id="location-sheet-street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={disabled}
                  autoComplete="street-address"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location-sheet-ext">
                  {LOCATION_FIELD_COPY.exteriorNumberLabel}
                </Label>
                <Input
                  id="location-sheet-ext"
                  value={exteriorNumber}
                  onChange={(e) => setExteriorNumber(e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location-sheet-cp">
                  {LOCATION_FIELD_COPY.postalCodeLabel}
                </Label>
                <Input
                  id="location-sheet-cp"
                  value={postalCode}
                  onChange={(e) =>
                    setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))
                  }
                  placeholder={LOCATION_FIELD_COPY.postalCodePlaceholder}
                  inputMode="numeric"
                  disabled={disabled}
                  autoComplete="postal-code"
                />
              </div>
            </div>

            {/* D2: altura reservada dentro del bloque de domicilio — no sibling de space-y-6 */}
            <div
              className="flex min-h-5 items-start"
              role="status"
              aria-live="polite"
              data-testid="location-sheet-sat-status"
            >
              {isResolving ? (
                <p className="text-xs text-muted-foreground">
                  {LOCATION_FIELD_COPY.resolvingSat}
                </p>
              ) : neighborhoodName?.trim() && !hasAmbiguity ? (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {LOCATION_FIELD_COPY.resolvedNeighborhood}:{" "}
                  </span>
                  {neighborhoodName.trim()}
                </p>
              ) : null}
            </div>
          </div>

          {/* D4: ambigüedad gana sobre tip de pin */}
          {preferMapPin && showMap && !hasAmbiguity ? (
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {LOCATION_FIELD_COPY.lowConfidenceSheetHint}
              </AlertDescription>
            </Alert>
          ) : null}

          {hasAmbiguity ? (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {LOCATION_FIELD_COPY.ambiguityHint}
              </AlertDescription>
            </Alert>
          ) : null}

          {duplicateWarnings.length > 0 ? (
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription className="space-y-1">
                <p className="font-medium">
                  {LOCATION_FIELD_COPY.duplicateWarningTitle}
                </p>
                <p className="text-xs">
                  {LOCATION_FIELD_COPY.duplicateWarningBody}
                </p>
                <ul className="list-disc pl-4 text-xs">
                  {duplicateWarnings.map((w, i) => (
                    <li key={`${w.reason}-${w.candidateId ?? i}`}>{w.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {/* Zone 3 — map hero */}
          {showMap ? (
            <div
              ref={mapSectionRef}
              className="space-y-3"
              data-testid="location-sheet-map-section"
            >
              <p className="text-base font-semibold text-foreground">
                {LOCATION_FIELD_COPY.mapSection}
              </p>
              <Suspense
                fallback={
                  <p className="text-xs text-muted-foreground" role="status">
                    {LOCATION_FIELD_COPY.searchLoading}
                  </p>
                }
              >
                {/* key fuerza mapa fresco al abrir: evita canvas Mapbox roto tras transform del Sheet */}
                <AddressGeolocationPanel
                  key={open ? "location-sheet-map-open" : "location-sheet-map-closed"}
                  embedded
                  density="comfortable"
                  confirmationMode
                  address={{
                    locationName,
                    street,
                    exteriorNumber,
                    postalCode,
                    satStateCode: satStateCode ?? undefined,
                    satMunicipalityCode: satMunicipalityCode ?? undefined,
                    satCountryCode: value?.satCountryCode ?? "MEX",
                  }}
                  latitude={latitude}
                  longitude={longitude}
                  onCoordinatesChange={handleCoordinatesChange}
                  showDistanceSection={false}
                  disabled={disabled}
                />
              </Suspense>
            </div>
          ) : null}
        </div>

        <SheetFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:justify-end">
          {requirements === "tripStop" && !canSaveByRequirements ? (
            <p className="mr-auto text-xs text-muted-foreground sm:max-w-[14rem]">
              {LOCATION_FIELD_COPY.tripStopUseHint}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={disabled}
          >
            {LOCATION_FIELD_COPY.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveDisabled}
          >
            {LOCATION_FIELD_COPY.save}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
