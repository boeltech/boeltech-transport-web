import type { ReactNode } from "react";
import { MapPin, Navigation, Package, Receipt } from "lucide-react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import type {
  TripNextStepAction,
  TripNextStepPlan,
} from "../../helpers/resolveTripNextStepActions";

const copy = tripDetailCopy.shell.nextStep;

export type TripNextStepBlockProps = {
  plan: TripNextStepPlan;
  /** Slot de la primaria cuando es Confirmar reserva (dialog + mutación). */
  confirmReserveSlot?: ReactNode;
  onNavigateTab: (tab: "route" | "cargo" | "tracking") => void;
  onInvoice?: () => void;
  className?: string;
};

function phaseDescription(phase: TripNextStepPlan["phase"]): string {
  switch (phase) {
    case "draft_incomplete":
      return copy.descriptionDraftIncomplete;
    case "draft_ready":
      return copy.descriptionDraftReady;
    case "scheduled":
      return copy.descriptionScheduled;
    case "in_progress":
      return copy.descriptionInProgress;
    case "completed":
      return copy.descriptionCompleted;
  }
}

function primaryLabel(plan: TripNextStepPlan): string {
  const { primary, secondaries } = plan;
  switch (primary.id) {
    case "complete_route_cargo":
      if (primary.tab === "cargo") return copy.completeCargo;
      if (secondaries.some((s) => s.id === "go_to_cargo")) {
        return copy.completeRouteCargo;
      }
      return copy.completeRoute;
    case "confirm_reserve":
      return copy.confirmReserve;
    case "go_to_tracking":
      return copy.goToTracking;
    case "invoice":
      return copy.invoice;
    case "go_to_route":
      return copy.goToRoute;
    case "go_to_cargo":
      return copy.goToCargo;
  }
}

function secondaryLabel(
  action: TripNextStepAction,
  phase: TripNextStepPlan["phase"],
): string {
  if (phase === "draft_ready") {
    if (action.id === "go_to_route") return copy.adjustRoute;
    if (action.id === "go_to_cargo") return copy.adjustCargo;
  }
  if (action.id === "go_to_route") return copy.goToRoute;
  if (action.id === "go_to_cargo") return copy.goToCargo;
  if (action.id === "go_to_tracking") return copy.goToTracking;
  if (action.id === "invoice") return copy.invoice;
  return primaryLabel({
    phase,
    primary: action,
    secondaries: [],
  });
}

function ActionIcon({ action }: { action: TripNextStepAction }) {
  switch (action.id) {
    case "complete_route_cargo":
    case "go_to_route":
      return <MapPin className="mr-1.5 h-4 w-4" aria-hidden />;
    case "go_to_cargo":
      return <Package className="mr-1.5 h-4 w-4" aria-hidden />;
    case "go_to_tracking":
      return <Navigation className="mr-1.5 h-4 w-4" aria-hidden />;
    case "invoice":
      return <Receipt className="mr-1.5 h-4 w-4" aria-hidden />;
    default:
      return null;
  }
}

function runAction(
  action: TripNextStepAction,
  onNavigateTab: TripNextStepBlockProps["onNavigateTab"],
  onInvoice?: () => void,
): void {
  if (action.id === "invoice") {
    onInvoice?.();
    return;
  }
  if (action.tab) {
    onNavigateTab(action.tab);
  }
}

/**
 * Consolidador above-the-fold: 1 CTA default + ≤2 outline.
 * El rail de readiness y banners quedan en peso visual menor.
 */
export function TripNextStepBlock({
  plan,
  confirmReserveSlot,
  onNavigateTab,
  onInvoice,
  className,
}: TripNextStepBlockProps) {
  const { primary, secondaries, phase } = plan;

  const primaryNode =
    primary.id === "confirm_reserve" && confirmReserveSlot ? (
      confirmReserveSlot
    ) : (
      <Button
        type="button"
        size="sm"
        data-testid="trip-next-step-primary"
        onClick={() => runAction(primary, onNavigateTab, onInvoice)}
      >
        <ActionIcon action={primary} />
        {primaryLabel(plan)}
      </Button>
    );

  return (
    <section
      className={cn(
        "rounded-xl border border-primary/25 bg-primary/5 px-4 py-3",
        className,
      )}
      data-testid="trip-next-step-block"
      aria-labelledby="trip-next-step-title"
    >
      <p
        id="trip-next-step-title"
        className="text-sm font-semibold text-foreground"
      >
        {copy.title}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {phaseDescription(phase)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {primaryNode}
        {secondaries.map((action) => (
          <Button
            key={`${action.id}:${action.tab ?? ""}`}
            type="button"
            variant="outline"
            size="sm"
            data-testid={`trip-next-step-secondary-${action.id}`}
            onClick={() => runAction(action, onNavigateTab, onInvoice)}
          >
            <ActionIcon action={action} />
            {secondaryLabel(action, phase)}
          </Button>
        ))}
      </div>
    </section>
  );
}
