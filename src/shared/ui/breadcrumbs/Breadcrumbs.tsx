/**
 * Breadcrumbs — migas de navegación local Operate (NL3).
 *
 * `<nav aria-label><ol>`; chevron 12 px; máx. 3 eslabones; mono sin truncar.
 */

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";

export type Crumb = {
  label: string;
  /** Sin `to` = página actual (último eslabón): sin link, aria-current="page". */
  to?: string;
  /** Códigos/folios: mono, sin truncar. */
  mono?: boolean;
};

export interface BreadcrumbsProps {
  /** 1..3; >3 → warning en dev y recorte del medio. */
  crumbs: readonly Crumb[];
  "aria-label"?: string;
  className?: string;
}

const MAX_CRUMBS = 3;

function trimCrumbs(crumbs: readonly Crumb[]): Crumb[] {
  if (crumbs.length <= MAX_CRUMBS) return [...crumbs];
  if (import.meta.env.DEV) {
    console.warn(
      `[Breadcrumbs] máx. ${MAX_CRUMBS} eslabones; se recibieron ${crumbs.length}. Se recorta el medio.`,
    );
  }
  const first = crumbs[0];
  const tail = crumbs.slice(-(MAX_CRUMBS - 1));
  if (!first) return tail;
  return [first, ...tail];
}

function CrumbLabel({ crumb, isCurrent }: { crumb: Crumb; isCurrent: boolean }) {
  const className = cn(
    crumb.mono && "font-mono tabular-nums",
    !crumb.mono && "max-w-[40ch] truncate",
    isCurrent && "font-medium text-foreground",
  );

  const text = <span className={className}>{crumb.label}</span>;

  // Mono no trunca. No-mono: truncado 40ch + tooltip del texto completo.
  if (crumb.mono) return text;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{text}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        {crumb.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function Breadcrumbs({
  crumbs,
  "aria-label": ariaLabel = "Migas",
  className,
}: BreadcrumbsProps) {
  const items = trimCrumbs(crumbs);
  if (items.length === 0) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <nav aria-label={ariaLabel} className={cn("text-xs leading-4", className)}>
        <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 text-muted-foreground">
          {items.map((crumb, index) => {
            const isLast = index === items.length - 1;
            const isCurrent = isLast || crumb.to == null;

            return (
              <li
                key={`${crumb.label}-${index}`}
                className="inline-flex items-center gap-1.5"
              >
                {index > 0 ? (
                  <ChevronRight
                    className="h-3 w-3 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                ) : null}
                {isCurrent || crumb.to == null ? (
                  <span aria-current={isLast ? "page" : undefined}>
                    <CrumbLabel crumb={crumb} isCurrent={isLast} />
                  </span>
                ) : (
                  <Link
                    to={crumb.to}
                    className="text-muted-foreground no-underline hover:text-foreground hover:underline"
                  >
                    <CrumbLabel crumb={crumb} isCurrent={false} />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </TooltipProvider>
  );
}
