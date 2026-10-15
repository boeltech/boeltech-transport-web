/**
 * Wordmark — marca tipográfica del producto tlamx.
 *
 * Display: Comfortaa (`font-brand` / BRAND.displayFontFamily).
 * En BrandLockup se aplica además `.brand-wordmark-thick`.
 * El isotipo vive en LatunoMark / BrandLockup.
 *
 * Variantes tipográficas:
 *   - default:  "tlamx" completo
 *   - compact:  monograma tipográfico (preferir LatunoMark en chrome)
 *
 * Reglas de color (onBrand ≠ onInk):
 *   - Lockup icono + nombre: BrandLockup (gap 0.5 × mark)
 *   - Color por default: --primary (`brand`)
 *   - `onBrand`: solo tipografía sobre `bg-primary` (avatar, tile, botón, banda brand).
 *     Usa `text-primary-foreground` — no usar sobre ink/sidebar.
 *   - `onInk`: tipografía sobre chrome ink (`bg-sidebar` / superficies ink).
 *     Usa `text-palette-brand-on-ink` (teal-light tipográfico hue 205) —
 *     no blanco plano ni `text-primary` del CTA/mark.
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
   * - "onBrand": color primary-foreground — solo sobre `bg-primary`
   * - "onInk":   color palette-brand-on-ink (teal-light) — sobre chrome ink / sidebar
   * - "muted":   color muted-foreground (estados deshabilitados)
   * - "current": hereda currentColor del padre
   */
  variant?: "brand" | "onBrand" | "onInk" | "muted" | "current";

  className?: string;
  style?: CSSProperties;
  decorative?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<WordmarkProps["variant"]>, string> = {
  brand: "text-primary",
  onBrand: "text-primary-foreground",
  onInk: "text-palette-brand-on-ink",
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
