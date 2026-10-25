import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { CargoStateMachineLegend } from "./CargoStateMachineLegend";
import { StopStateMachineLegend } from "./StopStateMachineLegend";
import { legendCopy } from "./transitionCopy";
import { useTrackingLegendCollapsed } from "./useTrackingLegendCollapsed";

type TrackingStatesLegendProps = {
  /** Mostrar leyenda de cargas cuando el viaje tiene cargas. */
  showCargo?: boolean;
  className?: string;
};

/**
 * PD8 — una leyenda colapsada bajo el riel («¿Qué significan los estados?»).
 * Reutiliza las leyendas de parada/carga; un solo CTA cuando ambas están colapsadas.
 */
export function TrackingStatesLegend({
  showCargo = false,
  className,
}: TrackingStatesLegendProps) {
  const stop = useTrackingLegendCollapsed("stop");
  const cargo = useTrackingLegendCollapsed("cargo");
  const bothCollapsed = stop.collapsed && (!showCargo || cargo.collapsed);

  if (bothCollapsed) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("h-7 px-2 text-xs text-muted-foreground", className)}
        onClick={() => {
          stop.expand();
          if (showCargo) cargo.expand();
        }}
      >
        {legendCopy.states.expand}
      </Button>
    );
  }

  return (
    <div
      className={cn("flex flex-wrap items-start gap-2", className)}
      data-tracking-legend="states"
    >
      <StopStateMachineLegend />
      {showCargo ? <CargoStateMachineLegend /> : null}
    </div>
  );
}
