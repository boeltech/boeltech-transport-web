/**
 * Wordmark — marca tipográfica del producto laTuno.
 *
 * Solo texto (Inter). El isotipo vive en LatunoMark / BrandLockup.
 *
 * Variantes:
 *   - default:  "laTuno" completo
 *   - compact:  "T" (monograma tipográfico; preferir LatunoMark en chrome)
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
   * Si es true, muestra solo el monograma "T" (sidebar colapsado).
   * Si es false (default), muestra "laTuno" completo.
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

  /**
   * Clases extra. Útil para tamaño (text-lg, text-xl, etc.) y spacing.
   * En BrandLockup el tamaño se fija vía `style.fontSize` (altura = mark).
   */
  className?: string;

  /** Estilo inline (p. ej. fontSize desde BrandLockup). */
  style?: CSSProperties;

  /**
   * Accesibilidad: si el wordmark es decorativo (porque el Link/padre
   * ya anuncia el producto), márcalo como true (aria-hidden).
   * Default false (se anuncia como "laTuno").
   */
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
      style={style}
      className={cn(
        "font-sans font-bold leading-none select-none",
        // Tracking ligeramente negativo: wordmark editorial/compacto.
        compact ? "tracking-tight" : "tracking-[-0.02em]",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {text}
    </span>
  );
});

export default Wordmark;
