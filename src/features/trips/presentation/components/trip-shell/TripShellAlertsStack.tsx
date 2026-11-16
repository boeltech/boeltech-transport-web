/**
 * D4 / D32: un solo aviso visible + «Ver N avisos más».
 */

import { useState, type ReactElement, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.shell.alertsStack;

export type TripShellAlertsStackProps = {
  /** Avisos ya ordenados por prioridad (mayor primero). */
  alerts: readonly ReactElement[];
  className?: string;
};

export function TripShellAlertsStack({
  alerts,
  className,
}: TripShellAlertsStackProps) {
  const [expanded, setExpanded] = useState(false);
  if (alerts.length === 0) return null;

  const visible: ReactNode =
    expanded || alerts.length === 1 ? alerts : alerts.slice(0, 1);
  const hiddenCount = alerts.length - 1;

  return (
    <div
      className={cn("space-y-3", className)}
      data-testid="trip-shell-alerts-stack"
    >
      {visible}
      {hiddenCount > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs text-muted-foreground"
          aria-expanded={expanded}
          data-testid="trip-shell-alerts-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              {copy.showLess}
              <ChevronUp className="h-3 w-3" aria-hidden />
            </>
          ) : (
            <>
              {copy.showMore(hiddenCount)}
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1.5 font-mono text-[11px] text-foreground">
                {hiddenCount}
              </span>
              <ChevronDown className="h-3 w-3" aria-hidden />
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}
