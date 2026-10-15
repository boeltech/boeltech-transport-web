/**
 * Prefetch ligero de crops A3 (evidencia). Sin librerías — `new Image().src`.
 */
import {
  getCommercialAsset,
  isCommercialAssetEnabled,
  type CommercialAssetId,
} from "@shared/commercial/assets/commercialAssets";

const prefetchedSrcs = new Set<string>();

export function prefetchCommercialAsset(
  id: CommercialAssetId | undefined | null,
): void {
  if (!id || !isCommercialAssetEnabled(id)) return;
  const { src } = getCommercialAsset(id);
  if (!src || prefetchedSrcs.has(src)) return;
  prefetchedSrcs.add(src);

  if (typeof Image === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

/** Solo tests: limpia el set de srcs ya pedidos. */
export function resetLandingPrefetchCacheForTests(): void {
  prefetchedSrcs.clear();
}
