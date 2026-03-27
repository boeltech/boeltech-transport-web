/**
 * Catalog Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades del negocio, Value Objects, Enums y Constantes.
 * REGLA: Esta capa NO debe importar nada de otras capas.
 *
 * ACTUALIZADO: Agregado CatalogTypeWithVersion
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
  SAT_CODIGO_POSTAL: "sat_codigo_postal",

  // Carta Porte
  SAT_CLAVE_PROD_SERV_CP: "sat_clave_prod_serv_cp",
  SAT_CLAVE_UNIDAD: "sat_clave_unidad",
  SAT_CONFIG_AUTOTRANSPORTE: "sat_config_autotransporte",
  SAT_TIPO_PERMISO: "sat_tipo_permiso",
  SAT_TIPO_FIGURA: "sat_tipo_figura",
  SAT_MATERIAL_PELIGROSO: "sat_material_peligroso",
  SAT_TIPO_EMBALAJE: "sat_tipo_embalaje",
  SAT_SUB_TIPO_REM: "sat_sub_tipo_rem",
  SAT_TIPO_CARRO: "sat_tipo_carro",
  SAT_CONTENEDOR: "sat_contenedor",

  // CFDI
  SAT_FORMA_PAGO: "sat_forma_pago",
  SAT_METODO_PAGO: "sat_metodo_pago",
  SAT_USO_CFDI: "sat_uso_cfdi",
  SAT_REGIMEN_FISCAL: "sat_regimen_fiscal",
  SAT_MONEDA: "sat_moneda",
  SAT_PAIS: "sat_pais",

  // Catálogos internos del ERP
  VEHICLE_TYPE: "vehicle_type",
  EXPENSE_CATEGORY: "expense_category",
  TRIP_STATUS: "trip_status",
  STOP_TYPE: "stop_type",
  CARGO_STATUS: "cargo_status",
  DOCUMENT_TYPE: "document_type",
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
 * Tipo de catálogo con versión actual e items count.
 * Útil para el wizard de importación.
 */
