/**
 * AddressPicker — selector de precarga cross-owner (ADR-0053).
 * Lee catálogo vía GET /addresses/search; no edita la fuente.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { isValidSatRfc } from "@boeltech/cfdi-domain";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  MapPin,
  X,
} from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { useDebounce } from "@shared/hooks/use-debounce";
import { Badge } from "@shared/ui/badge/badge";
import { Button } from "@shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { Label } from "@shared/ui/label";

import { searchAddresses } from "./addressSearchApi";
import { ADDRESS_PICKER_COPY } from "./addressPickerCopy";
import {
  SEARCHABLE_OWNER_TYPES,
  type AddressSearchAddressType,
  type AddressSearchListItem,
  type SearchableOwnerType,
} from "./types";
import { useAddressSearch } from "./useAddressSearch";

// ============================================================================
// Types
// ============================================================================

export interface AddressPickerProps {
  value?: AddressSearchListItem | null;
  onSelect: (item: AddressSearchListItem) => void;
  onClear?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  /** Filtro opcional de fuentes (default: todas las searchables). */
  defaultOwnerTypes?: SearchableOwnerType[];
  addressType?: AddressSearchAddressType;
  onlyGeolocated?: boolean;
  limit?: number;
  debounceMs?: number;
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function formatItemLabel(item: AddressSearchListItem): string {
  const name = item.locationName?.trim();
  if (name) return name;
  const street = [item.street, item.exteriorNumber].filter(Boolean).join(" ");
  if (street && item.postalCode) return `${street}, CP ${item.postalCode}`;
  return street || item.postalCode || item.id;
}

function formatItemDescription(item: AddressSearchListItem): string {
  const owner = item.ownerLabel?.trim();
  const parts = [
    owner || undefined,
    item.neighborhoodName?.trim() || undefined,
  ].filter(Boolean);
  return parts.join(" · ");
}

function hasRemitenteRfc(item: AddressSearchListItem): boolean {
  return Boolean(item.remitenteRfc?.trim());
}

function hasValidRemitenteRfc(item: AddressSearchListItem): boolean {
  const rfc = item.remitenteRfc?.trim();
  return Boolean(rfc && isValidSatRfc(rfc));
}

function groupItemsByOwner(
  items: AddressSearchListItem[],
): Record<SearchableOwnerType, AddressSearchListItem[]> {
  const groups: Record<SearchableOwnerType, AddressSearchListItem[]> = {
    client: [],
    tenant: [],
  };
  for (const item of items) {
    if (groups[item.ownerType]) {
      groups[item.ownerType].push(item);
    }
  }
  return groups;
}

// ============================================================================
// Component
// ============================================================================

