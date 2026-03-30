/**
 * Geographic Catalog Selects (Large Catalogs - Server-Side Search)
 * Clean Architecture - Presentation Layer
 *
 * Componentes Combobox especializados para catálogos geográficos SAT
 * MUY grandes que requieren búsqueda del lado del servidor.
 *
 * Estos complementan a CatalogSelect.tsx que maneja catálogos pequeños/medianos.
 * - CatalogSelect.tsx: sat_estado (32), sat_municipio (~2,500), sat_tipo_permiso, etc.
 * - GeographicSelects.tsx: sat_localidad (~45,000), sat_colonia (~145,000), sat_codigo_postal (~32,000)
 *
 * Catálogos incluidos:
 * - sat_localidad (~45,000 - filtrado por estado, requiere búsqueda)
 * - sat_colonia (~145,000 - filtrado por código postal)
 * - sat_codigo_postal (~32,000 - con búsqueda)
 *
 * Ubicación: src/features/catalogs/presentation/components/GeographicSelects.tsx
 */

import { forwardRef, useState, useCallback, useMemo, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { Button } from "@shared/ui/button";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import {
  useCatalogSearch,
  useCatalogOptions,
  useCatalogItem,
} from "../../application/hooks";
import type { CatalogTypeCodeValue } from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

interface BaseComboboxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  displayFormat?: "name" | "code" | "code-name" | "name-code";
}

// ============================================================================
// HELPER: Format Option
// ============================================================================

function formatOption(
  code: string,
  name: string,
  format: BaseComboboxProps["displayFormat"] = "name",
): string {
  switch (format) {
    case "code":
      return code;
    case "code-name":
      return `${code} - ${name}`;
    case "name-code":
      return `${name} (${code})`;
    case "name":
    default:
      return name;
  }
}

// ============================================================================
// LOCALIDAD COMBOBOX (~45,000 items)
// Filtrado por estado (parentCode)
// ============================================================================

export interface LocalidadComboboxProps extends BaseComboboxProps {
  estadoCode?: string;
}

