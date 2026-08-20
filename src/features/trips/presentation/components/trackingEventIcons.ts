import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  MapPin,
  Navigation,
  Package,
  RotateCcw,
  Send,
  StickyNote,
} from "lucide-react";

import type { TrackingEventType } from "@features/trips/domain";

export function resolveTrackingEventIcon(
  eventType: TrackingEventType,
): LucideIcon {
  switch (eventType) {
    case "incident":
      return AlertTriangle;
    case "note":
      return StickyNote;
    case "trip_dispatched":
      return Send;
    case "trip_departed":
      return Navigation;
    case "trip_arrived":
      return CheckCircle2;
    case "false_trip_declared":
      return Ban;
    case "stop_departed":
      return Navigation;
    case "cargo_picked_up":
      return Package;
    case "cargo_delivered":
      return CheckCircle2;
    case "cargo_returned":
      return RotateCcw;
    case "cargo_cancelled":
      return Ban;
    case "stop_arrived":
    default:
      return MapPin;
  }
}
