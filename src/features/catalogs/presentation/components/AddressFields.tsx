/**
 * AddressFields Component
 * Clean Architecture - Presentation Layer
 *
 * Componente unificado para captura de campos geográficos SAT (Carta Porte 3.1).
 * Punto único de control para: Estado → Municipio | CP → Colonia | Localidad.
 *
 * COMPOUND CODES:
 * Los catálogos SAT devuelven códigos compuestos (ej. "AGU-001", "12345-0001").
 * Este componente maneja internamente la reconstrucción para los value props
 * y el split al recibir cambios. El padre siempre recibe/guarda códigos cortos.
 *
 * CASCADE INTERNO:
 * - Estado cambia → limpia municipio + localidad
 * - CP cambia → limpia colonia
 *
 * @example
 * // Con estado local (StopFormDialog, etc.)
 * <AddressFields
 *   values={{ estadoCode, municipioCode, postalCode, coloniaCode, localidadCode }}
 *   onChange={(changes) => setFormData(prev => ({ ...prev, ...mapToFormFields(changes) }))}
 *   required={{ estado: true, municipio: true, postalCode: true }}
 *   displayFormat="code-name"
 *   showLocalidadHint
 * />
 *
 * // Con React Hook Form (ClientAddressForm, etc.)
 * <AddressFields
 *   values={{ estadoCode: watch("satEstadoCode"), ... }}
 *   onChange={(changes) => {
 *     if (changes.estadoCode !== undefined) setValue("satEstadoCode", changes.estadoCode, { shouldValidate: true });
 *     // ...
 *   }}
 *   errors={{ estado: errors.satEstadoCode?.message, ... }}
 * />
 *
 * Ubicación: src/features/catalogs/presentation/components/AddressFields.tsx
 */

import { useCallback, useEffect, useRef } from "react";
import { Label } from "@shared/ui/label";
import { cn } from "@shared/lib/utils/cn";
import { EstadoSelect, MunicipioSelect } from "./CatalogSelect";
import {
  CodigoPostalCombobox,
  ColoniaCombobox,
  LocalidadCombobox,
} from "./GeographicSelects";
import { useCatalogOptions } from "../../application/hooks";
import type { CatalogTypeCodeValue } from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

/** Valores de dirección SAT. Siempre códigos cortos (sin prefijo de estado/CP). */
export interface SatAddressValues {
  estadoCode?: string;
  municipioCode?: string; // corto: "001" (no "AGU-001")
  municipioName?: string; // nombre del municipio del catálogo SAT
  postalCode?: string;
  coloniaCode?: string;   // corto: "0001" (no "12345-0001")
  coloniaName?: string;   // nombre/descripción de la colonia del catálogo SAT
  localidadCode?: string; // corto: "01"   (no "AGU-01")
}

export interface AddressFieldsErrors {
  estado?: string;
  municipio?: string;
  postalCode?: string;
  colonia?: string;
  localidad?: string;
}

export interface AddressFieldsRequired {
  estado?: boolean;
  municipio?: boolean;
  postalCode?: boolean;
  colonia?: boolean;
  localidad?: boolean;
}

