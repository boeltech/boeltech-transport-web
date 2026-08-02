/**
 * BrandLockup — isotipo Tlama (ink) + wordmark.
 *
 * Uso tipico: sidebar, landing header, auth. En compact solo el mark.
 * Canonico: geometria `tlama-mark-g-paths-ink` (azul sobre transparente).
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Wordmark } from "./Wordmark";
import { TlamaMark } from "./TlamaMark";
import type { WordmarkProps } from "./Wordmark";

export interface BrandLockupProps {
  /** Solo el mark (sidebar colapsado). */
  compact?: boolean;
  /** Color del wordmark y del mark. */
  variant?: WordmarkProps["variant"];
  /** Lado del mark. Default 28. */
  markSize?: number;
  className?: string;
  wordmarkClassName?: string;
  /** Padre ya anuncia el producto (Link con aria-label). */
  decorative?: boolean;
}

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

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-hidden={decorative || undefined}
    >
      <TlamaMark
        variant={markVariant}
        size={compact ? Math.max(markSize, 32) : markSize}
        decorative
      />
      {!compact ? (
        <Wordmark
          variant={variant}
          decorative
          className={cn("text-xl", wordmarkClassName)}
        />
      ) : null}
    </span>
  );
});

export default BrandLockup;
