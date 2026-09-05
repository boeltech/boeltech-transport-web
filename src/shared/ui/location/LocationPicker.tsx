/**
 * LocationPicker — Popover + Command fused search (ADR-0092).
 */

import { useMemo, useState } from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";

import { resolveMapboxToSat } from "@shared/geolocation/addressResolver";
import type { LatLng } from "@shared/geolocation/contracts/geoPorts";
import { useDebounce } from "@shared/hooks/use-debounce";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { FieldInlineError } from "@shared/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { Label } from "@shared/ui/label";
import type {
  AddressSearchAddressType,
  SearchableOwnerType,
} from "@shared/ui/address-picker/types";

import { LOCATION_FIELD_COPY } from "./locationFieldCopy";
import { LocationSearchResultRow } from "./LocationSearchResult";
import {
  LOCATION_CREATE_SENTINEL_ID,
  locationValueFromInternal,
  locationValueFromMapbox,
} from "./locationSearchCompositor";
import type { LocationSearchResult, LocationValue } from "./LocationField.types";
import {
  MAPBOX_MIN_QUERY_LENGTH,
  useLocationSearch,
} from "./useLocationSearch";

export interface LocationCreateRequestOptions {
  preferMapPin?: boolean;
}

export interface LocationPickerProps {
  onSelect: (value: LocationValue) => void;
  onCreateRequest?: (opts?: LocationCreateRequestOptions) => void;
  clientId?: string | null;
  ownerTypes?: SearchableOwnerType[];
  addressType?: AddressSearchAddressType;
  onlyGeolocated?: boolean;
  /** Client-side filter for internal hits. */
  filterItem?: (item: import("@shared/ui/address-picker/types").AddressSearchListItem) => boolean;
  /**
   * When false, omit catalog hits (create-only). Default true.
   */
  includeInternal?: boolean;
  /** Bias Mapbox toward an existing pin / branch / fiscal coords. */
  proximity?: LatLng | null;
  label?: string;
  /** Accessible name for the combobox trigger. */
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  debounceMs?: number;
  className?: string;
  id?: string;
  /** Controlled open state (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LocationPicker({
  onSelect,
  onCreateRequest,
  clientId,
  ownerTypes,
  addressType,
  onlyGeolocated,
  filterItem,
  includeInternal = true,
  proximity = null,
  label,
  ariaLabel,
  placeholder = LOCATION_FIELD_COPY.searchPlaceholder,
  disabled = false,
  error,
  debounceMs = 400,
  className,
  id,
  open: openControlled,
  onOpenChange,
}: LocationPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openControlled ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [searchQuery, setSearchQuery] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  const {
    results,
    isLoading,
    internalError,
    mapboxError,
    searchConfidence,
  } = useLocationSearch({
    q: debouncedQuery,
    enabled: open && !disabled,
    clientId,
    ownerTypes,
    addressType,
    onlyGeolocated,
    includeInternal,
    proximity,
  });

  const busy = isLoading || isResolving;
  const lowConfidence = searchConfidence === "low";
  const hasFullSearchError = includeInternal
    ? Boolean(internalError && mapboxError)
    : Boolean(mapboxError);
  const hasPartialSearchError = includeInternal
    ? Boolean((internalError || mapboxError) && !hasFullSearchError)
    : false;

  const visibleResults = useMemo(() => {
    if (!filterItem) return results;
    return results.filter(
      (r) =>
        r.source !== "internal" ||
        (r.internal != null && filterItem(r.internal)),
    );
  }, [results, filterItem]);

  const grouped = useMemo(() => {
    const internal: LocationSearchResult[] = [];
    const mapbox: LocationSearchResult[] = [];
    const create: LocationSearchResult[] = [];
    for (const r of visibleResults) {
      if (r.source === "internal") internal.push(r);
      else if (r.source === "mapbox") mapbox.push(r);
      else create.push(r);
    }
    return { internal, mapbox, create };
  }, [visibleResults]);

  const hasHits =
    grouped.internal.length > 0 ||
    grouped.mapbox.length > 0 ||
    grouped.create.length > 0;

  const idleCopy = includeInternal
    ? LOCATION_FIELD_COPY.searchIdle
    : LOCATION_FIELD_COPY.searchIdleCreateOnly;
  const partialErrorCopy = includeInternal
    ? LOCATION_FIELD_COPY.searchPartialError
    : LOCATION_FIELD_COPY.searchPartialErrorCreateOnly;

  const emptyMessage = (() => {
    if (busy) return LOCATION_FIELD_COPY.searchLoading;
    if (hasFullSearchError) return LOCATION_FIELD_COPY.searchError;
    if (!searchQuery.trim()) return idleCopy;
    if (
      searchQuery.trim().length < MAPBOX_MIN_QUERY_LENGTH &&
      grouped.internal.length === 0 &&
      grouped.create.length === 0
    ) {
      return idleCopy;
    }
    return LOCATION_FIELD_COPY.searchEmpty;
  })();

  const handleSelect = (result: LocationSearchResult) => {
    if (result.source === "create" || result.id === LOCATION_CREATE_SENTINEL_ID) {
      setOpen(false);
      onCreateRequest?.({ preferMapPin: lowConfidence });
      return;
    }
    if (result.source === "internal" && result.internal) {
      onSelect(locationValueFromInternal(result.internal));
      setOpen(false);
      return;
    }
    if (result.source === "mapbox" && result.mapbox) {
      const candidate = result.mapbox;
      void (async () => {
        setIsResolving(true);
        try {
          const resolved = await resolveMapboxToSat({
            label: candidate.label,
            position: candidate.position,
            postalCode: candidate.postalCode,
            region: candidate.region,
            place: candidate.place,
            district: candidate.district,
            neighborhood: candidate.neighborhood,
          });
          const ambiguities = resolved.ambiguities;
          const hasAmbiguity = ambiguities.length > 0;
          const conflictState =
            ambiguities.includes("state") || ambiguities.includes("postalCode");
          const conflictMunicipality =
            ambiguities.includes("municipality") ||
            ambiguities.includes("postalCode");
          const conflictNeighborhood = ambiguities.includes("neighborhood");
          const conflictLocality = ambiguities.includes("locality");

          onSelect(
            locationValueFromMapbox(candidate, {
              postalCode:
                resolved.resolved.postalCode ?? candidate.postalCode ?? null,
              satStateCode: conflictState
                ? null
                : (resolved.resolved.satStateCode ?? null),
              satMunicipalityCode: conflictMunicipality
                ? null
                : (resolved.resolved.satMunicipalityCode ?? null),
              satNeighborhoodCode: conflictNeighborhood
                ? null
                : (resolved.resolved.satNeighborhoodCode ?? null),
              neighborhoodName: conflictNeighborhood
                ? null
                : (resolved.resolved.neighborhoodName ?? null),
              localityName: conflictLocality
                ? null
                : (resolved.resolved.localityName ?? null),
              satLocalityCode: conflictLocality
                ? null
                : (resolved.resolved.satLocalityCode ?? null),
              latitude:
                resolved.resolved.latitude ?? candidate.position.latitude,
              longitude:
                resolved.resolved.longitude ?? candidate.position.longitude,
              // Mapbox forward geocode is never "exact" (ADR-0092 H6).
              geocodingAccuracy: "approximate",
              satCountryCode: "MEX",
              satAmbiguities: hasAmbiguity ? ambiguities : undefined,
            }),
          );
          setOpen(false);
        } catch {
          onSelect(
            locationValueFromMapbox(candidate, {
              satAmbiguities: ["postalCode"],
            }),
          );
          setOpen(false);
        } finally {
          setIsResolving(false);
        }
      })();
    }
  };

  const comboboxLabel =
    ariaLabel ?? label ?? LOCATION_FIELD_COPY.searchLabel;
  const errorId = id ? `${id}-error` : "location-picker-error";

  const createHeading = lowConfidence
    ? LOCATION_FIELD_COPY.groupCreateRecommended
    : LOCATION_FIELD_COPY.groupCreate;

  const createGroup =
    grouped.create.length > 0 ? (
      <CommandGroup heading={createHeading}>
        {grouped.create.map((result) => (
          <CommandItem
            key={result.id}
            value={result.id}
            onSelect={() => handleSelect(result)}
          >
            <LocationSearchResultRow result={result} />
          </CommandItem>
        ))}
      </CommandGroup>
    ) : null;

  const mapboxGroup =
    grouped.mapbox.length > 0 ? (
      <CommandGroup heading={LOCATION_FIELD_COPY.groupMapbox}>
        {grouped.mapbox.map((result) => (
          <CommandItem
            key={result.id}
            value={result.id}
            onSelect={() => handleSelect(result)}
          >
            <LocationSearchResultRow result={result} />
          </CommandItem>
        ))}
      </CommandGroup>
    ) : null;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={comboboxLabel}
            aria-invalid={error ? true : undefined}
            aria-errormessage={error ? errorId : undefined}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              error && "border-destructive",
            )}
          >
            <span className="truncate text-muted-foreground">{placeholder}</span>
            {busy ? (
              <Loader2
                className="ml-2 size-4 shrink-0 animate-spin opacity-50"
                aria-hidden
              />
            ) : (
              <ChevronsUpDown
                className="ml-2 size-4 shrink-0 opacity-50"
                aria-hidden
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              aria-label={comboboxLabel}
            />
            <CommandList>
              {!hasHits ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : null}

              {hasPartialSearchError && hasHits ? (
                <p
                  className="border-b border-border px-3 py-2 text-xs text-muted-foreground"
                  role="status"
                >
                  {partialErrorCopy}
                </p>
              ) : null}

              {lowConfidence && hasHits ? (
                <p
                  className="border-b border-border px-3 py-2 text-xs text-muted-foreground"
                  role="status"
                  data-testid="location-search-low-confidence"
                >
                  {LOCATION_FIELD_COPY.lowConfidenceBanner}
                </p>
              ) : null}

              {grouped.internal.length > 0 ? (
                <CommandGroup heading={LOCATION_FIELD_COPY.groupInternal}>
                  {grouped.internal.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.id}
                      onSelect={() => handleSelect(result)}
                    >
                      <LocationSearchResultRow result={result} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}

              {lowConfidence ? (
                <>
                  {createGroup}
                  {mapboxGroup}
                </>
              ) : (
                <>
                  {mapboxGroup}
                  {createGroup}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FieldInlineError fieldId={id ?? "location-picker"} message={error} />
    </div>
  );
}
