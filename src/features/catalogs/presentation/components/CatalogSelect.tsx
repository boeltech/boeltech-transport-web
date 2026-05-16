/**
 * CatalogSelect Component
 * Clean Architecture - Presentation Layer
 *
 * Componente Select genérico para catálogos SAT pequeños.
 * Se integra con React Hook Form.
 *
 * @example
 * <CatalogSelect
 *   typeCode="sat_estado"
 *   value={field.value}
 *   onValueChange={field.onChange}
 *   placeholder="Seleccione un estado"
 * />
 *
 * // Con filtro por padre (jerárquico)
 * <CatalogSelect
 *   typeCode="sat_municipio"
 *   parentCode={estadoSeleccionado}
 *   value={field.value}
 *   onValueChange={field.onChange}
 * />
 */

import { forwardRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Skeleton } from "@shared/ui/skeleton";
import { useCatalogOptions } from "../../application/hooks";
import type { CatalogTypeCodeValue } from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

export interface CatalogSelectProps {
  /**
   * Código del tipo de catálogo
   */
  typeCode: CatalogTypeCodeValue;
  /**
   * Código del padre para catálogos jerárquicos
   */
  parentCode?: string;
  /**
   * Valor seleccionado (código del item)
   */
  value?: string;
  /**
   * Callback cuando cambia la selección
   */
  onValueChange?: (value: string) => void;
  /**
   * Placeholder del select
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
   * Mostrar código junto al nombre
   */
  showCode?: boolean;
  /**
   * Formato de display: "name", "code", "code-name", "name-code"
   */
  displayFormat?: "name" | "code" | "code-name" | "name-code";
  /**
   * Callback que emite tanto el código como el nombre al seleccionar
   */
  onSelectItem?: (code: string, name: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CatalogSelect = forwardRef<HTMLButtonElement, CatalogSelectProps>(
  (
    {
      typeCode,
      parentCode,
      value,
      onValueChange,
      onSelectItem,
      placeholder = "Seleccione una opción",
      disabled = false,
      className,
      showCode = false,
      displayFormat = "name",
    },
    ref,
  ) => {
    // ══════════════════════════════════════════════════════════════════════════
    // Data Fetching
    // ══════════════════════════════════════════════════════════════════════════

    const {
      data: options,
      isLoading,
      isError,
    } = useCatalogOptions(typeCode, { parentCode, enabled: !disabled || !!value });

    // ══════════════════════════════════════════════════════════════════════════
    // Helpers
    // ══════════════════════════════════════════════════════════════════════════

    const formatOption = (code: string, name: string): string => {
      switch (displayFormat) {
        case "code":
          return code;
        case "code-name":
          return `${code} - ${name}`;
        case "name-code":
          return `${name} (${code})`;
        case "name":
        default:
          return showCode ? `${code} - ${name}` : name;
      }
    };

    // ══════════════════════════════════════════════════════════════════════════
    // Render
    // ══════════════════════════════════════════════════════════════════════════

    if (isLoading) {
      return <Skeleton className={`h-10 w-full ${className}`} />;
    }

    if (isError) {
      return (
        <Select disabled>
          <SelectTrigger className={className} ref={ref}>
            <SelectValue placeholder="Error al cargar opciones" />
          </SelectTrigger>
        </Select>
      );
    }

    return (
      <Select
        value={value ?? ""}
        onValueChange={(val) => {
          if (val) {
            onValueChange?.(val);
            if (onSelectItem) {
              const item = options?.find((o) => o.code === val);
              if (item) onSelectItem(item.code, item.name);
            }
          }
        }}
        disabled={disabled || !options?.length}
      >
        <SelectTrigger className={className} ref={ref}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options?.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {formatOption(option.code, option.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },
);

CatalogSelect.displayName = "CatalogSelect";

// ============================================================================
// SPECIALIZED SELECTS
// ============================================================================

/**
 * Select para estados de México
 */
export type EstadoSelectProps = Omit<CatalogSelectProps, "typeCode">;

export const EstadoSelect = forwardRef<HTMLButtonElement, EstadoSelectProps>(
  (props, ref) => (
    <CatalogSelect
      ref={ref}
      typeCode={"sat_estado" as CatalogTypeCodeValue}
      placeholder="Seleccione un estado"
      {...props}
    />
  ),
);
EstadoSelect.displayName = "EstadoSelect";

/**
 * Select para municipios (requiere parentCode = código de estado)
 */
export interface MunicipioSelectProps extends Omit<
  CatalogSelectProps,
  "typeCode"
> {
  estadoCode?: string;
}

export const MunicipioSelect = forwardRef<
  HTMLButtonElement,
  MunicipioSelectProps
>(({ estadoCode, ...props }, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_municipio" as CatalogTypeCodeValue}
    parentCode={estadoCode}
    placeholder="Seleccione un municipio"
    disabled={!estadoCode || props.disabled}
    {...props}
  />
));
MunicipioSelect.displayName = "MunicipioSelect";

/**
 * Select para tipos de permiso SCT
 */
export const TipoPermisoSelect = forwardRef<
  HTMLButtonElement,
  Omit<CatalogSelectProps, "typeCode">
>((props, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_tipo_permiso" as CatalogTypeCodeValue}
    placeholder="Seleccione tipo de permiso"
    showCode
    {...props}
  />
));
TipoPermisoSelect.displayName = "TipoPermisoSelect";

/**
 * Select para configuración vehicular
 */
export const ConfigAutotransporteSelect = forwardRef<
  HTMLButtonElement,
  Omit<CatalogSelectProps, "typeCode">
>((props, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_config_autotransporte" as CatalogTypeCodeValue}
    placeholder="Seleccione configuración vehicular"
    showCode
    {...props}
  />
));
ConfigAutotransporteSelect.displayName = "ConfigAutotransporteSelect";

/**
 * Select para subtipo de remolque
 */
export const SubTipoRemSelect = forwardRef<
  HTMLButtonElement,
  Omit<CatalogSelectProps, "typeCode">
>((props, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_sub_tipo_rem" as CatalogTypeCodeValue}
    placeholder="Seleccione subtipo de remolque"
    showCode
    {...props}
  />
));
SubTipoRemSelect.displayName = "SubTipoRemSelect";

/**
 * Select para tipos de figura (Carta Porte)
 */
export const TipoFiguraSelect = forwardRef<
  HTMLButtonElement,
  Omit<CatalogSelectProps, "typeCode">
>((props, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_tipo_figura" as CatalogTypeCodeValue}
    placeholder="Seleccione tipo de figura"
    showCode
    {...props}
  />
));
TipoFiguraSelect.displayName = "TipoFiguraSelect";

/**
 * Select para formas de pago CFDI
 */
export const FormaPagoSelect = forwardRef<
  HTMLButtonElement,
  Omit<CatalogSelectProps, "typeCode">
>((props, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_forma_pago" as CatalogTypeCodeValue}
    placeholder="Seleccione forma de pago"
    showCode
    {...props}
  />
));
FormaPagoSelect.displayName = "FormaPagoSelect";

/**
 * Select para métodos de pago CFDI
 */
export const MetodoPagoSelect = forwardRef<
  HTMLButtonElement,
  Omit<CatalogSelectProps, "typeCode">
>((props, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_metodo_pago" as CatalogTypeCodeValue}
    placeholder="Seleccione método de pago"
    showCode
    {...props}
  />
));
MetodoPagoSelect.displayName = "MetodoPagoSelect";

/**
 * Select para usos de CFDI
 */
export const UsoCfdiSelect = forwardRef<
  HTMLButtonElement,
  Omit<CatalogSelectProps, "typeCode">
>((props, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_uso_cfdi" as CatalogTypeCodeValue}
    placeholder="Seleccione uso de CFDI"
    showCode
    {...props}
  />
));
UsoCfdiSelect.displayName = "UsoCfdiSelect";

/**
 * Select para regímenes fiscales
 */
export const RegimenFiscalSelect = forwardRef<
  HTMLButtonElement,
  Omit<CatalogSelectProps, "typeCode">
>((props, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_regimen_fiscal" as CatalogTypeCodeValue}
    placeholder="Seleccione régimen fiscal"
    showCode
    {...props}
  />
));
RegimenFiscalSelect.displayName = "RegimenFiscalSelect";

/**
 * Select para tipos de embalaje
 */
export const TipoEmbalajeSelect = forwardRef<
  HTMLButtonElement,
  Omit<CatalogSelectProps, "typeCode">
>((props, ref) => (
  <CatalogSelect
    ref={ref}
    typeCode={"sat_tipo_embalaje" as CatalogTypeCodeValue}
    placeholder="Seleccione tipo de embalaje"
    showCode
    {...props}
  />
));
TipoEmbalajeSelect.displayName = "TipoEmbalajeSelect";

export default CatalogSelect;
