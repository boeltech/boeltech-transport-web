/**
 * BrandLockup — logo canónico tlamx: isotipo portal B + wordmark Comfortaa.
 *
 * Display: Comfortaa (`BRAND.displayFontFamily`) + stroke `.brand-wordmark-thick`.
 * Espaciado guía (Rilxer): mark 100 · wordmark 100 · gap 50 (= 0.5 × markSize).
 * Alineación vertical: `items-center` + nudge óptico (`WORDMARK_OPTICAL_Y_OFFSET_RATIO`)
 * para centrar el wordmark respecto al ink del portal (viewBox ceñido + sin descendentes).
 *
 * Color (`variant` → wordmark; mark deriva salvo `markVariant`):
 *   - `brand`: mark + wordmark primary (fondos claros)
 *   - `onBrand`: wordmark + mark en primary-foreground — solo sobre `bg-primary`
 *   - `onInk`: wordmark palette-brand-on-ink (teal-light); mark default `brand` — chrome ink
 *   - No mezclar `onBrand` sobre ink/sidebar: en dark v2 primary-foreground es casi ink.
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { LatunoMark } from "./LatunoMark";
import type { LatunoMarkProps } from "./LatunoMark";
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
  /**
   * Color del wordmark (y del mark, salvo `markVariant`).
   * Ver JSDoc del módulo: `onBrand` = fondo primary; `onInk` = chrome ink.
   */
  variant?: WordmarkProps["variant"];
  /**
   * Override del color del mark (p. ej. mark brand + wordmark onBrand sobre `bg-primary`).
   * Si no se pasa: `onBrand` → mark onBrand; `onInk` / `brand` → mark brand;
   * `muted` / `current` → mark current.
   */
  markVariant?: LatunoMarkProps["variant"];
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
  markVariant: markVariantProp,
  markSize = 28,
  className,
  wordmarkClassName,
  displayFontFamily = BRAND.displayFontFamily,
  decorative = false,
}: BrandLockupProps) {
  // onInk → brand (teal on ink). onBrand → onBrand. Never default mark to onBrand for onInk.
  const markVariant =
    markVariantProp ??
    (variant === "onBrand"
      ? "onBrand"
      : variant === "muted" || variant === "current"
        ? "current"
        : "brand");

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
