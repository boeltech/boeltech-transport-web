/**
 * AddressFields Component
 * Clean Architecture - Presentation Layer
 *
 * Componente compuesto para captura de dirección con catálogos SAT.
 * Maneja la cascada jerárquica: Estado → Municipio → Colonia/Localidad
 *
 * @example
 * <AddressFields
 *   estadoValue={form.watch("estado")}
 *   municipioValue={form.watch("municipio")}
 *   coloniaValue={form.watch("colonia")}
 *   onEstadoChange={(code) => form.setValue("estado", code)}
 *   onMunicipioChange={(code) => form.setValue("municipio", code)}
 *   onColoniaChange={(code) => form.setValue("colonia", code)}
 * />
 */

import { useCallback } from "react";
import { Label } from "@shared/ui/label";
import { EstadoSelect, MunicipioSelect } from "./CatalogSelect";
import { ColoniaSearch } from "./CatalogSearchInput";
import type { CatalogItem } from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

export interface AddressFieldsProps {
  // Valores actuales
  estadoValue?: string;
  municipioValue?: string;
  coloniaValue?: string;
  localidadValue?: string;

  // Callbacks de cambio
  onEstadoChange?: (code: string) => void;
  onMunicipioChange?: (code: string) => void;
  onColoniaChange?: (code: string) => void;
  onLocalidadChange?: (code: string) => void;

  // Callbacks para limpiar campos hijos
  onMunicipioClear?: () => void;
  onColoniaClear?: () => void;
  onLocalidadClear?: () => void;

  // Errores de validación
  estadoError?: string;
  municipioError?: string;
  coloniaError?: string;
  localidadError?: string;

  // Opciones
  disabled?: boolean;
  showLocalidad?: boolean;
  required?: {
    estado?: boolean;
    municipio?: boolean;
    colonia?: boolean;
    localidad?: boolean;
  };
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AddressFields({
  estadoValue,
  municipioValue,
  coloniaValue,
  onEstadoChange,
  onMunicipioChange,
  onColoniaChange,
  onMunicipioClear,
  onColoniaClear,
  onLocalidadClear,
  estadoError,
  municipioError,
  coloniaError,
  localidadError,
  disabled = false,
  showLocalidad = false,
  required = {},
  className,
}: AddressFieldsProps) {
  // ══════════════════════════════════════════════════════════════════════════
  // Cascade Logic: Limpiar campos hijos cuando cambia el padre
  // ══════════════════════════════════════════════════════════════════════════

  // Cuando cambia el estado, limpiar municipio y colonia
  const handleEstadoChange = useCallback(
    (code: string) => {
      onEstadoChange?.(code);
      onMunicipioClear?.();
      onColoniaClear?.();
      onLocalidadClear?.();
    },
    [onEstadoChange, onMunicipioClear, onColoniaClear, onLocalidadClear],
  );

  // Cuando cambia el municipio, limpiar colonia y localidad
  const handleMunicipioChange = useCallback(
    (code: string) => {
      onMunicipioChange?.(code);
      onColoniaClear?.();
      onLocalidadClear?.();
    },
    [onMunicipioChange, onColoniaClear, onLocalidadClear],
  );

  // Cuando se selecciona una colonia
  const handleColoniaSelect = useCallback(
    (item: CatalogItem) => {
      onColoniaChange?.(item.code);
    },
    [onColoniaChange],
  );

  // Cuando se limpia la colonia
  const handleColoniaClear = useCallback(() => {
    onColoniaClear?.();
  }, [onColoniaClear]);

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="estado">
            Estado
            {required.estado && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <EstadoSelect
            value={estadoValue}
            onValueChange={handleEstadoChange}
            disabled={disabled}
            placeholder="Seleccione un estado"
          />
          {estadoError && (
            <p className="text-sm text-destructive">{estadoError}</p>
          )}
        </div>

        {/* Municipio */}
        <div className="space-y-2">
          <Label htmlFor="municipio">
            Municipio
            {required.municipio && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <MunicipioSelect
            estadoCode={estadoValue}
            value={municipioValue}
            onValueChange={handleMunicipioChange}
            disabled={disabled || !estadoValue}
            placeholder={
              estadoValue
                ? "Seleccione un municipio"
                : "Primero seleccione un estado"
            }
          />
          {municipioError && (
            <p className="text-sm text-destructive">{municipioError}</p>
          )}
        </div>

        {/* Colonia */}
        <div className="space-y-2">
          <Label htmlFor="colonia">
            Colonia
            {required.colonia && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <ColoniaSearch
            municipioCode={municipioValue}
            value={coloniaValue}
            onSelect={handleColoniaSelect}
            onClear={handleColoniaClear}
            disabled={disabled || !municipioValue}
            placeholder={
              municipioValue
                ? "Buscar colonia..."
                : "Primero seleccione un municipio"
            }
          />
          {coloniaError && (
            <p className="text-sm text-destructive">{coloniaError}</p>
          )}
        </div>

        {/* Localidad (opcional) */}
        {showLocalidad && (
          <div className="space-y-2">
            <Label htmlFor="localidad">
              Localidad
              {required.localidad && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            {/* Para localidad usarías LocalidadSearch similar a ColoniaSearch */}
            <p className="text-sm text-muted-foreground">
              Implementar LocalidadSearch similar a ColoniaSearch
            </p>
            {localidadError && (
              <p className="text-sm text-destructive">{localidadError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AddressFields;
