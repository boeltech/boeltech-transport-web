import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Info,
} from "lucide-react";
import type { HubReadinessItem, HubReadinessStatus } from "@shared/ui/page-shells";
import { cn } from "@shared/lib/utils/cn";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.readiness;

const READINESS_STATUS_ICON: Record<
  HubReadinessStatus,
  typeof CheckCircle2
> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  empty: Circle,
  info: Info,
};

const READINESS_STATUS_CLASS: Record<HubReadinessStatus, string> = {
  ok: "text-success",
  warn: "text-warning",
  empty: "text-destructive",
  info: "text-muted-foreground",
};

const CTA_BY_ID: Record<string, string> = {
  operators_salary: copy.cta.operatorsSalary,
  templates_active: copy.cta.templatesActive,
  assignments_active: copy.cta.assignmentsActive,
  trips_completed: copy.cta.tripsCompleted,
};

function ReadinessChip({ item }: { item: HubReadinessItem }) {
  const Icon = READINESS_STATUS_ICON[item.status];
  const statusClass = READINESS_STATUS_CLASS[item.status];
  const ariaLabel = `${item.value} ${item.label}`;

  const body = (
    <>
      <Icon
        className={cn("h-3.5 w-3.5 shrink-0", statusClass)}
        aria-hidden
        data-status={item.status}
      />
      <span className={cn("tabular-nums font-semibold", statusClass)}>
        {item.value}
      </span>
      <span className="text-muted-foreground">{item.label}</span>
    </>
  );

  const className = cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs",
    "transition-colors",
    item.href &&
      "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  if (item.href) {
    return (
      <Link to={item.href} className={className} aria-label={ariaLabel}>
        {body}
      </Link>
    );
  }

  return (
    <span className={className} aria-label={ariaLabel}>
      {body}
    </span>
  );
}

export interface SettlementsSetupChecklistProps {
  items: HubReadinessItem[];
  isReady: boolean;
  isLoading?: boolean;
}

/**
 * Checklist de prerrequisitos above-the-fold en el workbench.
 * Se colapsa (no renderiza) cuando la configuración cutover está lista.
 */
export function SettlementsSetupChecklist({
  items,
  isReady,
  isLoading = false,
}: SettlementsSetupChecklistProps) {
  if (isLoading || isReady || items.length === 0) return null;

  const actionItems = items.filter(
    (item) => item.status === "empty" || item.status === "warn",
  );

  return (
    <section
      className="space-y-3 rounded-lg border border-warning/30 bg-warning-soft/30 px-4 py-3"
      data-testid="settlements-setup-checklist"
      aria-label={copy.ariaLabel}
    >
      <p className="text-sm font-medium text-foreground">{copy.title}</p>

      <div
        className="-mx-1 overflow-x-auto px-1"
        role="list"
        aria-label={copy.chipsAriaLabel}
      >
        <div className="flex w-max min-w-full flex-nowrap gap-2 sm:flex-wrap sm:w-auto">
          {items.map((item) => (
            <div key={item.id} role="listitem">
              <ReadinessChip item={item} />
            </div>
          ))}
        </div>
      </div>

      {actionItems.length > 0 ? (
        <ol className="space-y-1.5 text-sm text-muted-foreground">
          {actionItems.map((item, index) => {
            const cta = CTA_BY_ID[item.id] ?? copy.cta.generic;
            return (
              <li key={item.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-medium text-foreground">
                  {index + 1}. {item.label}
                </span>
                {item.href ? (
                  <Link
                    to={item.href}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {cta}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
