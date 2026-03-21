/**
 * Catalog Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades del negocio, Value Objects, Enums y Constantes.
 * REGLA: Esta capa NO debe importar nada de otras capas.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Tipos de catálogo disponibles en el sistema
 */
export const CatalogTypeCode = {
  // Catálogos geográficos (jerárquicos)
  SAT_ESTADO: "sat_estado",
  SAT_MUNICIPIO: "sat_municipio",
  SAT_LOCALIDAD: "sat_localidad",
  SAT_COLONIA: "sat_colonia",

  // Carta Porte
  SAT_CLAVE_PROD_SERV_CP: "sat_clave_prod_serv_cp",
  SAT_CLAVE_UNIDAD: "sat_clave_unidad",
  SAT_CONFIG_AUTOTRANSPORTE: "sat_config_autotransporte",
  SAT_TIPO_PERMISO: "sat_tipo_permiso",
  SAT_TIPO_FIGURA: "sat_tipo_figura",
  SAT_MATERIAL_PELIGROSO: "sat_material_peligroso",
  SAT_TIPO_EMBALAJE: "sat_tipo_embalaje",

  // CFDI
  SAT_FORMA_PAGO: "sat_forma_pago",
  SAT_METODO_PAGO: "sat_metodo_pago",
  SAT_USO_CFDI: "sat_uso_cfdi",
  SAT_REGIMEN_FISCAL: "sat_regimen_fiscal",
} as const;

export type CatalogTypeCodeValue =
  (typeof CatalogTypeCode)[keyof typeof CatalogTypeCode];

/**
 * Fuentes de catálogos
 */
export const CatalogSource = {
  SAT: "SAT",
  BANXICO: "BANXICO",
  INTERNAL: "INTERNAL",
} as const;

export type CatalogSourceValue =
  (typeof CatalogSource)[keyof typeof CatalogSource];

// ============================================================================
// ENTITIES
// ============================================================================

/**
 * Tipo de catálogo
 */
