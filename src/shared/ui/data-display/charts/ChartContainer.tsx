/**
 * ChartContainer — ResponsiveContainer DS-aware.
 * Aísla el import de layout de recharts para el resto del design system.
 */

import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@shared/lib/utils/cn";

export interface ChartContainerProps {
  children: ReactElement;
  /** Altura del área de chart en px. Default: 240. */
  height?: number;
  className?: string;
  /** Ancho y alto reales del área al montar y al redimensionar. */
  onResize?: (width: number, height: number) => void;
}

export function ChartContainer({
  children,
  height = 240,
  className,
  onResize,
}: ChartContainerProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" onResize={onResize}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
