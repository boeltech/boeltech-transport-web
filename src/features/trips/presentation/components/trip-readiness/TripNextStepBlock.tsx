import type { ReactNode } from "react";
import { ArrowRight, FileText, Truck } from "lucide-react";

import { TripStatus, type TripStatusType } from "@features/trips/domain";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import type {
  TripNextStepAction,
  TripNextStepPlan,
} from "../../helpers/resolveTripNextStepActions";
import type { TripReadinessItem } from "../../hooks/useTripReadiness";
import { TripReadinessRail } from "./TripReadinessRail";

const copy = tripDetailCopy.shell.nextStep;

export type TripNextStepAlsoFooter = {
  /** Gastos en revisión (enlace a Costos). 0 = omitir cláusula. */
  readonly expensesInReviewCount?: number;
  /** Fecha ya formateada para «hasta el …»; null/omit = omitir cláusula (NS9 gap). */
  readonly lateExpensesUntilLabel?: string | null;
  readonly onGoToCosts?: () => void;
};

export type TripNextStepBlockProps = {
  plan: TripNextStepPlan;
  /** Slot de la primaria cuando es Confirmar reserva (dialog + mutación). */
  confirmReserveSlot?: ReactNode;
  onNavigateTab: (tab: "route" | "cargo" | "tracking") => void;
  onInvoice?: () => void;
  /** HB-G2-CTA: abre sheet de fase (Despachar / llegada / salida…). */
  onOpenOperate?: () => void;
  /** NS7: abre Sheet de flota (`?tab=overview&assignFleet=1`). */
  onAssignFleet?: () => void;
  /** D18: abrir detalle de un borrador (fuera de Qué sigue en F3d-4). */
  onOpenDraft?: (invoiceId: string) => void;
  /** D18′: varios borradores → sheet de elección (wiring en detalle). */
  onViewInvoices?: () => void;
  /** F3d-4: secundaria Nota en En ruta. */
  onRegisterNote?: () => void;
  /** F3b: declarar viaje en falso (sheet existente). */
  onDeclareFalseTrip?: () => void;
  /** F3b: abrir dialog Cancelar viaje del shell. */
  onCancelTrip?: () => void;
  /** F3b: deep-link a Ruta con intent plan_return. */
  onPlanReturn?: () => void;
  /** Description ya resuelta (F8/F9: blockers / create / borrador). */
  description?: string;
  /**
   * Título contextual largo bajo «Qué sigue» (p. ej. «Registrar salida — Parada 2 · Escala»).
   * Si falta, usa Despachar… / Ir a Seguimiento según fase.
   */
  operatePrimaryLabel?: string | null;
  /**
   * CTA corto del botón (verbo + objeto). En En ruta no debe repetir el string largo.
   */
  operateCtaLabel?: string | null;
  /**
   * D31 / D33: marca Qué sigue en ámbar; chip «Nh de retraso» (no «va tarde»).
   */
  late?: boolean;
  /** Copy D33 ya formateado (p. ej. «3 h de retraso»). */
  lateDelayLabel?: string | null;
  /**
   * D44 — con edición o panel abierto, la primaria baja a outline (P2).
   */
  primaryDemoted?: boolean;
  /**
   * F8 / D15 / NS2: inventario Para programar / Para iniciar / Para completar
   * siempre visible bajo el divisor en draft / scheduled.
   */
  readinessStatus?: TripStatusType;
  readinessItems?: readonly TripReadinessItem[];
  onReadinessItemClick?: (item: TripReadinessItem) => void;
  /** NS9 — pie Completado («También: …»). */
  alsoFooter?: TripNextStepAlsoFooter | null;
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

function operateFallbackLabel(phase: TripNextStepPlan["phase"]): string {
  return phase === "scheduled" ? copy.goToStart : copy.goToTracking;
}

function operateLabel(
  phase: TripNextStepPlan["phase"],
  preferred?: string | null,
): string {
  return preferred?.trim() || operateFallbackLabel(phase);
}

function primaryLabel(
  plan: TripNextStepPlan,
  operateLabelPreferred?: string | null,
): string {
  const { primary, secondaries, phase } = plan;
  switch (primary.id) {
    case "assign_fleet":
      return copy.assignFleet;
    case "complete_route_cargo":
      if (primary.tab === "cargo") return copy.completeCargo;
      if (primary.routeGap === "origin") return copy.completeOrigin;
      if (primary.routeGap === "destination") return copy.completeDestination;
      if (primary.routeGap === "domicilio") return copy.completeDomicilio;
      if (primary.routeGap === "route") return copy.completeRouteCities;
      if (secondaries.some((s) => s.id === "go_to_cargo")) {
        return copy.completeRouteCargo;
      }
      return copy.completeRoute;
    case "confirm_reserve":
      return copy.confirmReserve;
    case "open_operate":
    case "go_to_tracking":
      return operateLabel(phase, operateLabelPreferred);
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
    case "register_note":
      return copy.registerNote;
    case "declare_false_trip":
      return copy.declareFalseTrip;
    case "cancel_trip":
      return copy.cancelTrip;
    case "plan_return":
      return copy.planReturn;
  }
}

function secondaryLabel(
  action: TripNextStepAction,
  phase: TripNextStepPlan["phase"],
  operateCtaPreferred?: string | null,
): string {
  if (action.id === "assign_fleet") return copy.assignFleet;
  if (phase === "draft_ready") {
    if (action.id === "go_to_route") return copy.adjustRoute;
    if (action.id === "go_to_cargo") return copy.adjustCargo;
  }
  // NS7: outline Completar cargas junto a Asignar flota.
  if (action.id === "go_to_cargo" && phase === "draft_incomplete") {
    return copy.completeCargo;
  }
  if (action.id === "go_to_route") return copy.goToRoute;
  if (action.id === "go_to_cargo") return copy.goToCargo;
  if (action.id === "open_operate" || action.id === "go_to_tracking") {
    return operateLabel(phase, operateCtaPreferred);
  }
  if (action.id === "invoice") return copy.invoice;
  if (action.id === "open_draft") return copy.openDraft;
  if (action.id === "view_invoices") return copy.viewInvoices;
  if (action.id === "register_note") return copy.registerNote;
  if (action.id === "declare_false_trip") return copy.declareFalseTrip;
  if (action.id === "cancel_trip") return copy.cancelTrip;
  if (action.id === "plan_return") return copy.planReturn;
  return primaryLabel(
    { phase, primary: action, secondaries: [] },
    operateCtaPreferred,
  );
}

/**
 * NS6 / RP-3 acotado: Truck (flota / Despachar), FileText (Facturar / borrador).
 * Primaria En ruta (open_operate) y el resto: sin ícono.
 */
function ActionIcon({
  action,
  phase,
}: {
  action: TripNextStepAction;
  phase: TripNextStepPlan["phase"];
}) {
  const iconClass = "mr-1.5 h-4 w-4";
  switch (action.id) {
    case "assign_fleet":
      return <Truck className={iconClass} aria-hidden />;
    case "open_operate":
    case "go_to_tracking":
      if (phase === "scheduled") {
        return <Truck className={iconClass} aria-hidden />;
      }
      return null;
    case "invoice":
    case "open_draft":
    case "view_invoices":
      return <FileText className={iconClass} aria-hidden />;
    default:
      return null;
  }
}

function runAction(
  action: TripNextStepAction,
  handlers: {
    onNavigateTab: TripNextStepBlockProps["onNavigateTab"];
    onInvoice?: () => void;
    onOpenOperate?: () => void;
    onAssignFleet?: () => void;
    onOpenDraft?: (invoiceId: string) => void;
    onViewInvoices?: () => void;
    onRegisterNote?: () => void;
    onDeclareFalseTrip?: () => void;
    onCancelTrip?: () => void;
    onPlanReturn?: () => void;
  },
): void {
  if (action.id === "assign_fleet") {
    handlers.onAssignFleet?.();
    return;
  }
  if (action.id === "invoice") {
    handlers.onInvoice?.();
    return;
  }
  if (action.id === "open_operate" || action.id === "go_to_tracking") {
    handlers.onOpenOperate?.();
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
  if (action.id === "register_note") {
    handlers.onRegisterNote?.();
    return;
  }
  if (action.id === "declare_false_trip") {
    handlers.onDeclareFalseTrip?.();
    return;
  }
  if (action.id === "cancel_trip") {
    handlers.onCancelTrip?.();
    return;
  }
  if (action.id === "plan_return") {
    handlers.onPlanReturn?.();
    return;
  }
  if (action.tab) {
    handlers.onNavigateTab(action.tab);
  }
}

function showChecklist(
  status: TripStatusType | undefined,
  items: readonly TripReadinessItem[] | undefined,
): boolean {
  if (!status || !items?.length) return false;
  return status === TripStatus.DRAFT || status === TripStatus.SCHEDULED;
}

function resolveCardTitle(
  phase: TripNextStepPlan["phase"],
  late: boolean,
  lateDelayLabel: string | null | undefined,
): string {
  const base =
    phase === "draft_incomplete" || phase === "draft_ready"
      ? copy.titleDraft
      : copy.title;
  const delayChip = lateDelayLabel?.trim();
  if (late && delayChip) {
    return `${base} · ${delayChip}`;
  }
  return base;
}

function resolveHeadings(
  plan: TripNextStepPlan,
  operatePrimaryLabel?: string | null,
  operateCtaLabel?: string | null,
): { contextualHeading: string; ctaText: string } {
  const { primary, secondaries } = plan;

  if (primary.id === "assign_fleet") {
    return {
      contextualHeading: copy.titleAssignFleet,
      ctaText: copy.assignFleet,
    };
  }

  if (primary.id === "confirm_reserve") {
    return {
      contextualHeading: copy.confirmReserve,
      ctaText: copy.confirmReserve,
    };
  }

  // NS7: sin ruta + sin flota — título «Completar ruta y cargas», CTA «Completar ruta».
  if (
    primary.id === "complete_route_cargo" &&
    secondaries.some((s) => s.id === "assign_fleet")
  ) {
    return {
      contextualHeading: copy.completeRouteCargo,
      ctaText: copy.completeRoute,
    };
  }

  return {
    contextualHeading: primaryLabel(plan, operatePrimaryLabel),
    ctaText: primaryLabel(plan, operateCtaLabel ?? operatePrimaryLabel),
  };
}

function AlsoFooter({ footer }: { footer: TripNextStepAlsoFooter }) {
  const count = footer.expensesInReviewCount ?? 0;
  const lateLabel = footer.lateExpensesUntilLabel?.trim() || null;
  const parts: ReactNode[] = [];

  if (count > 0) {
    const label = copy.expensesInReview(count);
    parts.push(
      footer.onGoToCosts ? (
        <button
          key="expenses"
          type="button"
          className="font-medium text-primary-700 underline-offset-2 hover:underline"
          onClick={footer.onGoToCosts}
          data-testid="trip-next-step-also-costs"
        >
          {label}
        </button>
      ) : (
        <span key="expenses">{label}</span>
      ),
    );
  }

  if (lateLabel) {
    parts.push(
      <span key="late">{copy.lateExpensesUntil(lateLabel)}</span>,
    );
  }

  if (parts.length === 0) return null;

  return (
    <p
      className="mt-3 border-t border-primary-200 pt-3 text-xs text-muted-foreground"
      data-testid="trip-next-step-also-footer"
    >
      <span className="mr-1 font-medium text-foreground">{copy.alsoPrefix}</span>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 ? <span className="mx-1">·</span> : null}
          {part}
        </span>
      ))}
    </p>
  );
}

