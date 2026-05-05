/**
 * SatFieldLabel
 *
 * Etiqueta legible y, debajo opcional, badge con clave SAT.
 * En grillas de formulario suele combinarse con una fila flexible entre etiqueta y control para alinear inputs entre columnas.
 * Usado en formularios y filas de detalle para unificar el lenguaje visual.
 */

import type { ReactNode } from "react";
import { Badge } from "@shared/ui/badge";

export interface SatFieldLabelProps {
  label: ReactNode;
  satCode?: string;
  showSatCode?: boolean;
}

export function SatFieldLabel({
  label,
  satCode,
  showSatCode = true,
}: SatFieldLabelProps) {
  const shouldRenderBadge = Boolean(satCode) && showSatCode;

  return (
    <span className="inline-flex max-w-full flex-col items-start gap-1 leading-tight">
      <span className="min-w-0">{label}</span>
      {shouldRenderBadge ? (
        <Badge
          variant="outline"
          className="w-fit shrink-0 px-1.5 py-0 text-[10px] font-medium"
        >
          {satCode}
        </Badge>
      ) : null}
    </span>
  );
}
