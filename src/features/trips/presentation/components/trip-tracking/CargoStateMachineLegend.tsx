import { ArrowRight, ChevronDown } from "lucide-react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { legendCopy } from "./transitionCopy";
import { useTrackingLegendCollapsed } from "./useTrackingLegendCollapsed";

export function CargoStateMachineLegend({ className }: { className?: string }) {
  const { collapsed, expand, collapse } = useTrackingLegendCollapsed("cargo");
  const copy = legendCopy.cargo;

  if (collapsed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-7 px-2 text-xs text-muted-foreground", className)}
        onClick={expand}
      >
        {copy.expand}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs",
        className,
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-medium text-muted-foreground">{copy.title}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px] text-muted-foreground"
          onClick={collapse}
        >
          <ChevronDown className="mr-0.5 h-3 w-3" />
          {copy.collapse}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        {copy.flow.map((state, index) => (
          <span key={state} className="inline-flex items-center gap-1.5">
            <span className="rounded-full border bg-background px-2 py-0.5 font-medium">
              {state}
            </span>
            {index < copy.flow.length - 1 ? (
              <ArrowRight className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
            ) : null}
          </span>
        ))}
        <span className="text-muted-foreground/70">·</span>
        {copy.terminals.map((state) => (
          <span
            key={state}
            className="rounded-full border border-dashed bg-background px-2 py-0.5 font-medium"
          >
            {state}
          </span>
        ))}
      </div>
    </div>
  );
}
