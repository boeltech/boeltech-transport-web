/**
 * ListingFilterPanel
 *
 * Panel canónico «Filtros (n)» para ListPageShell: trigger outline + Collapsible
 * + Card con grid de recortes. La feature solo aporta los campos (Selects).
 *
 * Comportamiento de apertura:
 * - Con recortes activos (activeCount > 0): abierto por defecto; el usuario puede colapsar.
 * - Sin recortes: cerrado por defecto; el usuario puede expandir.
 */

import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";

export interface ListingFilterPanelProps {
  /** Texto del botón (p. ej. «Filtros»). */
  triggerLabel: string;
  /** Recortes activos del panel (no search ni vista). Badge si > 0. */
  activeCount: number;
  /** Campos del panel (Selects / DateRange / …). */
  children: ReactNode;
  /**
   * Clases del grid interno (`CardContent`).
   * La feature decide columnas según cuántos campos muestre.
   * Default: `grid gap-3 p-4 sm:grid-cols-2`.
   */
  contentClassName?: string;
  className?: string;
}

export function ListingFilterPanel({
  triggerLabel,
  activeCount,
  children,
  contentClassName,
  className,
}: ListingFilterPanelProps) {
  const [userCollapsedWhileActive, setUserCollapsedWhileActive] = useState(false);
  const [userExpandedWhileIdle, setUserExpandedWhileIdle] = useState(false);

  const hasActiveFilters = activeCount > 0;
  const open = hasActiveFilters
    ? !userCollapsedWhileActive
    : userExpandedWhileIdle;

  const handleOpenChange = (next: boolean) => {
    if (hasActiveFilters) {
      setUserCollapsedWhileActive(!next);
      return;
    }
    setUserExpandedWhileIdle(next);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className={cn("contents", className)}
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {triggerLabel}
          {activeCount > 0 ? (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
              {activeCount}
            </Badge>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="order-last w-full basis-full">
        <Card className="bg-muted/30">
          <CardContent
            className={cn("grid gap-3 p-4 sm:grid-cols-2", contentClassName)}
          >
            {children}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
