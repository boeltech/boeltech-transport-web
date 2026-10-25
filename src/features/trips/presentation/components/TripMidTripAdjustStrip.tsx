/**
 * Strip mid-trip (F4 / D7 · F11b / D22): deep-links a paradas pendientes /
 * carga / reasignar. Chips-only — sin título ni descripción (D22 / D29).
 * Sin tab nuevo — vive en chrome del detalle (alerts).
 */

import { MapPin, Package, Truck } from "lucide-react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../copy";
import type { MidTripAdjustLink } from "../helpers/listMidTripAdjustLinks";

const copy = tripDetailCopy.shell.midTripStrip;

/** a11y region label (D29: «Ajustes», no «Ajustes en ruta»). Not rendered as title. */
const STRIP_ARIA_LABEL = "Ajustes";

export type TripMidTripAdjustStripProps = {
  links: readonly MidTripAdjustLink[];
  /** Paradas aún pendientes (label con conteo cuando > 0). */
  pendingStopCount?: number;
  onNavigate: (link: MidTripAdjustLink) => void;
  className?: string;
};

function linkLabel(
  link: MidTripAdjustLink,
  pendingStopCount: number | undefined,
): string {
  switch (link.id) {
    case "pending_stops":
      if (pendingStopCount != null && pendingStopCount > 0) {
        return copy.pendingStopsCount(pendingStopCount);
      }
      return copy.pendingStops;
    case "add_cargo":
      return copy.addCargo;
    case "reassign_fleet":
      return copy.reassignFleet;
  }
}

function LinkIcon({ id }: { id: MidTripAdjustLink["id"] }) {
  switch (id) {
    case "pending_stops":
      return <MapPin className="mr-1.5 h-3.5 w-3.5" aria-hidden />;
    case "add_cargo":
      return <Package className="mr-1.5 h-3.5 w-3.5" aria-hidden />;
    case "reassign_fleet":
      return <Truck className="mr-1.5 h-3.5 w-3.5" aria-hidden />;
  }
}

export function TripMidTripAdjustStrip({
  links,
  pendingStopCount,
  onNavigate,
  className,
}: TripMidTripAdjustStripProps) {
  if (links.length === 0) return null;

  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-muted/15 px-4 py-3",
        className,
      )}
      data-testid="trip-mid-trip-adjust-strip"
      aria-label={STRIP_ARIA_LABEL}
    >
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => (
          <Button
            key={link.id}
            type="button"
            variant="outline"
            size="sm"
            data-testid={`trip-mid-trip-link-${link.id}`}
            onClick={() => onNavigate(link)}
          >
            <LinkIcon id={link.id} />
            {linkLabel(link, pendingStopCount)}
          </Button>
        ))}
      </div>
    </section>
  );
}