const LocalidadCombobox = forwardRef<HTMLButtonElement, LocalidadComboboxProps>(
  (
    {
      value,
      onValueChange,
      estadoCode,
      placeholder = "Seleccione una localidad (opcional)",
      disabled = false,
      className,
      displayFormat = "name",
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const isDisabled = disabled || !estadoCode;

    const { data: searchResult, isLoading } = useCatalogSearch(
      "sat_localidad" as CatalogTypeCodeValue,
      {
        query: searchQuery || "",
        parentCode: estadoCode,
        limit: 50,
        includeInactive: !isDisabled && open && searchQuery.length >= 2,
      },
    );

    const { data: selectedItem } = useCatalogItem(
      "sat_localidad" as CatalogTypeCodeValue,
      value,
    );

    const options = searchResult?.items || [];

    const handleSelect = useCallback(
      (selectedCode: string) => {
        onValueChange?.(selectedCode);
        setOpen(false);
        setSearchQuery("");
      },
      [onValueChange],
    );

    useEffect(() => {
      if (!open) {
        setSearchQuery("");
      }
    }, [open]);

    if (isDisabled) {
      return (
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between font-normal", className)}
          disabled
        >
          <span className="text-muted-foreground">
            {!estadoCode ? "Seleccione primero un estado" : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className="truncate">
              {selectedItem
                ? formatOption(
                    selectedItem.code,
                    selectedItem.name,
                    displayFormat,
                  )
                : value
                  ? value
                  : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar localidad (mín. 2 caracteres)..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Buscando...
                  </span>
                </div>
              ) : searchQuery.length < 2 ? (
                <CommandEmpty>Escriba al menos 2 caracteres</CommandEmpty>
              ) : options.length === 0 ? (
                <CommandEmpty>No se encontraron localidades</CommandEmpty>
              ) : (
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.code}
                      value={option.code}
                      onSelect={() => handleSelect(option.code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.code ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {formatOption(option.code, option.name, displayFormat)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
LocalidadCombobox.displayName = "LocalidadCombobox";

// ============================================================================
// COLONIA COMBOBOX (~145,000 items total, pero filtrado por CP es pequeño)
// Filtrado por código postal (parentCode)
// ============================================================================

export interface ColoniaComboboxProps extends BaseComboboxProps {
  codigoPostal?: string;
}

const ColoniaCombobox = forwardRef<HTMLButtonElement, ColoniaComboboxProps>(
  (
    {
      value,
      onValueChange,
      codigoPostal,
      placeholder = "Seleccione una colonia (opcional)",
      disabled = false,
      className,
      displayFormat = "name",
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);

    const isDisabled = disabled || !codigoPostal;

    // Para colonias, cargamos todas las del CP (generalmente <50)
    const { data: options = [], isLoading } = useCatalogOptions(
      "sat_colonia" as CatalogTypeCodeValue,
      {
        parentCode: codigoPostal,
        enabled: !isDisabled,
      },
    );

    const selectedOption = useMemo(() => {
      if (!value || !options.length) return null;
      return options.find((opt) => opt.code === value);
    }, [value, options]);

    const handleSelect = useCallback(
      (selectedCode: string) => {
        onValueChange?.(selectedCode);
        setOpen(false);
      },
      [onValueChange],
    );

    if (isDisabled) {
      return (
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between font-normal", className)}
          disabled
        >
          <span className="text-muted-foreground">
            {!codigoPostal ? "Ingrese primero el código postal" : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      );
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className="truncate">
              {selectedOption
                ? formatOption(
                    selectedOption.code,
                    selectedOption.name,
                    displayFormat,
                  )
                : value
                  ? value
                  : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar colonia..." />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Cargando...
                  </span>
                </div>
              ) : options.length === 0 ? (
                <CommandEmpty>No hay colonias para este CP</CommandEmpty>
              ) : (
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.code}
                      value={`${option.code} ${option.name}`}
                      onSelect={() => handleSelect(option.code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.code ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {formatOption(option.code, option.name, displayFormat)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
ColoniaCombobox.displayName = "ColoniaCombobox";

// ============================================================================
// CÓDIGO POSTAL COMBOBOX (~32,000 items - Búsqueda obligatoria)
// Opcionalmente filtrado por estado
// ============================================================================

export interface CodigoPostalComboboxProps extends BaseComboboxProps {
  estadoCode?: string;
}

const CodigoPostalCombobox = forwardRef<
  HTMLButtonElement,
  CodigoPostalComboboxProps
>(
  (
    {
      value,
      onValueChange,
      estadoCode,
      placeholder = "Buscar código postal...",
      disabled = false,
      className,
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: searchResult, isLoading } = useCatalogSearch(
      "sat_codigo_postal" as CatalogTypeCodeValue,
      {
        query: searchQuery,
        parentCode: estadoCode,
        limit: 20,
        includeInactive: !disabled && open && searchQuery.length >= 3,
      },
    );

    const options = searchResult?.items || [];

    const handleSelect = useCallback(
      (selectedCode: string) => {
        onValueChange?.(selectedCode);
        setOpen(false);
        setSearchQuery("");
      },
      [onValueChange],
    );

    // Permitir entrada manual del CP
    const handleInputKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && searchQuery.length === 5) {
          // Validar que sea un CP válido (5 dígitos)
          if (/^\d{5}$/.test(searchQuery)) {
            onValueChange?.(searchQuery);
            setOpen(false);
            setSearchQuery("");
          }
        }
      },
      [searchQuery, onValueChange],
    );

    useEffect(() => {
      if (!open) {
        setSearchQuery("");
      }
    }, [open]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", className)}
            disabled={disabled}
          >
            {value || placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Escriba el CP (5 dígitos)..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={handleInputKeyDown}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">
                    Buscando...
                  </span>
                </div>
              ) : searchQuery.length < 3 ? (
                <CommandEmpty>Escriba al menos 3 dígitos</CommandEmpty>
              ) : options.length === 0 ? (
                <CommandEmpty>
                  <div className="space-y-2 text-center">
                    <p>No se encontró el código postal</p>
                    {/^\d{5}$/.test(searchQuery) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelect(searchQuery)}
                      >
                        Usar "{searchQuery}"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.code}
                      value={option.code}
                      onSelect={() => handleSelect(option.code)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.code ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="font-mono">{option.code}</span>
                      <span className="ml-2 text-muted-foreground text-sm truncate">
                        {option.name}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
CodigoPostalCombobox.displayName = "CodigoPostalCombobox";

// ============================================================================
// EXPORT ALL
// ============================================================================

export { LocalidadCombobox, ColoniaCombobox, CodigoPostalCombobox };
