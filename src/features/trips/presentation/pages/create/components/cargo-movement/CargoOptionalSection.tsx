/**
 * Sección opcional colapsable del sheet de mercancía.
 *
 * Mantiene el lenguaje visual de `FormSectionCard` pero resume su contenido en
 * la cabecera cuando está cerrada, para que el formulario muestre primero lo
 * obligatorio (qué y cuánto se transporta).
 */

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";

export interface CargoOptionalSectionProps {
  title: string;
  /** Resumen visible cuando la sección está cerrada. */
  summary: string;
  icon?: ReactNode;
  /** Abre la sección al montar (p. ej. si la mercancía ya trae datos). */
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CargoOptionalSection({
  title,
  summary,
  icon,
  defaultOpen = false,
  children,
}: CargoOptionalSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left">
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-base font-semibold leading-none tracking-tight">
              {icon ? (
                <span className="text-muted-foreground">{icon}</span>
              ) : null}
              {title}
            </span>
            <span className="mt-1 block truncate text-sm font-normal text-muted-foreground">
              {summary}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
