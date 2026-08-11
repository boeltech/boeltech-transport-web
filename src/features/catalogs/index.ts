/**
 * Catalogs Module - Public API
 *
 * Este módulo maneja los catálogos SAT e internos del ERP.
 *
 * Estructura Clean Architecture:
 * - domain/      → Entidades, interfaces, constantes
 * - infrastructure/ → Repositorio HTTP, mappers
 * - application/ → Hooks (React Query)
 * - presentation/ → Páginas, componentes, rutas
 *
 * Uso:
 * ```tsx
 * // En el router principal
 * import { CatalogRoutes } from "@modules/catalogs";
 *
 * <Route path="configuracion/catalogos/*" element={<CatalogRoutes />} />
 *
 * // Componentes reutilizables
 * import { CatalogSelect, CatalogSearchInput } from "@modules/catalogs";
 *
 * // Hooks
 * import { useCatalogOptions, useCatalogSearch } from "@modules/catalogs";
 * ```
 */

// ============================================================================
// DOMAIN
// ============================================================================

export {
  // Constants & Enums
  CatalogTypeCode,
  CatalogSource,
  catalogQueryKeys,
  CATALOG_TYPE_LABELS,
  CATALOG_SOURCE_LABELS,
  SMALL_CATALOGS,
  LARGE_CATALOGS,
  HIERARCHICAL_CATALOGS,
  // Helpers
  isSmallCatalog,
  isHierarchicalCatalog,
  getParentCatalogType,
  isSatCatalog,
  isInternalCatalog,
} from "./domain";

export type {
  // Types
  CatalogTypeCodeValue,
  CatalogSourceValue,
  CatalogType,
  CatalogItem,
  CatalogOption,
  CatalogVersion,
  CatalogStatistics,
  CatalogImportOptions,
  CatalogImportResult,
  CatalogValidationResult,
  CatalogAuthScope,
  CatalogSearchParams,
  CatalogFilterParams,
  // Repository
  ICatalogRepository,
  CreateCatalogItemDTO,
  UpdateCatalogItemDTO,
  CatalogSearchResult,
} from "./domain";

// ============================================================================
// INFRASTRUCTURE
// ============================================================================

export { catalogRepository } from "./infrastructure";

// ============================================================================
// Application Layer (Hooks)
// ============================================================================

export {
  // Statistics
  useCatalogStatistics,
  useCatalogStatisticsBySource,

  // Import
  useCatalogImport,
  useCatalogValidate,
  useCatalogImportWizard,
  useDownloadCatalogTemplate,

  // Items
  useCatalogItems,
  // useCatalogItemsPaginated,

  // Types
  useCatalogType,
  useCatalogTypes,
  useCatalogTypesGrouped,

  // Generic hooks
  useCatalogOptions,
  useCatalogSearch,
  useCatalogItem,
  useCatalogChildren,
  useRegimenFiscalLabel,
  useFormaPagoLabel,
  useMetodoPagoLabel,

  // Specialized hooks - Options (catálogos pequeños)
  // useEstadosOptions,
  // useMunicipiosOptions,
  // useTipoPermisoOptions,
  // useConfigAutotransporteOptions,
  // useTipoFiguraOptions,
  // useFormaPagoOptions,
  // useMetodoPagoOptions,
  // useUsoCfdiOptions,
  // useRegimenFiscalOptions,
  // useTipoEmbalajeOptions,

  // Specialized hooks - Search (catálogos grandes)
  // useSearchProductosServiciosCP,
  // useSearchUnidadesMedida,
  // useSearchMaterialesPeligrosos,
  // useSearchColonias,
  // useSearchLocalidades,

  // Specialized hooks - Items
  // useEstado,
  // useMunicipio,
  // useMunicipiosByEstado,
  // useColoniasByMunicipio,
  // useLocalidadesByMunicipio,

  // Version
  useCatalogCurrentVersion,
  useCatalogVersions,
} from "./application/hooks";

export type { UseRegimenFiscalLabelResult } from "./application/hooks";

// ============================================================================
// PRESENTATION
// ============================================================================

export {
  // Routes
  // CatalogRoutes,
  // Pages
  CatalogsPage,
  CatalogDetailPage,
  // Admin components
  CatalogTypeCard,
  CatalogItemsTable,
  CatalogImportWizard,
} from "./presentation";

// Re-export component types
export type {
  CatalogTypeCardProps,
  CatalogItemsTableProps,
  CatalogImportWizardProps,
} from "./presentation/components";

export {
  // Generic components
  CatalogSelect,
  CatalogSearchInput,

  // Specialized Select components
  EstadoSelect,
  MunicipioSelect,
  TipoPermisoSelect,
  ConfigAutotransporteSelect,
  TipoFiguraSelect,
  FormaPagoSelect,
  MetodoPagoSelect,
  UsoCfdiSelect,
  RegimenFiscalSelect,
  SubTipoRemSelect,
  TipoEmbalajeSelect,

  // Specialized Search components
  ProductoServicioCPSearch,
  ProductoServicioSearch,
  UnidadMedidaSearch,
  MaterialPeligrosoSearch,
  ColoniaSearch,
  LocalidadSearch,
} from "./presentation/components";

export type {
  CatalogSelectProps,
  CatalogSearchInputProps,
} from "./presentation/components";