export interface CatalogType {
  readonly id: string;
  readonly code: CatalogTypeCodeValue;
  readonly name: string;
  readonly description: string | null;
  readonly source: CatalogSourceValue | null;
  readonly parentTypeCode: CatalogTypeCodeValue | null;
  readonly isHierarchical: boolean;
  readonly isGlobal: boolean;
  readonly metadataSchema: Record<string, unknown> | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Item de catálogo completo
 */
export interface CatalogItem {
  readonly id: string;
  readonly tenantId: string | null;
  readonly catalogTypeId: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly parentCode: string | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Item de catálogo para listado (versión reducida)
 */
export interface CatalogItemListItem {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly parentCode: string | null;
  readonly isActive: boolean;
}

/**
 * Opción de catálogo para select/dropdown (versión mínima)
 */
export interface CatalogOption {
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
  readonly parentCode?: string | null;
}

/**
 * Versión de catálogo
 */
export interface CatalogVersion {
  readonly id: string;
  readonly catalogTypeId: string;
  readonly version: string;
  readonly publishedAt: string;
  readonly sourceUrl: string | null;
  readonly notes: string | null;
  readonly isCurrent: boolean;
  readonly itemsCount: number;
  readonly createdAt: Date;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface CatalogSearchParams {
  readonly query: string;
  readonly parentCode?: string;
  readonly limit?: number;
  readonly includeInactive?: boolean;
}

export interface CatalogFilterParams {
  readonly parentCode?: string;
  readonly includeInactive?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Query keys para React Query - Catalogs
 */
export const catalogQueryKeys = {
  all: ["catalogs"] as const,

  // Tipos de catálogo
  types: () => [...catalogQueryKeys.all, "types"] as const,

  // Items de un catálogo
  items: (typeCode: CatalogTypeCodeValue) =>
    [...catalogQueryKeys.all, typeCode, "items"] as const,

  itemsFiltered: (
    typeCode: CatalogTypeCodeValue,
    filters?: CatalogFilterParams,
  ) => [...catalogQueryKeys.items(typeCode), filters] as const,

  // Opciones para select
  options: (typeCode: CatalogTypeCodeValue) =>
    [...catalogQueryKeys.all, typeCode, "options"] as const,

  optionsFiltered: (typeCode: CatalogTypeCodeValue, parentCode?: string) =>
    [...catalogQueryKeys.options(typeCode), { parentCode }] as const,

  // Búsqueda
  search: (typeCode: CatalogTypeCodeValue) =>
    [...catalogQueryKeys.all, typeCode, "search"] as const,

  searchQuery: (typeCode: CatalogTypeCodeValue, params: CatalogSearchParams) =>
    [...catalogQueryKeys.search(typeCode), params] as const,

  // Item específico
  item: (typeCode: CatalogTypeCodeValue, code: string) =>
    [...catalogQueryKeys.all, typeCode, "item", code] as const,

  // Hijos de un item
  children: (typeCode: CatalogTypeCodeValue, parentCode: string) =>
    [...catalogQueryKeys.all, typeCode, "children", parentCode] as const,

  // Versiones
  version: (typeCode: CatalogTypeCodeValue) =>
    [...catalogQueryKeys.all, typeCode, "version"] as const,

  versions: (typeCode: CatalogTypeCodeValue) =>
    [...catalogQueryKeys.all, typeCode, "versions"] as const,
};

// ============================================================================
// UI LABELS
// ============================================================================

export const CATALOG_TYPE_LABELS: Record<CatalogTypeCodeValue, string> = {
  [CatalogTypeCode.SAT_ESTADO]: "Estados",
  [CatalogTypeCode.SAT_MUNICIPIO]: "Municipios",
  [CatalogTypeCode.SAT_LOCALIDAD]: "Localidades",
  [CatalogTypeCode.SAT_COLONIA]: "Colonias",
  [CatalogTypeCode.SAT_CLAVE_PROD_SERV_CP]: "Productos/Servicios CP",
  [CatalogTypeCode.SAT_CLAVE_UNIDAD]: "Unidades de Medida",
  [CatalogTypeCode.SAT_CONFIG_AUTOTRANSPORTE]: "Configuración Vehicular",
  [CatalogTypeCode.SAT_TIPO_PERMISO]: "Tipos de Permiso SCT",
  [CatalogTypeCode.SAT_TIPO_FIGURA]: "Tipos de Figura",
  [CatalogTypeCode.SAT_MATERIAL_PELIGROSO]: "Materiales Peligrosos",
  [CatalogTypeCode.SAT_TIPO_EMBALAJE]: "Tipos de Embalaje",
  [CatalogTypeCode.SAT_FORMA_PAGO]: "Formas de Pago",
  [CatalogTypeCode.SAT_METODO_PAGO]: "Métodos de Pago",
  [CatalogTypeCode.SAT_USO_CFDI]: "Usos de CFDI",
  [CatalogTypeCode.SAT_REGIMEN_FISCAL]: "Regímenes Fiscales",
};

/**
 * Catálogos pequeños que se pueden cargar completos
 * (menos de 500 items)
 */
export const SMALL_CATALOGS: CatalogTypeCodeValue[] = [
  CatalogTypeCode.SAT_ESTADO,
  CatalogTypeCode.SAT_TIPO_PERMISO,
  CatalogTypeCode.SAT_CONFIG_AUTOTRANSPORTE,
  CatalogTypeCode.SAT_TIPO_FIGURA,
  CatalogTypeCode.SAT_FORMA_PAGO,
  CatalogTypeCode.SAT_METODO_PAGO,
  CatalogTypeCode.SAT_USO_CFDI,
  CatalogTypeCode.SAT_REGIMEN_FISCAL,
  CatalogTypeCode.SAT_TIPO_EMBALAJE,
];

/**
 * Catálogos grandes que requieren búsqueda
 */
export const LARGE_CATALOGS: CatalogTypeCodeValue[] = [
  CatalogTypeCode.SAT_MUNICIPIO,
  CatalogTypeCode.SAT_LOCALIDAD,
  CatalogTypeCode.SAT_COLONIA,
  CatalogTypeCode.SAT_CLAVE_PROD_SERV_CP,
  CatalogTypeCode.SAT_CLAVE_UNIDAD,
  CatalogTypeCode.SAT_MATERIAL_PELIGROSO,
];

/**
 * Catálogos jerárquicos (tienen padre)
 */
export const HIERARCHICAL_CATALOGS: Record<
  CatalogTypeCodeValue,
  CatalogTypeCodeValue
> = {
  [CatalogTypeCode.SAT_MUNICIPIO]: CatalogTypeCode.SAT_ESTADO,
  [CatalogTypeCode.SAT_LOCALIDAD]: CatalogTypeCode.SAT_MUNICIPIO,
  [CatalogTypeCode.SAT_COLONIA]: CatalogTypeCode.SAT_MUNICIPIO,
} as Record<CatalogTypeCodeValue, CatalogTypeCodeValue>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Verifica si un catálogo es pequeño (se puede cargar completo)
 */
export function isSmallCatalog(typeCode: CatalogTypeCodeValue): boolean {
  return SMALL_CATALOGS.includes(typeCode);
}

/**
 * Verifica si un catálogo es jerárquico
 */
export function isHierarchicalCatalog(typeCode: CatalogTypeCodeValue): boolean {
  return typeCode in HIERARCHICAL_CATALOGS;
}

/**
 * Obtiene el tipo de catálogo padre
 */
export function getParentCatalogType(
  typeCode: CatalogTypeCodeValue,
): CatalogTypeCodeValue | null {
  return HIERARCHICAL_CATALOGS[typeCode] ?? null;
}
