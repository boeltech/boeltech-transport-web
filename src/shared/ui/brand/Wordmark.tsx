/**
 * Wordmark — marca tipográfica del producto tlamx.
 *
 * Display: Comfortaa (`font-brand` / BRAND.displayFontFamily).
 * En BrandLockup se aplica además `.brand-wordmark-thick`.
 * El isotipo vive en LatunoMark / BrandLockup.
 *
 * Variantes:
 *   - default:  "tlamx" completo
 *   - compact:  monograma tipográfico (preferir LatunoMark en chrome)
 *
 * Reglas de uso:
 *   - Lockup icono + nombre: BrandLockup (gap 0.5 × mark)
 *   - Color por default: --primary
 *   - Fondos primary/oscuros: variant="onBrand"
 *   - Consola platform NO usa este wordmark; usa PlatformBrandMark
 */

import { memo, type CSSProperties } from "react";
import { cn } from "@shared/lib/utils/cn";
import { BRAND } from "./brandIdentity";

export interface WordmarkProps {
  /**
   * Si es true, muestra solo el monograma (sidebar tipográfico sin mark).
   * Si es false (default), muestra el nombre completo.
   */
  compact?: boolean;

  /**
   * Variante de color del wordmark.
   * - "brand":   color primary (default; sobre fondos claros)
   * - "onBrand": color primary-foreground (sobre fondos primary)
   * - "muted":   color muted-foreground (estados deshabilitados)
   * - "current": hereda currentColor del padre
   */
  variant?: "brand" | "onBrand" | "muted" | "current";

  className?: string;
  style?: CSSProperties;
  decorative?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<WordmarkProps["variant"]>, string> = {
  brand: "text-primary",
  onBrand: "text-primary-foreground",
  muted: "text-muted-foreground",
  current: "text-current",
};

export const Wordmark = memo(function Wordmark({
  compact = false,
  variant = "brand",
  className,
  style,
  decorative = false,
}: WordmarkProps) {
  const text = compact ? BRAND.productMonogram : BRAND.productName;

  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : BRAND.productName}
      role={decorative ? undefined : "img"}
      style={{
        fontFamily: BRAND.displayFontFamily,
        ...style,
      }}
      className={cn(
        "font-brand font-bold leading-none select-none tracking-[-0.03em] lowercase",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {text}
    </span>
  );
});

export default Wordmark;
