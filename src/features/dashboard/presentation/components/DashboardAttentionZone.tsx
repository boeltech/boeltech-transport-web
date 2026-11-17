/**
 * Zona «Lo que te toca» (I2/I3/I11) — presentacional; datos vía useDashboardAttention.
 */

import { ROLES } from "@shared/constants/roles";
import {
  PendingQueueCard,
  PendingQueueErrorRow,
  PendingQueueRow,
  PendingQueueRowSkeleton,
} from "@shared/ui/pending-queue";
import type { AttentionRowView } from "../../application/hooks/useDashboardAttention";
import { compareAttentionRows } from "../../domain/attentionQueue";
import { dashboardCopy } from "../copy/dashboardCopy";

export interface DashboardAttentionZoneProps {
  role: string | undefined;
  rows: AttentionRowView[];
  isLoading: boolean;
  /** Cuando true, la checklist de activación ocupa la zona. */
  occupiedByActivation?: boolean;
}

function subtitleForRole(role: string | undefined): string {
  const copy = dashboardCopy.attention.subtitle;
  if (role === ROLES.DISPATCHER || role === ROLES.OPERATOR) {
    return copy.dispatcher;
  }
  if (role === ROLES.ACCOUNTANT) return copy.accountant;
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) return copy.manager;
  return copy.default;
}

export function DashboardAttentionZone({
  role,
  rows,
  isLoading,
  occupiedByActivation = false,
}: DashboardAttentionZoneProps) {
  if (occupiedByActivation) return null;

  const visibleOk = rows
    .filter((r): r is Extract<AttentionRowView, { kind: "ok" }> => r.kind === "ok")
    .sort(compareAttentionRows);
  const errors = rows.filter(
    (r): r is Extract<AttentionRowView, { kind: "error" }> => r.kind === "error",
  );
  const clearChips = rows
    .filter(
      (r): r is Extract<AttentionRowView, { kind: "clear" }> => r.kind === "clear",
    )
    .map((r) => r.title);

  return (
    <section
      className="flex min-w-0 flex-col gap-2"
      aria-labelledby="attention-zone-title"
    >
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2
          id="attention-zone-title"
          className="text-base font-semibold leading-6 text-foreground"
        >
          {dashboardCopy.attention.title}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {subtitleForRole(role)}
        </p>
      </div>

      {isLoading && visibleOk.length === 0 && errors.length === 0 ? (
        <PendingQueueCard>
          <PendingQueueRowSkeleton />
          <PendingQueueRowSkeleton />
          <PendingQueueRowSkeleton />
        </PendingQueueCard>
      ) : visibleOk.length === 0 && errors.length === 0 ? (
        <PendingQueueCard
          empty={{
            title: dashboardCopy.attention.emptyTitle,
            description: dashboardCopy.attention.emptyDescription,
          }}
        >
          {null}
        </PendingQueueCard>
      ) : (
        <PendingQueueCard
          clearChips={visibleOk.length > 0 ? clearChips : undefined}
          clearLabel={dashboardCopy.attention.clearLabel}
        >
          {errors.map((row) => (
            <PendingQueueErrorRow
              key={row.id}
              title={row.title}
              area={row.area}
              message={dashboardCopy.attention.rowError}
              retryLabel={dashboardCopy.attention.retry}
              onRetry={row.onRetry}
            />
          ))}
          {visibleOk.map((row) => (
            <PendingQueueRow
              key={row.id}
              title={row.title}
              area={row.area}
              breakdown={row.breakdown}
              value={row.value}
              valueHint={row.valueHint}
              ctaLabel={row.ctaLabel}
              href={row.href}
              urgency={row.urgency}
            />
          ))}
        </PendingQueueCard>
      )}
    </section>
  );
}
