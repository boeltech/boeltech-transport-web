import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  MapPin,
  Navigation,
  Package,
  Receipt,
} from "lucide-react";

import { TripStatus, type TripStatusType } from "@features/trips/domain";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import type {
  TripNextStepAction,
  TripNextStepPlan,
} from "../../helpers/resolveTripNextStepActions";
import type { TripReadinessItem } from "../../hooks/useTripReadiness";
import { TripReadinessRail } from "./TripReadinessRail";

const copy = tripDetailCopy.shell.nextStep;

export type TripNextStepBlockProps = {
  plan: TripNextStepPlan;
  /** Slot de la primaria cuando es Confirmar reserva (dialog + mutación). */
  confirmReserveSlot?: ReactNode;
  onNavigateTab: (tab: "route" | "cargo" | "tracking") => void;
  onInvoice?: () => void;
  /** D18: abrir detalle de un borrador. */
  onOpenDraft?: (invoiceId: string) => void;
  /** D18′: varios borradores → sheet de elección (wiring en detalle). */
  onViewInvoices?: () => void;
  /** Description ya resuelta (F8/F9: blockers / create / borrador). */
  description?: string;
  /**
   * F8 / D15: inventario Para programar / Para completar bajo «Qué falta».
   * Solo draft / scheduled; cerrado por defecto.
   */
  readinessStatus?: TripStatusType;
  readinessItems?: readonly TripReadinessItem[];
  onReadinessItemClick?: (item: TripReadinessItem) => void;
  className?: string;
};

function phaseDescription(phase: TripNextStepPlan["phase"]): string {
  switch (phase) {
    case "draft_incomplete":
      return copy.descriptionDraftIncomplete;
    case "draft_ready":
      return copy.descriptionDraftReady;
    case "scheduled":
      return copy.descriptionScheduledOperate;
    case "in_progress":
      return copy.descriptionInProgressOperate;
    case "completed":
      return copy.descriptionCompleted;
  }
}

function trackingLabel(phase: TripNextStepPlan["phase"]): string {
  /** D17 Programado · D20 En ruta. */
  return phase === "scheduled" ? copy.goToStart : copy.goToTracking;
}

function primaryLabel(plan: TripNextStepPlan): string {
  const { primary, secondaries, phase } = plan;
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
      return trackingLabel(phase);
    case "invoice":
      return copy.invoice;
    case "go_to_route":
      return copy.goToRoute;
    case "go_to_cargo":
      return copy.goToCargo;
    case "open_draft":
      return copy.openDraft;
    case "view_invoices":
      return copy.viewInvoices;
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
  if (action.id === "go_to_tracking") return trackingLabel(phase);
  if (action.id === "invoice") return copy.invoice;
  if (action.id === "open_draft") return copy.openDraft;
  if (action.id === "view_invoices") return copy.viewInvoices;
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
    case "view_invoices":
      return <Receipt className="mr-1.5 h-4 w-4" aria-hidden />;
    case "open_draft":
      return <FileText className="mr-1.5 h-4 w-4" aria-hidden />;
    default:
      return null;
  }
}

function runAction(
  action: TripNextStepAction,
  handlers: {
    onNavigateTab: TripNextStepBlockProps["onNavigateTab"];
    onInvoice?: () => void;
    onOpenDraft?: (invoiceId: string) => void;
    onViewInvoices?: () => void;
  },
): void {
  if (action.id === "invoice") {
    handlers.onInvoice?.();
    return;
  }
  if (action.id === "open_draft" && action.invoiceId) {
    handlers.onOpenDraft?.(action.invoiceId);
    return;
  }
  if (action.id === "view_invoices") {
    handlers.onViewInvoices?.();
    return;
  }
  if (action.tab) {
    handlers.onNavigateTab(action.tab);
  }
}

function showWhatMissing(
  status: TripStatusType | undefined,
  items: readonly TripReadinessItem[] | undefined,
): boolean {
  if (!status || !items?.length) return false;
  return status === TripStatus.DRAFT || status === TripStatus.SCHEDULED;
}

/**
 * Consolidador above-the-fold: 1 CTA default + ≤2 outline.
 * F8: checklist readiness bajo «Qué falta» (colapsado), no card standalone.
 * F9: labels phase-aware «Ir a iniciar» / borradores (D16–D20).
 */
export function TripNextStepBlock({
  plan,
  confirmReserveSlot,
  onNavigateTab,
  onInvoice,
  onOpenDraft,
  onViewInvoices,
  description,
  readinessStatus,
  readinessItems,
  onReadinessItemClick,
  className,
}: TripNextStepBlockProps) {
  const { primary, secondaries, phase } = plan;
  const [whatMissingOpen, setWhatMissingOpen] = useState(false);
  const bodyDescription = description ?? phaseDescription(phase);
  const includeWhatMissing = showWhatMissing(readinessStatus, readinessItems);
  const handlers = { onNavigateTab, onInvoice, onOpenDraft, onViewInvoices };

  const primaryNode =
    primary.id === "confirm_reserve" && confirmReserveSlot ? (
      confirmReserveSlot
    ) : (
      <Button
        type="button"
        size="sm"
        data-testid="trip-next-step-primary"
        onClick={() => runAction(primary, handlers)}
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
      <p className="mt-1 text-sm text-muted-foreground">{bodyDescription}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {primaryNode}
        {secondaries.map((action) => (
          <Button
            key={`${action.id}:${action.tab ?? ""}:${action.invoiceId ?? ""}`}
            type="button"
            variant="outline"
            size="sm"
            data-testid={`trip-next-step-secondary-${action.id}`}
            onClick={() => runAction(action, handlers)}
          >
            <ActionIcon action={action} />
            {secondaryLabel(action, phase)}
          </Button>
        ))}
      </div>

      {includeWhatMissing && readinessStatus && readinessItems ? (
        <Collapsible
          open={whatMissingOpen}
          onOpenChange={setWhatMissingOpen}
          className="mt-3 border-t border-border/60 pt-2"
        >
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-1 text-xs text-muted-foreground"
              data-testid="trip-next-step-what-missing"
              aria-expanded={whatMissingOpen}
            >
              {whatMissingOpen ? (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              )}
              {copy.whatMissing}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <TripReadinessRail
              status={readinessStatus}
              items={readinessItems}
              presentation="checklist"
              onItemClick={onReadinessItemClick}
            />
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </section>
  );
}
