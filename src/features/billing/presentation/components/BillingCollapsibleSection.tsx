import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";

interface BillingCollapsibleSectionProps {
  title: string;
  description?: string;
  expandLabel: string;
  collapseLabel: string;
  /** Default closed (D4). */
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Sección secundaria colapsable bajo el resumen (Detalle / Historial / Método).
 * Patrón alineado a settings BillingDefaultsCard — menos chrome que N cards.
 */
export function BillingCollapsibleSection({
  title,
  description,
  expandLabel,
  collapseLabel,
  defaultOpen = false,
  children,
  className,
}: BillingCollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-start justify-between gap-4 p-4 text-left sm:p-5"
            aria-expanded={open}
          >
            <div className="min-w-0">
              <h3 className="text-base font-semibold">{title}</h3>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
              {open ? collapseLabel : expandLabel}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 border-t px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
