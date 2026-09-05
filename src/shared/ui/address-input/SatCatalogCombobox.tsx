import { useMemo, useState, type MouseEvent } from "react";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { getFieldErrorAriaProps } from "@shared/ui/form";
import { satCatalogComboboxCopy } from "./satCatalogComboboxCopy";
import { resolveCatalogCode } from "./satCatalogCodeUtils";

export type SatCatalogOption = {
  code: string;
  name: string;
};

const FREE_TEXT_ITEM_VALUE = "__free_text__";

export type SatCatalogComboboxProps = {
  id: string;
  options: SatCatalogOption[];
  /** Selected SAT code (may be short or composite; matched via options). */
  value: string;
  onValueChange: (code: string) => void;
  /**
   * Name shown on the trigger when there is no catalog match for `value`
   * (free-text / persisted name).
   */
  displayName?: string;
  /** Enable «Usar "{query}" como texto libre» when the query has no exact name match. */
  allowFreeText?: boolean;
  onFreeTextSelect?: (name: string) => void;
  /** Show a clear control when there is a catalog or free-text value. */
  allowClear?: boolean;
  onClear?: () => void;
  freeTextLabel?: (query: string) => string;
  emptyNoCatalogText?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
  "aria-label"?: string;
  /** Optional CP to disambiguate short codes when resolving `value`. */
  postalCode?: string | null;
};

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase();
}

function matchesOption(option: SatCatalogOption, query: string): boolean {
  if (!query) return true;
  const q = normalizeForMatch(query);
  return (
    normalizeForMatch(option.name).includes(q) ||
    normalizeForMatch(option.code).includes(q)
  );
}

function hasExactNameMatch(options: SatCatalogOption[], query: string): boolean {
  const q = normalizeForMatch(query);
  if (!q) return false;
  return options.some((option) => normalizeForMatch(option.name) === q);
}

/**
 * Sync searchable combobox for SAT catalog rows already loaded in memory
 * (e.g. colonias/localidades by postal code). Optional free-text commit.
 * No network on keystroke.
 */
export function SatCatalogCombobox({
  id,
  options,
  value,
  onValueChange,
  displayName = "",
  allowFreeText = false,
  onFreeTextSelect,
  allowClear = false,
  onClear,
  freeTextLabel = satCatalogComboboxCopy.useAsFreeText,
  emptyNoCatalogText = satCatalogComboboxCopy.emptyNoCatalog,
  placeholder = "Selecciona…",
  searchPlaceholder = satCatalogComboboxCopy.searchPlaceholder,
  emptyText = satCatalogComboboxCopy.empty,
  disabled = false,
  loading = false,
  error = false,
  errorMessage,
  className,
  "aria-label": ariaLabel,
  postalCode = null,
}: SatCatalogComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selected = useMemo(() => {
    const normalized = value.trim();
    if (!normalized) return null;
    const resolved = resolveCatalogCode(normalized, options, postalCode);
    const exact = options.find(
      (option) => option.code.toUpperCase() === resolved.toUpperCase(),
    );
    return exact ?? null;
  }, [options, postalCode, value]);

  const filtered = useMemo(
    () => options.filter((option) => matchesOption(option, searchQuery)),
    [options, searchQuery],
  );

  const trimmedQuery = searchQuery.trim();
  const showFreeText =
    allowFreeText &&
    Boolean(onFreeTextSelect) &&
    trimmedQuery.length > 0 &&
    !hasExactNameMatch(options, trimmedQuery);

  const trimmedDisplayName = displayName.trim();
  // Prefer catalog name only when resolved uniquely; otherwise keep persisted/free-text name.
  const triggerLabel = selected?.name
    ? selected.name
    : trimmedDisplayName
      ? trimmedDisplayName
      : placeholder;

  const hasValue = Boolean(selected || trimmedDisplayName || value.trim());

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSearchQuery("");
  };

  const handleSelect = (code: string) => {
    onValueChange(code === selected?.code ? "" : code);
    setOpen(false);
    setSearchQuery("");
  };

  const handleFreeText = () => {
    if (!onFreeTextSelect || !trimmedQuery) return;
    onFreeTextSelect(trimmedQuery);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onClear?.();
    setSearchQuery("");
  };

  const emptyMessage =
    options.length === 0 ? emptyNoCatalogText : emptyText;

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            disabled={disabled || loading}
            className={cn(
              "w-full justify-between font-normal text-left",
              !selected && !trimmedDisplayName && "text-muted-foreground",
              error && "border-destructive",
              className,
            )}
            {...getFieldErrorAriaProps(id, errorMessage)}
          >
            <span className="truncate">
              {loading ? satCatalogComboboxCopy.loading : triggerLabel}
            </span>
            {loading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {filtered.length === 0 && !showFreeText ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                  </div>
                </CommandEmpty>
              ) : null}

              {filtered.length > 0 ? (
                <CommandGroup>
                  {filtered.map((option) => {
                    const isSelected = option.code === selected?.code;
                    return (
                      <CommandItem
                        key={option.code}
                        value={`${option.code} ${option.name}`}
                        onSelect={() => handleSelect(option.code)}
                        className="flex items-center gap-2"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{option.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null}

              {showFreeText ? (
                <CommandGroup>
                  <CommandItem
                    value={FREE_TEXT_ITEM_VALUE}
                    onSelect={handleFreeText}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{freeTextLabel(trimmedQuery)}</span>
                  </CommandItem>
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {allowClear && hasValue && onClear && !disabled && !loading ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={handleClear}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {satCatalogComboboxCopy.clear}
        </Button>
      ) : null}
    </div>
  );
}
