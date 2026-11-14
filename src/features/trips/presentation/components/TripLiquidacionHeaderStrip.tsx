/**
 * Franja bajo subtítulo del detalle de viaje — modo fiscal + CTAs + Historial.
 * Feature-local (trips); no promover a design system en este tren (D-P3).
 */
import type { ReactNode } from "react";

import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";

import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";

const copy = cfdiEmissionIntentCopy;

export type TripLiquidacionHeaderStripProps = {
  mode: "sin_factura" | "con_factura";
  /** Preferir null si el freeze vive en alerts. */
  lockReason?: string | null;
  actions?: ReactNode;
  onOpenHistory: () => void;
  historyLabel?: string;
  showHistory?: boolean;
  label?: string;
};

export function TripLiquidacionHeaderStrip({
  mode,
  lockReason = null,
  actions,
  onOpenHistory,
  historyLabel = copy.governance.history,
  showHistory = true,
  label,
}: TripLiquidacionHeaderStripProps) {
  const isSinFactura = mode === "sin_factura";

  return (
    <div className="flex flex-wrap items-center gap-2 text-foreground">
      {label ? (
        <span className="text-xs text-muted-foreground">{label}</span>
      ) : null}
      <Badge
        variant={isSinFactura ? "warning" : "outline"}
        tone="soft"
        className="text-xs"
      >
        {isSinFactura ? copy.chip.sinCfdi : copy.chip.conCfdi}
      </Badge>
      {actions}
      {lockReason ? (
        <span className="text-xs text-muted-foreground">{lockReason}</span>
      ) : null}
      {showHistory ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onOpenHistory}
        >
          {historyLabel}
        </Button>
      ) : null}
    </div>
  );
}
