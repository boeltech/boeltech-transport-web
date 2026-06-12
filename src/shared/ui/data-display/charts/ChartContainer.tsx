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
}

export function ChartContainer({
  children,
  height = 240,
  className,
}: ChartContainerProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
