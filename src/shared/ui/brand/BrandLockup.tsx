/**
 * BrandLockup — logo canónico tlamx: isotipo portal B + wordmark Comfortaa.
 *
 * Display: Comfortaa (`BRAND.displayFontFamily`) + stroke `.brand-wordmark-thick`.
 * Espaciado guía (Rilxer): mark 100 · wordmark 100 · gap 50 (= 0.5 × markSize).
 * Alineación vertical: `items-center` + nudge óptico (`WORDMARK_OPTICAL_Y_OFFSET_RATIO`)
 * para centrar el wordmark respecto al ink del portal (viewBox ceñido + sin descendentes).
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { LatunoMark } from "./LatunoMark";
import { Wordmark } from "./Wordmark";
import type { WordmarkProps } from "./Wordmark";
import { BRAND } from "./brandIdentity";
import {
  brandLockupGapPx,
  brandLockupWordmarkFontSizePx,
  brandLockupWordmarkOpticalOffsetPx,
} from "./brandLockupMetrics";

export interface BrandLockupProps {
  /** Solo el mark (sidebar colapsado). */
  compact?: boolean;
  /** Color del wordmark y del mark. */
  variant?: WordmarkProps["variant"];
  /** Lado del mark (= altura canónica del logo). Default 28. */
  markSize?: number;
  className?: string;
  /** Clases extra en el wordmark (tracking, etc.). */
  wordmarkClassName?: string;
  /**
   * Override tipográfico del wordmark.
   * Default: `BRAND.displayFontFamily` (Comfortaa).
   */
  displayFontFamily?: string;
  /** Padre ya anuncia el producto (Link con aria-label). */
  decorative?: boolean;
}

export const BrandLockup = memo(function BrandLockup({
  compact = false,
  variant = "brand",
  markSize = 28,
  className,
  wordmarkClassName,
  displayFontFamily = BRAND.displayFontFamily,
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
  const wordmarkOpticalOffsetPx = brandLockupWordmarkOpticalOffsetPx(markSize);

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
      <LatunoMark variant={markVariant} size={markSize} decorative />
      <Wordmark
        variant={variant}
        decorative
        className={cn("lowercase brand-wordmark-thick", wordmarkClassName)}
        style={{
          fontSize: wordmarkPx,
          fontFamily: displayFontFamily,
          // Centro óptico mark↔wordmark (Comfortaa sin descendentes + portal B).
          transform: `translateY(${wordmarkOpticalOffsetPx}px)`,
        }}
      />
    </span>
  );
});

export default BrandLockup;
