/**
 * Wordmark — Boeltech brand mark
 *
 * Marca tipográfica de Boeltech. Sin ícono, sin símbolo: solo el wordmark
 * en Geist Sans con tracking ajustado y color primario.
 *
 * Variantes:
 *   - default:  "Boeltech" completo, optimizado para el header del sidebar
 *               expandido o pantallas de auth.
 *   - compact:  Solo "B", optimizado para el sidebar colapsado, favicons
 *               internos o avatars de la marca.
 *
 * Reglas de uso:
 *   - Color por default: --primary (azul-tinta de marca).
 *   - Tamaño controlado vía className (text-lg, text-xl, etc.).
 *   - Para fondos azules / oscuros, pasar variant="onBrand" para usar
 *     primary-foreground.
 *
 * Ubicación: src/shared/ui/brand/Wordmark.tsx
 */

import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";

export interface WordmarkProps {
  /**
   * Si es true, muestra solo "B" (para sidebar colapsado).
   * Si es false (default), muestra "Boeltech" completo.
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
   */
  className?: string;

  /**
   * Accesibilidad: si el wordmark es decorativo (porque ya hay texto
   * "Boeltech" cerca), márcalo como true para que screen readers lo
   * ignoren. Default false (se anuncia como "Boeltech").
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
  decorative = false,
}: WordmarkProps) {
  const text = compact ? "B" : "Boeltech";

  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Boeltech"}
      role={decorative ? undefined : "img"}
      className={cn(
        "font-sans font-bold leading-none select-none",
        // Tracking ligeramente negativo da una sensación más editorial
        // y compacta. Solo aplicamos al wordmark completo.
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
