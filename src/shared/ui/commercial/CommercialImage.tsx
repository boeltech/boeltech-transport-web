/**
 * Imagen comercial tipada — solo ids del catálogo (L1).
 * No sustituye BrandLockup / LatunoMark.
 */
import { cn } from "@shared/lib/utils/cn";
import {
  getCommercialAsset,
  isCommercialAssetEnabled,
  type CommercialAssetId,
} from "@shared/commercial/assets/commercialAssets";

export type CommercialImageProps = {
  id: CommercialAssetId;
  className?: string;
  /** Padre ya anuncia el contenido (p. ej. preview aria-hidden). */
  decorative?: boolean;
  loading?: "lazy" | "eager";
};

/**
 * Devuelve null si el asset no está `enabled` (mock CSS u omisión).
 */
export function CommercialImage({
  id,
  className,
  decorative = false,
  loading = "lazy",
}: CommercialImageProps) {
  if (!isCommercialAssetEnabled(id)) return null;

  const asset = getCommercialAsset(id);

  return (
    <img
      src={asset.src}
      alt={decorative ? "" : asset.alt}
      width={asset.width}
      height={asset.height}
      loading={loading}
      decoding="async"
      draggable={false}
      className={cn("h-auto max-w-full", className)}
    />
  );
}