export interface AddressFieldsProps {
  values: SatAddressValues;
  /**
   * Callback con los cambios a aplicar. Incluye cascade clearing:
   * - Al cambiar estado: también incluye { municipioCode: "", localidadCode: "" }
   * - Al cambiar CP: también incluye { coloniaCode: "" }
   */
  onChange: (changes: Partial<SatAddressValues>) => void;
  errors?: AddressFieldsErrors;
  required?: AddressFieldsRequired;
  disabled?: boolean;
  /** Formato de display para los selects de catálogo */
  displayFormat?: "name" | "code" | "code-name" | "name-code";
  /** Muestra el hint "solo para zonas rurales" bajo Localidad */
  showLocalidadHint?: boolean;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Extrae el código corto de un código compuesto SAT (ej. "AGU-001" → "001") */
function splitCompound(code: string): string {
  return code.includes("-") ? code.split("-")[1] : code;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AddressFields({
  values,
  onChange,
  errors,
  required,
  disabled = false,
  displayFormat,
  showLocalidadHint = false,
  className,
}: AddressFieldsProps) {
  const {
    estadoCode = "",
    municipioCode = "",
    postalCode = "",
    coloniaCode = "",
    localidadCode = "",
  } = values;

  // ══════════════════════════════════════════════════════════════════════════
  // Auto-emit municipioName for pre-set values (client address pre-fill / edit mode)
  // The onSelectItem callback on MunicipioSelect only fires on user interaction,
  // so we look up the name from the catalog when the component loads with existing values.
  // ══════════════════════════════════════════════════════════════════════════

  const { data: municipioOptions } = useCatalogOptions(
    "sat_municipio" as CatalogTypeCodeValue,
    { parentCode: estadoCode, enabled: !!estadoCode && !!municipioCode },
  );

  const emittedMunicipioRef = useRef<string>("");

  useEffect(() => {
    if (!municipioOptions || !municipioCode || !estadoCode) return;
    const cacheKey = `${estadoCode}-${municipioCode}`;
    if (emittedMunicipioRef.current === cacheKey) return;
    const item = municipioOptions.find((o) => o.code === cacheKey);
    if (item) {
      emittedMunicipioRef.current = cacheKey;
      onChange({ municipioName: item.name });
    }
  }, [municipioOptions, municipioCode, estadoCode, onChange]);

  // ══════════════════════════════════════════════════════════════════════════
  // Cascade Handlers
  // ══════════════════════════════════════════════════════════════════════════

  /** Estado → limpia municipio y localidad */
  const handleEstadoChange = useCallback(
    (code: string) => {
      onChange({ estadoCode: code, municipioCode: "", localidadCode: "" });
    },
    [onChange],
  );

  /** Municipio → split código compuesto "AGU-001" → "001", también emite el nombre */
  const handleMunicipioSelect = useCallback(
    (code: string, name: string) => {
      onChange({ municipioCode: splitCompound(code), municipioName: name });
    },
    [onChange],
  );

  /** CP → limpia colonia */
  const handlePostalCodeChange = useCallback(
    (code: string) => {
      onChange({ postalCode: code, coloniaCode: "", coloniaName: "" });
    },
    [onChange],
  );

  /** Colonia → split código compuesto "12345-0001" → "0001", también emite el nombre */
  const handleColoniaSelect = useCallback(
    (code: string, name: string) => {
      onChange({ coloniaCode: splitCompound(code), coloniaName: name });
    },
    [onChange],
  );

  /** Localidad → split código compuesto "AGU-01" → "01" */
  const handleLocalidadChange = useCallback(
    (code: string) => {
      onChange({ localidadCode: splitCompound(code) });
    },
    [onChange],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className={cn("space-y-4", className)}>
      {/* Row 1: Estado + Municipio */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Estado
            {required?.estado && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <EstadoSelect
            value={estadoCode}
            onValueChange={handleEstadoChange}
            disabled={disabled}
            placeholder="Seleccione estado"
            displayFormat={displayFormat}
          />
          {errors?.estado && (
            <p className="text-sm text-destructive">{errors.estado}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Municipio
            {required?.municipio && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <MunicipioSelect
            value={municipioCode ? `${estadoCode}-${municipioCode}` : ""}
            onSelectItem={handleMunicipioSelect}
            estadoCode={estadoCode}
            disabled={disabled || !estadoCode}
            placeholder={
              estadoCode ? "Seleccione municipio" : "Primero seleccione estado"
            }
            displayFormat={displayFormat}
          />
          {errors?.municipio && (
            <p className="text-sm text-destructive">{errors.municipio}</p>
          )}
        </div>
      </div>

      {/* Row 2: Código Postal + Colonia */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Código Postal
            {required?.postalCode && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <CodigoPostalCombobox
            value={postalCode}
            onValueChange={handlePostalCodeChange}
            estadoCode={estadoCode}
            placeholder="Buscar CP..."
            disabled={disabled}
          />
          {errors?.postalCode && (
            <p className="text-sm text-destructive">{errors.postalCode}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Colonia
            {required?.colonia && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <ColoniaCombobox
            value={coloniaCode ? `${postalCode}-${coloniaCode}` : ""}
            onSelectItem={handleColoniaSelect}
            codigoPostal={postalCode}
            disabled={disabled || !postalCode || postalCode.length !== 5}
            placeholder={
              postalCode?.length === 5
                ? "Seleccione colonia"
                : "Ingrese código postal primero"
            }
            displayFormat={displayFormat}
          />
          {errors?.colonia && (
            <p className="text-sm text-destructive">{errors.colonia}</p>
          )}
        </div>
      </div>

      {/* Row 3: Localidad (full width, opcional) */}
      <div className="space-y-2">
        <Label>
          Localidad
          {required?.localidad && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>
        <LocalidadCombobox
          value={localidadCode ? `${estadoCode}-${localidadCode}` : ""}
          onValueChange={handleLocalidadChange}
          estadoCode={estadoCode}
          disabled={disabled || !estadoCode}
          placeholder="Solo para zonas rurales"
          displayFormat={displayFormat}
        />
        {showLocalidadHint && (
          <p className="text-xs text-muted-foreground">
            Solo para zonas rurales o cuando no hay código postal definido.
          </p>
        )}
        {errors?.localidad && (
          <p className="text-sm text-destructive">{errors.localidad}</p>
        )}
      </div>
    </div>
  );
}

export default AddressFields;
