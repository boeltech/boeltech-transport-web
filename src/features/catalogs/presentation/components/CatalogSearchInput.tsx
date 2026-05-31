/**
 * CatalogSearchInput Component
 * Clean Architecture - Presentation Layer
 *
 * Componente de búsqueda con autocomplete para catálogos SAT grandes.
 * Usa full-text search con debounce.
 *
 * @example
 * <CatalogSearchInput
 *   typeCode="sat_clave_prod_serv_cp"
 *   value={field.value}
 *   onSelect={(item) => field.onChange(item.code)}
 *   placeholder="Buscar producto o servicio..."
 * />
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useDebounce } from "@shared/hooks/use-debounce";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { Skeleton } from "@shared/ui/skeleton";
import { Search, X, Check, Loader2 } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { useCatalogSearch, useCatalogItem } from "../../application/hooks";
import type { CatalogItem, CatalogTypeCodeValue } from "../../domain";

/**
 * En Sheet/Dialog: la lista consume el scroll; en los extremos se evita que la rueda mueva el fondo.
 * Solo aplica preventDefault si hay overflow; con pocos ítems no hay scroll y React usa listener pasivo.
 */
export function handleCatalogResultsListWheel(
  el: HTMLElement,
  e: WheelEvent,
): void {
  e.stopPropagation();
  const { scrollTop, scrollHeight, clientHeight } = el;
  if (scrollHeight <= clientHeight + 1) {
    return;
  }
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
  if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
    e.preventDefault();
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface CatalogSearchInputProps {
  /**
   * Código del tipo de catálogo
   */
  typeCode: CatalogTypeCodeValue;
  /**
   * Valor seleccionado (código del item)
   */
  value?: string | null;
  /**
   * Callback cuando se selecciona un item
   */
  onSelect?: (item: CatalogItem) => void;
  /**
   * Callback cuando se limpia la selección
   */
  onClear?: () => void;
  /**
   * Código del padre para filtrar (catálogos jerárquicos)
   */
  parentCode?: string;
  /**
   * Placeholder del input
   */
  placeholder?: string;
  /**
   * Si está deshabilitado
   */
  disabled?: boolean;
  /**
   * Clases CSS adicionales
   */
  className?: string;
  /**
   * Límite de resultados
   */
  limit?: number;
  /**
   * Tiempo de debounce en ms
   */
  debounceMs?: number;
  /**
   * Mostrar código junto al nombre en resultados
   */
  showCode?: boolean;
  /**
   * Formato de display para el valor seleccionado
   */
  displayFormat?: "name" | "code" | "code-name" | "name-code";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CatalogSearchInput({
  typeCode,
  value,
  onSelect,
  onClear,
  parentCode,
  placeholder = "Buscar...",
  disabled = false,
  className,
  limit = 20,
  debounceMs = 300,
  showCode = true,
  displayFormat = "code-name",
}: CatalogSearchInputProps) {
  // ══════════════════════════════════════════════════════════════════════════
  // State
  // ══════════════════════════════════════════════════════════════════════════

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, debounceMs);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = commandListRef.current;
    if (!el || !open) return;

    const onWheel = (e: WheelEvent) => {
      handleCatalogResultsListWheel(el, e);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open]);

  // ══════════════════════════════════════════════════════════════════════════
  // Data Fetching
  // ══════════════════════════════════════════════════════════════════════════

  // Buscar mientras escribe
  const { data: searchResult, isLoading: isSearching } = useCatalogSearch(
    typeCode,
    {
      query: debouncedSearch,
      parentCode,
      limit,
      includeInactive: debouncedSearch.length >= 2,
    },
  );

  // Cargar item seleccionado (para mostrar nombre)
  const { data: selectedItem, isLoading: isLoadingSelected } = useCatalogItem(
    typeCode,
    value ?? undefined,
  );

  // ══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ══════════════════════════════════════════════════════════════════════════

  const handleSelect = useCallback(
    (item: CatalogItem) => {
      onSelect?.(item);
      setSearchTerm("");
      setOpen(false);
    },
    [onSelect],
  );

  const handleClear = useCallback(() => {
    onClear?.();
    setSearchTerm("");
  }, [onClear]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      if (!open && e.target.value.length >= 2) {
        setOpen(true);
      }
    },
    [open],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════════════════════

  const formatDisplay = (code: string, name: string): string => {
    switch (displayFormat) {
      case "code":
        return code;
      case "name":
        return name;
      case "name-code":
        return `${name} (${code})`;
      case "code-name":
      default:
        return `${code} - ${name}`;
    }
  };

  const getDisplayValue = (): string => {
    if (selectedItem) {
      return formatDisplay(selectedItem.code, selectedItem.name);
    }
    if (value) {
      return value; // Mostrar código mientras carga
    }
    return "";
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  // Si hay valor seleccionado, mostrar en modo display
  if (value && !open) {
    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          {isLoadingSelected ? (
            <Skeleton className="h-4 w-3/4" />
          ) : (
            <span className="truncate">{getDisplayValue()}</span>
          )}
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-9 pr-9"
            onFocus={() => {
              if (searchTerm.length >= 2) {
                setOpen(true);
              }
            }}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="z-[100] w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <CommandList ref={commandListRef}>
            {debouncedSearch.length < 2 ? (
              <CommandEmpty>
                Escriba al menos 2 caracteres para buscar
              </CommandEmpty>
            ) : isSearching ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !searchResult?.items.length ? (
              <CommandEmpty>No se encontraron resultados</CommandEmpty>
            ) : (
              <CommandGroup
                heading={`${searchResult.total} resultado${searchResult.total !== 1 ? "s" : ""}`}
              >
                {searchResult.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.code}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {showCode ? `${item.code} - ${item.name}` : item.name}
                      </span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </span>
                      )}
                    </div>
                    {value === item.code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// SPECIALIZED SEARCH INPUTS
// ============================================================================

/**
 * Búsqueda de productos/servicios Carta Porte
 */
export type ProductoServicioCPSearchProps = Omit<
  CatalogSearchInputProps,
  "typeCode"
>;

export function ProductoServicioCPSearch(props: ProductoServicioCPSearchProps) {
  return (
    <CatalogSearchInput
      typeCode={"sat_clave_prod_serv_cp" as CatalogTypeCodeValue}
      placeholder="Buscar producto o servicio (código o nombre)..."
      {...props}
    />
  );
}

/**
 * Búsqueda de unidades de medida SAT
 */
export type UnidadMedidaSearchProps = Omit<CatalogSearchInputProps, "typeCode">;

export function UnidadMedidaSearch(props: UnidadMedidaSearchProps) {
  return (
    <CatalogSearchInput
      typeCode={"sat_clave_unidad" as CatalogTypeCodeValue}
      placeholder="Buscar unidad de medida..."
      {...props}
    />
  );
}

/**
 * Búsqueda de materiales peligrosos
 */
export type MaterialPeligrosoSearchProps = Omit<
  CatalogSearchInputProps,
  "typeCode"
>;

export function MaterialPeligrosoSearch(props: MaterialPeligrosoSearchProps) {
  return (
    <CatalogSearchInput
      typeCode={"sat_material_peligroso" as CatalogTypeCodeValue}
      placeholder="Buscar material peligroso..."
      {...props}
    />
  );
}

/**
 * Búsqueda de colonias (requiere municipioCode)
 */
export interface ColoniaSearchProps extends Omit<
  CatalogSearchInputProps,
  "typeCode"
> {
  municipioCode?: string;
}

export function ColoniaSearch({ municipioCode, ...props }: ColoniaSearchProps) {
  return (
    <CatalogSearchInput
      typeCode={"sat_colonia" as CatalogTypeCodeValue}
      parentCode={municipioCode}
      placeholder="Buscar colonia..."
      disabled={!municipioCode || props.disabled}
      showCode={false}
      displayFormat="name"
      {...props}
    />
  );
}

/**
 * Búsqueda de localidades (requiere municipioCode)
 */
export interface LocalidadSearchProps extends Omit<
  CatalogSearchInputProps,
  "typeCode"
> {
  municipioCode?: string;
}

export function LocalidadSearch({
  municipioCode,
  ...props
}: LocalidadSearchProps) {
  return (
    <CatalogSearchInput
      typeCode={"sat_localidad" as CatalogTypeCodeValue}
      parentCode={municipioCode}
      placeholder="Buscar localidad..."
      disabled={!municipioCode || props.disabled}
      showCode={false}
      displayFormat="name"
      {...props}
    />
  );
}

export default CatalogSearchInput;
