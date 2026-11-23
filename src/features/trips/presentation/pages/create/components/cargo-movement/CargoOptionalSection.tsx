/**
 * Sección plegable del sheet de carga (C5 / C9).
 * Patrón único: título + resumen 1 línea + «Editar» (cerrada) / chevrón (abierta).
 * C9: forceOpen + tono warning/destructive.
 */

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import { wizardCopy } from "../../../../copy";

const sheet = wizardCopy.cargo.sheet;

export interface CargoOptionalSectionProps {
  title: string;
  /** Resumen visible cuando la sección está cerrada. */
  summary: string;
  icon?: ReactNode;
  /** Abre la sección al montar (p. ej. si la carga ya trae datos). */
  defaultOpen?: boolean;
  /** Fuerza apertura (p. ej. error de validación o falta recogida). */
  forceOpen?: boolean;
  /** Borde ámbar (falta recogida) o rojo (error de sección). */
  tone?: "default" | "warning" | "destructive";
  children: ReactNode;
}

export function CargoOptionalSection({
  title,
  summary,
  icon,
  defaultOpen = false,
  forceOpen = false,
  tone = "default",
  children,
}: CargoOptionalSectionProps) {
  const [open, setOpen] = useState(defaultOpen || forceOpen);

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <Card
      className={cn(
        tone === "warning" && "border-warning/60 bg-warning/5",
        tone === "destructive" && "border-destructive/60 bg-destructive/5",
      )}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* C5: título + resumen 1 línea visibles también con la sección abierta. */}
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
            open && "border-b border-border",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-semibold leading-none tracking-tight">
              {icon ? (
                <span className="text-muted-foreground">{icon}</span>
              ) : null}
              {title}
            </span>
            <span
              className="mt-1 block truncate text-xs font-normal text-muted-foreground"
              title={summary}
            >
              {summary}
            </span>
          </span>
          {open ? (
            <ChevronDown
              className="h-4 w-4 shrink-0 rotate-180 text-muted-foreground transition-transform"
              aria-hidden
            />
          ) : (
            <span className="shrink-0 text-xs font-medium text-primary">
              {sheet.action.editSection}
            </span>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 px-4 pb-4 pt-4">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
