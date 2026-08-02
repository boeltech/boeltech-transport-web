export {
  DECLARED_FLEET_BANDS,
  DEFAULT_OPERATIONAL_PLAN_CODE,
  OPERATIONAL_PLAN_BY_BAND,
  isDeclaredFleetBand,
  recommendOperationalPlanCode,
  type DeclaredFleetBand,
} from "@shared/commercial/recommendOperationalPlan";

export {
  OPERATIONAL_PLAN_CATALOG,
  FLEET_BAND_LABELS,
  getOperationalPlanByCode,
  type OperationalPlanCatalogItem,
} from "@shared/commercial/operationalPlanCatalog";

export { formatOperationalPlanForFunnel } from "@shared/commercial/formatOperationalPlanForFunnel";
export { usePublicOperationalPlans } from "@shared/commercial/usePublicOperationalPlans";
export {
  usePublicSelfServeRegister,
  publicSelfServeRegisterQueryKey,
} from "@shared/commercial/usePublicSelfServeRegister";
export {
  useCheckSubdomainAvailability,
  checkSubdomainQueryKey,
} from "@shared/commercial/useCheckSubdomainAvailability";
export { fetchPublicOperationalPlans } from "@shared/commercial/publicOperationalPlansApi";

export {
  COMMERCIAL_ASSET_IDS,
  commercialAssets,
  getCommercialAsset,
  isCommercialAssetEnabled,
  type CommercialAsset,
  type CommercialAssetId,
  type CommercialAssetKind,
} from "@shared/commercial/assets/commercialAssets";