export function AddressPicker({
  value,
  onSelect,
  onClear,
  label,
  placeholder = ADDRESS_PICKER_COPY.placeholder,
  disabled = false,
  error,
  defaultOwnerTypes,
  addressType,
  onlyGeolocated,
  limit = 20,
  debounceMs = 300,
  className,
}: AddressPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, debounceMs);
  const [allItems, setAllItems] = useState<AddressSearchListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const ownerTypes = defaultOwnerTypes ?? [...SEARCHABLE_OWNER_TYPES];

  const searchParams = useMemo(
    () => ({
      q: debouncedQuery,
      ownerTypes,
      addressType,
      onlyGeolocated,
      limit,
    }),
    [debouncedQuery, ownerTypes, addressType, onlyGeolocated, limit],
  );

  const { data, isFetching, isError } = useAddressSearch({
    params: searchParams,
    enabled: open,
  });

  useEffect(() => {
    if (!data) return;
    setAllItems(data.data);
    setNextCursor(data.pagination.nextCursor);
    setHasMore(data.pagination.hasMore);
  }, [data]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const grouped = useMemo(() => groupItemsByOwner(allItems), [allItems]);

  const handleSelect = useCallback(
    (item: AddressSearchListItem) => {
      onSelect(item);
      setOpen(false);
    },
    [onSelect],
  );

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = await searchAddresses({
        ...searchParams,
        cursor: nextCursor,
      });
      setAllItems((prev) => [...prev, ...nextPage.data]);
      setNextCursor(nextPage.pagination.nextCursor);
      setHasMore(nextPage.pagination.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, searchParams]);

  const queryReady = debouncedQuery.trim().length >= 2;
  const triggerLabel = value ? formatItemLabel(value) : placeholder;

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <Label>{label}</Label> : null}

      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label={ADDRESS_PICKER_COPY.aria.combobox}
              disabled={disabled}
              className={cn(
                "min-w-0 flex-1 justify-between font-normal",
                !value && "text-muted-foreground",
                error && "border-destructive",
              )}
            >
              <span className="truncate">{triggerLabel}</span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={placeholder}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {!queryReady ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {ADDRESS_PICKER_COPY.searchHint}
                  </div>
                ) : isFetching && allItems.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {ADDRESS_PICKER_COPY.loading}
                  </div>
                ) : isError ? (
                  <CommandEmpty>Error al buscar direcciones</CommandEmpty>
                ) : allItems.length === 0 ? (
                  <CommandEmpty>{ADDRESS_PICKER_COPY.emptyResults}</CommandEmpty>
                ) : (
                  <>
                    {SEARCHABLE_OWNER_TYPES.map((ownerType) => {
                      const items = grouped[ownerType];
                      if (items.length === 0) return null;
                      return (
                        <CommandGroup
                          key={ownerType}
                          heading={ADDRESS_PICKER_COPY.groups[ownerType]}
                        >
                          {items.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.id}
                              onSelect={() => handleSelect(item)}
                              className="flex flex-col items-start gap-1 py-2"
                            >
                              <div className="flex w-full items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <Check
                                      className={cn(
                                        "size-4 shrink-0",
                                        value?.id === item.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <span className="truncate font-medium">
                                      {formatItemLabel(item)}
                                    </span>
                                  </div>
                                  {formatItemDescription(item) ? (
                                    <p className="ml-6 truncate text-xs text-muted-foreground">
                                      {formatItemDescription(item)}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                                  {item.latitude != null && item.longitude != null ? (
                                    <MapPin
                                      className="size-3.5 text-muted-foreground"
                                      aria-label={ADDRESS_PICKER_COPY.geolocated}
                                    />
                                  ) : null}
                                  {item.isCartaPorteReady ? (
                                    <Badge
                                      variant="success"
                                      tone="soft"
                                      className="text-[10px]"
                                      aria-label={ADDRESS_PICKER_COPY.domicilioCpReady}
                                    >
                                      {ADDRESS_PICKER_COPY.domicilioCpReady}
                                    </Badge>
                                  ) : null}
                                  {hasValidRemitenteRfc(item) ? (
                                    <Badge
                                      variant="success"
                                      tone="soft"
                                      className="text-[10px]"
                                      aria-label={ADDRESS_PICKER_COPY.remitenteRfcReady}
                                    >
                                      {ADDRESS_PICKER_COPY.remitenteRfcReady}
                                    </Badge>
                                  ) : null}
                                  {item.isCartaPorteReady && !hasRemitenteRfc(item) ? (
                                    <Badge
                                      variant="warning"
                                      tone="soft"
                                      className="text-[10px]"
                                      title={ADDRESS_PICKER_COPY.remitenteRfcMissingTitle}
                                      aria-label={ADDRESS_PICKER_COPY.remitenteRfcMissing}
                                    >
                                      {ADDRESS_PICKER_COPY.remitenteRfcMissing}
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      );
                    })}
                    {hasMore ? (
                      <div className="border-t p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          disabled={loadingMore}
                          onClick={() => void handleLoadMore()}
                        >
                          {loadingMore ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : null}
                          {ADDRESS_PICKER_COPY.loadMore}
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {value && onClear ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={ADDRESS_PICKER_COPY.aria.clear}
            disabled={disabled}
            onClick={onClear}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