/**
 * Consolidador above-the-fold: 1 CTA default + ≤2 outline.
 * Enmienda NS: «Siguiente paso» / «Qué sigue»; chips siempre visibles; NS7 flota.
 */
export function TripNextStepBlock({
  plan,
  confirmReserveSlot,
  onNavigateTab,
  onInvoice,
  onOpenOperate,
  onAssignFleet,
  onOpenDraft,
  onViewInvoices,
  onRegisterNote,
  onDeclareFalseTrip,
  onCancelTrip,
  onPlanReturn,
  description,
  operatePrimaryLabel,
  operateCtaLabel,
  late = false,
  lateDelayLabel = null,
  primaryDemoted = false,
  readinessStatus,
  readinessItems,
  onReadinessItemClick,
  alsoFooter = null,
  className,
}: TripNextStepBlockProps) {
  const { primary, secondaries, phase } = plan;
  const includeChecklist = showChecklist(readinessStatus, readinessItems);
  const bodyDescription =
    description ??
    (primary.id === "assign_fleet"
      ? copy.descriptionAssignFleet
      : primary.id === "declare_false_trip" || primary.id === "cancel_trip"
        ? copy.descriptionOriginOutcome
        : primary.id === "plan_return"
          ? copy.descriptionReturnReplan
          : phaseDescription(phase));
  const handlers = {
    onNavigateTab,
    onInvoice,
    onOpenOperate,
    onAssignFleet,
    onDeclareFalseTrip,
    onCancelTrip,
    onPlanReturn,
    onOpenDraft,
    onViewInvoices,
    onRegisterNote,
  };

  const titleText = resolveCardTitle(phase, late, lateDelayLabel);
  const { contextualHeading, ctaText } = resolveHeadings(
    plan,
    operatePrimaryLabel,
    operateCtaLabel,
  );

  const primaryNode =
    primary.id === "confirm_reserve" && confirmReserveSlot ? (
      confirmReserveSlot
    ) : (
      <Button
        type="button"
        size="sm"
        variant={primaryDemoted ? "outline" : "default"}
        data-testid="trip-next-step-primary"
        data-demoted={primaryDemoted ? "true" : undefined}
        onClick={() => runAction(primary, handlers)}
      >
        <ActionIcon action={primary} phase={phase} />
        {ctaText}
      </Button>
    );

  const showAlso =
    phase === "completed" &&
    alsoFooter &&
    ((alsoFooter.expensesInReviewCount ?? 0) > 0 ||
      Boolean(alsoFooter.lateExpensesUntilLabel?.trim()));

  return (
    <section
      className={cn(
        "rounded-xl border px-4 py-3",
        late
          ? "border-warning/40 bg-warning/10"
          : "border-primary-200 bg-primary-50",
        className,
      )}
      data-testid="trip-next-step-block"
      aria-labelledby="trip-next-step-title"
    >
      <div className="flex flex-wrap items-center gap-3.5">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
            late
              ? "border-warning/40 bg-card text-warning"
              : "border-primary-200 bg-card text-primary-700",
          )}
          aria-hidden
        >
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            id="trip-next-step-title"
            className={cn(
              "text-xs font-semibold",
              late ? "text-warning" : "text-primary-700",
            )}
          >
            {titleText}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {contextualHeading}
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {bodyDescription}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaries.map((action) => {
            const isNote = action.id === "register_note";
            return (
              <Button
                key={`${action.id}:${action.tab ?? ""}:${action.invoiceId ?? ""}`}
                type="button"
                variant={isNote ? "ghost" : "outline"}
                size="sm"
                className={
                  isNote
                    ? "h-8 px-2 text-muted-foreground hover:text-foreground"
                    : undefined
                }
                data-testid={`trip-next-step-secondary-${action.id}`}
                onClick={() => runAction(action, handlers)}
              >
                {!isNote ? (
                  <ActionIcon action={action} phase={phase} />
                ) : null}
                {secondaryLabel(
                  action,
                  phase,
                  operateCtaLabel ?? operatePrimaryLabel,
                )}
              </Button>
            );
          })}
          {primaryNode}
        </div>
      </div>

      {includeChecklist && readinessStatus && readinessItems ? (
        <div
          className="mt-3 border-t border-primary-200 pt-3"
          data-testid="trip-next-step-checklist"
        >
          <TripReadinessRail
            status={readinessStatus}
            items={readinessItems}
            presentation="checklist"
            onItemClick={onReadinessItemClick}
          />
        </div>
      ) : null}

      {showAlso && alsoFooter ? <AlsoFooter footer={alsoFooter} /> : null}
    </section>
  );
}
