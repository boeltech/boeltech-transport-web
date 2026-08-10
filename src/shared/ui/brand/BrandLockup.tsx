/**
 * BrandLockup — logo de producto laTuno: «la» + isotipo G + «uno».
 *
 * La letra tipográfica «T» se sustituye por `LatunoMark`
 * (`tlama-mark-g-paths-ink`). Espaciado: altura tipográfica ≈ markSize;
 * gap óptico entre segmentos vía `brandLockupMetrics`.
 * Safe area 0.5×mark solo en assets estáticos (`latuno-lockup-safe-area.svg`).
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { LatunoMark } from "./LatunoMark";
import type { WordmarkProps } from "./Wordmark";
import { BRAND } from "./brandIdentity";
import {
  brandLockupGapPx,
  brandLockupWordmarkFontSizePx,
} from "./brandLockupMetrics";

export interface BrandLockupProps {
  /** Solo el mark (sidebar colapsado). */
  compact?: boolean;
  /** Color del wordmark y del mark. */
  variant?: WordmarkProps["variant"];
  /** Lado del mark (= altura canónica del logo). Default 28. */
  markSize?: number;
  className?: string;
  /** Clases extra en los segmentos tipográficos «la» / «uno». */
  wordmarkClassName?: string;
  /** Padre ya anuncia el producto (Link con aria-label). */
  decorative?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<WordmarkProps["variant"]>, string> = {
  brand: "text-primary",
  onBrand: "text-primary-foreground",
  muted: "text-muted-foreground",
  current: "text-current",
};

export const BrandLockup = memo(function BrandLockup({
  compact = false,
  variant = "brand",
  markSize = 28,
  className,
  wordmarkClassName,
  decorative = false,
}: BrandLockupProps) {
  const markVariant =
    variant === "onBrand"
      ? "onBrand"
      : variant === "muted" || variant === "current"
        ? "current"
        : "brand";

  const gapPx = brandLockupGapPx(markSize);
  const wordmarkPx = brandLockupWordmarkFontSizePx(markSize);

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center", className)}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : BRAND.productName}
        role={decorative ? undefined : "img"}
      >
        <LatunoMark
          variant={markVariant}
          size={Math.max(markSize, 32)}
          decorative
        />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{ gap: gapPx }}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : BRAND.productName}
      role={decorative ? undefined : "img"}
    >
      <span
        className={cn(
          "font-sans font-bold leading-none select-none tracking-[-0.02em]",
          VARIANT_CLASSES[variant],
          wordmarkClassName,
        )}
        style={{ fontSize: wordmarkPx }}
        aria-hidden
      >
        la
      </span>
      <LatunoMark variant={markVariant} size={markSize} decorative />
      <span
        className={cn(
          "font-sans font-bold leading-none select-none tracking-[-0.02em]",
          VARIANT_CLASSES[variant],
          wordmarkClassName,
        )}
        style={{ fontSize: wordmarkPx }}
        aria-hidden
      >
        uno
      </span>
    </span>
  );
});

export default BrandLockup;
