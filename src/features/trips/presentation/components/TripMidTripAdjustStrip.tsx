/**
 * Strip mid-trip (F4 / D7): deep-links a paradas pendientes / carga / reasignar.
 * Sin tab nuevo — vive en chrome del detalle (alerts).
 */

import { MapPin, Package, Truck } from "lucide-react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../copy";
import type { MidTripAdjustLink } from "../helpers/listMidTripAdjustLinks";

const copy = tripDetailCopy.shell.midTripStrip;

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
      aria-labelledby="trip-mid-trip-adjust-title"
    >
      <p
        id="trip-mid-trip-adjust-title"
        className="text-sm font-medium text-foreground"
      >
        {copy.title}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{copy.description}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
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
