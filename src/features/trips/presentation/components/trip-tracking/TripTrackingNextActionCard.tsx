import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Navigation,
  Package,
  Send,
  StickyNote,
} from "lucide-react";

import type { TripCargo, TripStatusType, TripStop } from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

import { trackingCopy } from "../../copy";
import { resolveTrackingPrimaryAction } from "./trackingNextAction";

export type TripTrackingNextActionCardProps = {
  tripStatus: TripStatusType;
  stops: readonly TripStop[];
  cargos?: readonly TripCargo[];
  onStartTrip: () => void;
  onArrive: () => void;
  onDepart: () => void;
  onDepartOrigin: () => void;
  onCloseTrip: () => void;
  onRegisterNote: () => void;
  onRegisterIncident: () => void;
  canRegisterNote?: boolean;
  canRegisterIncident?: boolean;
  className?: string;
};

function actionIcon(kind: ReturnType<typeof resolveTrackingPrimaryAction>["kind"]) {
  switch (kind) {
    case "dispatch":
      return Send;
    case "arrive":
      return MapPin;
    case "depart":
    case "depart_origin":
      return Navigation;
    case "close":
      return CheckCircle2;
    case "cargo_blocked":
      return Package;
    default:
      return MapPin;
  }
}

export function TripTrackingNextActionCard({
  tripStatus,
  stops,
  cargos,
  onStartTrip,
  onArrive,
  onDepart,
  onDepartOrigin,
  onCloseTrip,
  onRegisterNote,
  onRegisterIncident,
  canRegisterNote = tripStatus === TripStatus.IN_PROGRESS,
  canRegisterIncident = tripStatus === TripStatus.IN_PROGRESS,
  className,
}: TripTrackingNextActionCardProps) {
  const primary = resolveTrackingPrimaryAction(tripStatus, stops, cargos);
  const Icon = actionIcon(primary.kind);
  const hasPrimaryCta =
    primary.kind === "dispatch" ||
    primary.kind === "arrive" ||
    primary.kind === "depart" ||
    primary.kind === "depart_origin" ||
    primary.kind === "close";

  const handleGoToCargos = () => {
    document
      .getElementById("tracking-stops-cargos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePrimary = () => {
    switch (primary.kind) {
      case "dispatch":
        onStartTrip();
        break;
      case "arrive":
        onArrive();
        break;
      case "depart":
        onDepart();
        break;
      case "depart_origin":
        onDepartOrigin();
        break;
      case "close":
        onCloseTrip();
        break;
      default:
        break;
    }
  };

  return (
    <Card
      className={cn(
        "border-primary/40 bg-primary/5",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Próxima acción esperada</CardTitle>
        <CardDescription>
          {hasPrimaryCta
            ? "Acción sugerida según el estado actual del viaje."
            : primary.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
              hasPrimaryCta
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
            )}
            aria-hidden
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-semibold">{primary.title}</p>
            {primary.transitionText ? (
              <p className="text-xs text-muted-foreground">
                {primary.transitionText}
              </p>
            ) : null}
            {hasPrimaryCta ? (
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                onClick={handlePrimary}
              >
                <Icon className="mr-2 h-4 w-4 shrink-0" />
                {primary.title}
              </Button>
            ) : null}
            {primary.kind === "cargo_blocked" ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleGoToCargos}
              >
                <Package className="mr-2 h-4 w-4 shrink-0" />
                {trackingCopy.action.goToCargos}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canRegisterNote}
            onClick={onRegisterNote}
            title={
              canRegisterNote
                ? undefined
                : trackingCopy.error.registerRequiresInProgress
            }
          >
            <StickyNote className="mr-2 h-4 w-4" />
            {trackingCopy.action.note}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canRegisterIncident}
            onClick={onRegisterIncident}
            title={
              canRegisterIncident
                ? undefined
                : trackingCopy.error.registerRequiresInProgress
            }
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {trackingCopy.action.incident}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
