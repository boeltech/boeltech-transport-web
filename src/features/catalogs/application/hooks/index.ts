/**
 * Catalog Hooks - Public API
 */

// Types
export {
  useCatalogType,
  useCatalogCurrentVersion,
  useCatalogVersions,
} from "./useCatalogType";

export { useCatalogTypes, useCatalogTypesGrouped } from "./useCatalogTypes";

// Statistics
export {
  useCatalogStatistics,
  useCatalogStatisticsBySource,
} from "./useCatalogStatistics";

// Import
export {
  useCatalogImport,
  useCatalogValidate,
  useCatalogImportWizard,
} from "./useCatalogImport";
export type {
  ImportCatalogParams,
  ValidateCatalogParams,
} from "./useCatalogImport";

// Items
// export {
//   useCatalogItems,
//   // useCatalogItemsPaginated
// } from "./useCatalogItems";

// Item
// export {
//   useCatalogChildren,
//   useCatalogItem,
//   useColoniasByMunicipio,
//   useEstado,
//   useLocalidadesByMunicipio,
//   useMunicipio,
//   useMunicipiosByEstado,
// } from "./useCatalogItem";

// Options
// export {
//   type UseCatalogOptionsParams,
//   useCatalogOptions,
//   useConfigAutotransporteOptions,
//   useEstadosOptions,
//   useFormaPagoOptions,
//   useMetodoPagoOptions,
//   useMunicipiosOptions,
//   useRegimenFiscalOptions,
//   useTipoEmbalajeOptions,
//   useTipoFiguraOptions,
//   useTipoPermisoOptions,
//   useUsoCfdiOptions,
// } from "./useCatalogOptions";

// Hooks nuevos para búsqueda en catálogos grandes
export {
  useCatalogItems,
  useCatalogOptions,
  useCatalogSearch,
  useCatalogItem,
  useCatalogChildren,
} from "./useCatalogSearch";

export {
  useRegimenFiscalLabel,
  type UseRegimenFiscalLabelResult,
} from "./useRegimenFiscalLabel";
