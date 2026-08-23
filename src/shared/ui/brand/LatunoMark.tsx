/**
 * LatunoMark — isotipo canónico B (portal).
 *
 * Fuente: public/brand/latuno-mark-b-portal*.svg
 * viewBox ceñido al ink para paridad óptica. Preferir este componente en UI;
 * los SVG en /public son assets estáticos (favicon, export, docs).
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { BRAND } from "./brandIdentity";

export interface LatunoMarkProps {
  /**
   * - "brand":   paths en primary (fondos claros)
   * - "onBrand": paths en primary-foreground (fondos primary)
   * - "tile":    tile primary + paths blancos
   * - "current": hereda currentColor
   */
  variant?: "brand" | "onBrand" | "tile" | "current";
  /** Tamaño del icono (lado). Default 28. */
  size?: number;
  className?: string;
  decorative?: boolean;
}

/** @deprecated Use LatunoMarkProps */
export type TlamaMarkProps = LatunoMarkProps;

const VARIANT_CLASSES: Record<
  NonNullable<LatunoMarkProps["variant"]>,
  string
> = {
  brand: "text-primary",
  onBrand: "text-primary-foreground",
  tile: "bg-primary text-primary-foreground",
  current: "text-current",
};

/** Geometría portal B — viewBox ceñido (`10 14 80 70`). */
function Paths({ className }: { className?: string }) {
  return (
    <svg
      viewBox="10 14 80 70"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <rect x="14" y="18" width="72" height="12" rx="2" />
      <path d="M20 38 L40 38 A2 2 0 0 1 42 40 L42 78 A2 2 0 0 1 40 80 L28 80 A2 2 0 0 1 26 78 L26 50 L20 50 A2 2 0 0 1 18 48 L18 40 A2 2 0 0 1 20 38 Z" />
      <path d="M80 38 L60 38 A2 2 0 0 0 58 40 L58 78 A2 2 0 0 0 60 80 L72 80 A2 2 0 0 0 74 78 L74 50 L80 50 A2 2 0 0 0 82 48 L82 40 A2 2 0 0 0 80 38 Z" />
    </svg>
  );
}

export const LatunoMark = memo(function LatunoMark({
  variant = "brand",
  size = 28,
  className,
  decorative = false,
}: LatunoMarkProps) {
  if (variant === "tile") {
    return (
      <span
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : BRAND.productName}
        role={decorative ? undefined : "img"}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-[22%] select-none",
          VARIANT_CLASSES.tile,
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Paths className="h-[78%] w-[78%]" />
      </span>
    );
  }

  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : BRAND.productName}
      role={decorative ? undefined : "img"}
      className={cn(
        "inline-flex shrink-0 select-none",
        VARIANT_CLASSES[variant],
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Paths className="h-full w-full" />
    </span>
  );
});

/** @deprecated Use LatunoMark */
export const TlamaMark = LatunoMark;

export default LatunoMark;
