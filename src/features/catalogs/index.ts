/**
 * Catalogs Feature Module - Barrel Export
 *
 * Módulo de catálogos SAT/CFDI para el ERP de transporte.
 * Proporciona acceso a catálogos del SAT para Carta Porte 3.1, CFDI,
 * y direcciones de México.
 *
 * @example
 * // Usar hooks para obtener datos
 * import { useEstadosOptions, useCatalogSearch } from '@features/catalogs';
 *
 * // Usar componentes de UI
 * import {
 *   EstadoSelect,
 *   MunicipioSelect,
 *   ProductoServicioCPSearch
 * } from '@features/catalogs';
 *
 * // Usar tipos
 * import type { CatalogItem, CatalogTypeCodeValue } from '@features/catalogs';
 */

// ============================================================================
// Domain Layer (Entities, Types, Interfaces)
// ============================================================================

export {
  // Enums & Constants
  CatalogTypeCode,
  CatalogSource,
  CATALOG_TYPE_LABELS,
  SMALL_CATALOGS,
  LARGE_CATALOGS,
  HIERARCHICAL_CATALOGS,

  // Helpers
  isSmallCatalog,
  isHierarchicalCatalog,
  getParentCatalogType,

  // Query Keys
  catalogQueryKeys,

  // Types
  type CatalogTypeCodeValue,
  type CatalogSourceValue,
  type CatalogType,
  type CatalogItem,
  type CatalogItemListItem,
  type CatalogOption,
  type CatalogVersion,
  type CatalogSearchParams,
  type CatalogFilterParams,
} from "./domain";

export type {
  ICatalogRepository,
  CreateCatalogItemDTO,
  UpdateCatalogItemDTO,
  CatalogSearchResult,
} from "./domain";

// ============================================================================
// Application Layer (Hooks)
// ============================================================================

export {
  // Generic hooks
  useCatalogOptions,
  useCatalogSearch,
  useCatalogItem,
  useCatalogChildren,
  useCatalogTypes,

  // Specialized hooks - Options (catálogos pequeños)
  useEstadosOptions,
  useMunicipiosOptions,
  useTipoPermisoOptions,
  useConfigAutotransporteOptions,
  useTipoFiguraOptions,
  useFormaPagoOptions,
  useMetodoPagoOptions,
  useUsoCfdiOptions,
  useRegimenFiscalOptions,
  useTipoEmbalajeOptions,

  // Specialized hooks - Search (catálogos grandes)
  useSearchProductosServiciosCP,
  useSearchUnidadesMedida,
  useSearchMaterialesPeligrosos,
  useSearchColonias,
  useSearchLocalidades,

  // Specialized hooks - Items
  useEstado,
  useMunicipio,
  useMunicipiosByEstado,
  useColoniasByMunicipio,
  useLocalidadesByMunicipio,
} from "./application/hooks";

// ============================================================================
// Infrastructure Layer (Repository, Mappers)
// ============================================================================

export { catalogRepository, createCatalogRepository } from "./infrastructure";

// ============================================================================
// Presentation Layer (Components)
// ============================================================================

export {
  // Generic components
  CatalogSelect,
  CatalogSearchInput,
  AddressFields,

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
  TipoEmbalajeSelect,

  // Specialized Search components
  ProductoServicioCPSearch,
  UnidadMedidaSearch,
  MaterialPeligrosoSearch,
  ColoniaSearch,
  LocalidadSearch,
} from "./presentation/components";

export type {
  CatalogSelectProps,
  CatalogSearchInputProps,
  AddressFieldsProps,
} from "./presentation/components";
