/**
 * TlamaMark — isotipo G (T con caminos).
 *
 * Fuente: public/brand/tlama-mark-g-paths*.svg
 * Preferir este componente en UI; los SVG en /public son assets estaticos
 * (favicon, export, docs).
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { BRAND } from "./brandIdentity";

export interface TlamaMarkProps {
  /**
   * - "brand":   paths en primary (fondos claros)
   * - "onBrand": paths en primary-foreground (fondos primary)
   * - "tile":    tile primary + paths blancos (alternativa; UI usa ink/brand)
   * - "current": hereda currentColor
   */
  variant?: "brand" | "onBrand" | "tile" | "current";
  /** Tamano del icono (lado). Default 28. */
  size?: number;
  className?: string;
  decorative?: boolean;
}

const VARIANT_CLASSES: Record<
  NonNullable<TlamaMarkProps["variant"]>,
  string
> = {
  brand: "text-primary",
  onBrand: "text-primary-foreground",
  tile: "bg-primary text-primary-foreground",
  current: "text-current",
};

function Paths({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <rect x="8" y="15" width="84" height="10" rx="1" />
      <path d="M9 31 L46 31 A1 1 0 0 1 47 32 L47 83 A1 1 0 0 1 46 84 L37 84 A1 1 0 0 1 36 83 L36 41 L9 41 A1 1 0 0 1 8 40 L8 32 A1 1 0 0 1 9 31 Z" />
      <path d="M91 31 L54 31 A1 1 0 0 0 53 32 L53 83 A1 1 0 0 0 54 84 L63 84 A1 1 0 0 0 64 83 L64 41 L91 41 A1 1 0 0 0 92 40 L92 32 A1 1 0 0 0 91 31 Z" />
    </svg>
  );
}

export const TlamaMark = memo(function TlamaMark({
  variant = "brand",
  size = 28,
  className,
  decorative = false,
}: TlamaMarkProps) {
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

export default TlamaMark;
