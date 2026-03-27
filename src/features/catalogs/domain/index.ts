/**
 * Catalog Domain - Public API
 */

// Entities & Types
export {
  CatalogTypeCode,
  CatalogSource,
  catalogQueryKeys,
  CATALOG_TYPE_LABELS,
  CATALOG_SOURCE_LABELS,
  SMALL_CATALOGS,
  LARGE_CATALOGS,
  HIERARCHICAL_CATALOGS,
  isSmallCatalog,
  isHierarchicalCatalog,
  getParentCatalogType,
  isSatCatalog,
  isInternalCatalog,
} from "./entities";

export type {
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
  CatalogSearchParams,
  CatalogFilterParams,
  CatalogTypeWithVersion,
} from "./entities";

// Repository interface & DTOs
export type {
  ICatalogRepository,
  CreateCatalogItemDTO,
  UpdateCatalogItemDTO,
  CatalogSearchResult,
} from "./repository";