export interface CatalogTypeWithVersion extends CatalogType {
  readonly currentVersion: CatalogVersion | null;
  readonly itemsCount: number;
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

/**
 * Estadísticas de un catálogo
 */
export interface CatalogStatistics {
  readonly typeCode: string;
  readonly typeName: string;
  readonly source: string | null;
  readonly itemCount: number;
  readonly currentVersion: string | null;
}

// ============================================================================
// IMPORT ENTITIES
// ============================================================================

/**
 * Opciones para importación de catálogo
 */
export interface CatalogImportOptions {
  version: string;
  sourceUrl?: string;
  notes?: string;
  skipErrors?: boolean;
  updateExisting?: boolean;
  deactivateMissing?: boolean;
}

/**
 * Resultado de importación
 */
export interface CatalogImportResult {
  success: boolean;
  typeCode: string;
  version: string;
  totalRows: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: Array<{ row: number; errors: string[] }>;
  duration: number;
}

/**
 * Resultado de validación de CSV
 */
export interface CatalogValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errors: Array<{ row: number; errors: string[] }>;
  preview: Array<{
    code: string;
    name: string;
    description?: string | null;
    parentCode?: string | null;
  }>;
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

export const catalogQueryKeys = {
  all: ["catalogs"] as const,

  // Types
  types: () => [...catalogQueryKeys.all, "types"] as const,
  typesGrouped: () => [...catalogQueryKeys.all, "types", "grouped"] as const,

  // Tipo específico con versión actual
  type: (typeCode: string) =>
    [...catalogQueryKeys.all, "type", typeCode] as const,

  // Statistics
  statistics: () => [...catalogQueryKeys.all, "statistics"] as const,

  // Items
  items: (typeCode: string) =>
    [...catalogQueryKeys.all, typeCode, "items"] as const,
  itemsFiltered: (
    typeCode: string,
    filters?: { parentCode?: string; includeInactive?: boolean },
  ) => [...catalogQueryKeys.items(typeCode), filters] as const,

  // Options (para selects)
  options: (typeCode: string) =>
    [...catalogQueryKeys.all, typeCode, "options"] as const,
  optionsFiltered: (typeCode: string, parentCode?: string) =>
    [...catalogQueryKeys.options(typeCode), { parentCode }] as const,

  // Search
  search: (typeCode: string) =>
    [...catalogQueryKeys.all, typeCode, "search"] as const,
  searchQuery: (
    typeCode: string,
    params: { query: string; parentCode?: string },
  ) => [...catalogQueryKeys.search(typeCode), params] as const,

  // Single item
  item: (typeCode: string, code: string) =>
    [...catalogQueryKeys.all, typeCode, "item", code] as const,

  // Children (hierarchical)
  children: (typeCode: string, parentCode: string) =>
    [...catalogQueryKeys.all, typeCode, "children", parentCode] as const,

  // Versions
  version: (typeCode: string) =>
    [...catalogQueryKeys.all, typeCode, "version"] as const,
  versions: (typeCode: string) =>
    [...catalogQueryKeys.all, typeCode, "versions"] as const,
};

// ============================================================================
// UI LABELS
// ============================================================================

export const CATALOG_TYPE_LABELS: Record<string, string> = {
  [CatalogTypeCode.SAT_ESTADO]: "Estados",
  [CatalogTypeCode.SAT_MUNICIPIO]: "Municipios",
  [CatalogTypeCode.SAT_LOCALIDAD]: "Localidades",
  [CatalogTypeCode.SAT_COLONIA]: "Colonias",
  [CatalogTypeCode.SAT_CODIGO_POSTAL]: "Códigos Postales",
  [CatalogTypeCode.SAT_CLAVE_PROD_SERV_CP]: "Productos/Servicios CP",
  [CatalogTypeCode.SAT_CLAVE_UNIDAD]: "Unidades de Medida",
  [CatalogTypeCode.SAT_CONFIG_AUTOTRANSPORTE]: "Configuración Vehicular",
  [CatalogTypeCode.SAT_TIPO_PERMISO]: "Tipos de Permiso SCT",
  [CatalogTypeCode.SAT_TIPO_FIGURA]: "Tipos de Figura",
  [CatalogTypeCode.SAT_MATERIAL_PELIGROSO]: "Materiales Peligrosos",
  [CatalogTypeCode.SAT_TIPO_EMBALAJE]: "Tipos de Embalaje",
  [CatalogTypeCode.SAT_SUB_TIPO_REM]: "Subtipos de Remolque",
  [CatalogTypeCode.SAT_TIPO_CARRO]: "Tipos de Carro",
  [CatalogTypeCode.SAT_CONTENEDOR]: "Contenedores",
  [CatalogTypeCode.SAT_FORMA_PAGO]: "Formas de Pago",
  [CatalogTypeCode.SAT_METODO_PAGO]: "Métodos de Pago",
  [CatalogTypeCode.SAT_USO_CFDI]: "Usos de CFDI",
  [CatalogTypeCode.SAT_REGIMEN_FISCAL]: "Regímenes Fiscales",
  [CatalogTypeCode.SAT_MONEDA]: "Monedas",
  [CatalogTypeCode.SAT_PAIS]: "Países",
  [CatalogTypeCode.VEHICLE_TYPE]: "Tipos de Vehículo",
  [CatalogTypeCode.EXPENSE_CATEGORY]: "Categorías de Gasto",
  [CatalogTypeCode.TRIP_STATUS]: "Estados de Viaje",
  [CatalogTypeCode.STOP_TYPE]: "Tipos de Parada",
  [CatalogTypeCode.CARGO_STATUS]: "Estados de Carga",
  [CatalogTypeCode.DOCUMENT_TYPE]: "Tipos de Documento",
};

export const CATALOG_SOURCE_LABELS: Record<string, string> = {
  [CatalogSource.SAT]: "SAT",
  [CatalogSource.BANXICO]: "Banxico",
  [CatalogSource.INTERNAL]: "Interno",
};

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
  CatalogTypeCode.SAT_SUB_TIPO_REM,
  CatalogTypeCode.SAT_MONEDA,
  CatalogTypeCode.SAT_PAIS,
  CatalogTypeCode.VEHICLE_TYPE,
  CatalogTypeCode.EXPENSE_CATEGORY,
  CatalogTypeCode.TRIP_STATUS,
  CatalogTypeCode.STOP_TYPE,
  CatalogTypeCode.CARGO_STATUS,
  CatalogTypeCode.DOCUMENT_TYPE,
];

export const LARGE_CATALOGS: CatalogTypeCodeValue[] = [
  CatalogTypeCode.SAT_MUNICIPIO,
  CatalogTypeCode.SAT_LOCALIDAD,
  CatalogTypeCode.SAT_COLONIA,
  CatalogTypeCode.SAT_CODIGO_POSTAL,
  CatalogTypeCode.SAT_CLAVE_PROD_SERV_CP,
  CatalogTypeCode.SAT_CLAVE_UNIDAD,
  CatalogTypeCode.SAT_MATERIAL_PELIGROSO,
];

export const HIERARCHICAL_CATALOGS: Partial<
  Record<CatalogTypeCodeValue, CatalogTypeCodeValue>
> = {
  [CatalogTypeCode.SAT_MUNICIPIO]: CatalogTypeCode.SAT_ESTADO,
  [CatalogTypeCode.SAT_LOCALIDAD]: CatalogTypeCode.SAT_MUNICIPIO,
  [CatalogTypeCode.SAT_COLONIA]: CatalogTypeCode.SAT_MUNICIPIO,
  [CatalogTypeCode.SAT_CODIGO_POSTAL]: CatalogTypeCode.SAT_ESTADO,
};

// ============================================================================
// HELPERS
// ============================================================================

export function isSmallCatalog(typeCode: string): boolean {
  return SMALL_CATALOGS.includes(typeCode as CatalogTypeCodeValue);
}

export function isHierarchicalCatalog(typeCode: string): boolean {
  return typeCode in HIERARCHICAL_CATALOGS;
}

export function getParentCatalogType(typeCode: string): string | null {
  return HIERARCHICAL_CATALOGS[typeCode as CatalogTypeCodeValue] ?? null;
}

export function isSatCatalog(typeCode: string): boolean {
  return typeCode.startsWith("sat_");
}

export function isInternalCatalog(typeCode: string): boolean {
  return !typeCode.startsWith("sat_") && !typeCode.startsWith("banxico_");
}
