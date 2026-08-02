import {
  CheckCircle2,
  MapPin,
  Navigation,
  Package,
  Send,
} from "lucide-react";

import type { TripCargo, TripStatusType, TripStop } from "@features/trips/domain";
import { TripStatus } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";

import { trackingCopy } from "../../copy";
import {
  resolveTrackingPrimaryAction,
  type TrackingPrimaryActionKind,
} from "./trackingNextAction";

export type TripTrackingNextActionCardProps = {
  tripStatus: TripStatusType;
  stops: readonly TripStop[];
  cargos?: readonly TripCargo[];
  /**
   * Lleva el foco al hub «Paradas y cargas» (p. ej. cargas pendientes).
   * El padre asigna el nonce de `TrackingOperationalFocusRequest`.
   */
  onNavigateToOperationalHub?: (stopId: string) => void;
  className?: string;
};

function actionIcon(kind: TrackingPrimaryActionKind) {
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

const OPERABLE_GUIDE_KINDS = new Set<TrackingPrimaryActionKind>([
  "dispatch",
  "arrive",
  "depart",
  "depart_origin",
  "close",
]);

function isTerminalTripStatus(status: TripStatusType): boolean {
  return (
    status === TripStatus.COMPLETED || status === TripStatus.CANCELLED
  );
}

function resolveGuideDescription(
  kind: TrackingPrimaryActionKind,
  title: string,
): string {
  if (kind === "none") return trackingCopy.hint.readOnlyGuide;
  if (kind === "idle") return trackingCopy.hint.idleGuide;
  if (OPERABLE_GUIDE_KINDS.has(kind) || kind === "cargo_blocked") {
    return trackingCopy.hint.objectiveGuide;
  }
  return title;
}

/**
 * Guía de orientación: qué sigue y por qué.
 * Las mutaciones (parada, carga, Nota/Incidente) viven solo en «Paradas y cargas».
 */
export function TripTrackingNextActionCard({
  tripStatus,
  stops,
  cargos,
  onNavigateToOperationalHub,
  className,
}: TripTrackingNextActionCardProps) {
  const primary = resolveTrackingPrimaryAction(tripStatus, stops, cargos);
  const Icon = actionIcon(primary.kind);
  const terminal = isTerminalTripStatus(tripStatus);
  const isReadOnlyGuide =
    terminal || primary.kind === "none" || primary.kind === "idle";
  const showsOperableHint = OPERABLE_GUIDE_KINDS.has(primary.kind);
  const showsCargoNavigate = primary.kind === "cargo_blocked";
  const description = resolveGuideDescription(primary.kind, primary.title);

  const handleGoToOperationalHub = () => {
    const stopId = primary.stop?.id;
    if (stopId != null) {
      onNavigateToOperationalHub?.(stopId);
    }
    document
      .getElementById("tracking-stops-cargos")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Card
      className={cn(
        terminal || primary.kind === "none"
          ? "border-border bg-muted/30"
          : primary.kind === "idle"
            ? "border-border bg-card"
            : "border-primary/40 bg-primary/5",
        className,
      )}
    >
      <CardHeader className={cn("pb-3", terminal ? "py-3" : null)}>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">
            {trackingCopy.section.objective}
          </CardTitle>
          {terminal || primary.kind === "none" ? (
            <Badge variant="outline" className="text-[10px] font-normal">
              {trackingCopy.state.readOnly}
            </Badge>
          ) : null}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-4", terminal ? "pt-0" : null)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg",
              terminal ? "h-9 w-9" : "h-12 w-12",
              isReadOnlyGuide && primary.kind !== "idle"
                ? "bg-muted text-muted-foreground"
                : primary.kind === "idle"
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/15 text-primary",
            )}
            aria-hidden
          >
            <Icon className={terminal ? "h-4 w-4" : "h-6 w-6"} />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p
              className={cn(
                "font-semibold",
                terminal ? "text-sm text-muted-foreground" : "text-sm",
              )}
            >
              {primary.title}
            </p>
            {primary.transitionText ? (
              <p className="text-xs text-muted-foreground">
                {primary.transitionText}
              </p>
            ) : null}
            {showsOperableHint ? (
              <p className="text-xs text-muted-foreground">
                {trackingCopy.hint.objectiveGuide}
              </p>
            ) : null}
            {showsCargoNavigate ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleGoToOperationalHub}
              >
                <Package className="mr-2 h-4 w-4 shrink-0" />
                {trackingCopy.action.goToCargos}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
