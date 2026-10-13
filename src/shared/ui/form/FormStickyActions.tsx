/**
 * FormStickyActions
 *
 * Pie de acciones sticky para formularios largos (FormPageShell / edit).
 * Mantiene Cancelar / Guardar visibles sin scroll al fondo (desktop).
 *
 * Primera instancia de producto: EditVehiclePage · BranchForm (edit).
 * Doc: `.agents/skills/design-system/SKILL.md` § Formularios largos.
 */

import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";

export interface FormStickyActionsProps {
  children: ReactNode;
  /** Sticky inferior (default true). `false` = fila de acciones al flujo. */
  sticky?: boolean;
  className?: string;
}

export function FormStickyActions({
  children,
  sticky = true,
  className,
}: FormStickyActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t pt-4",
        sticky &&
          "sticky bottom-0 z-20 -mx-4 mt-6 border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
