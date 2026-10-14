/**
 * PaletteSwitch — conmutador DS v1 (azul-tinta) ↔ v2 (Patio ink+ámbar+brand).
 * Pensado para `/design-system` y preview; default de producto = v2.
 */

import { memo } from "react";
import { useTheme } from "@/shared/hooks/useTheme";
import { Button } from "@/shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import {
  COLOR_PALETTE_CYCLE,
  COLOR_PALETTE_META,
  type ColorPaletteId,
} from "./paletteRuntime";

interface PaletteSegmentedProps {
  className?: string;
  /** Compacto: solo shortLabel (v1 / v2) */
  compact?: boolean;
}

export const PaletteSegmented = memo(function PaletteSegmented({
  className,
  compact = false,
}: PaletteSegmentedProps) {
  const { colorPalette, setColorPalette } = useTheme();

  return (
    <div
      role="group"
      aria-label="Paleta de color del design system"
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-muted/60 p-0.5",
        className,
      )}
    >
      {COLOR_PALETTE_CYCLE.map((id) => {
        const meta = COLOR_PALETTE_META[id];
        const active = colorPalette === id;
        return (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={active ? "default" : "ghost"}
            aria-pressed={active}
            onClick={() => setColorPalette(id as ColorPaletteId)}
            className={cn(
              "h-8 rounded-md px-3 text-xs font-medium shadow-none",
              !active && "text-muted-foreground",
            )}
          >
            {compact ? meta.shortLabel : meta.label}
          </Button>
        );
      })}
    </div>
  );
});
