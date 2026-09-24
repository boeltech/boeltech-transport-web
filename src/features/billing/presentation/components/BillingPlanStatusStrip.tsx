import { Badge } from "@shared/ui/badge";
import type { BillingSubscription } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { getSubscriptionStatusLabel } from "../utils/billingFormatters";

interface BillingPlanStatusStripProps {
  subscription?: BillingSubscription | null;
  isLoading?: boolean;
  /** Etiqueta corta del periodo (p. ej. «hasta 30 sep 2026»). */
  periodLabel?: string | null;
  /**
   * Línea «Cobrado» solo si hay last_auto_charge.charged en un periodo
   * pagado visible. Si no hay dato, no pasar (no inventar).
   */
  chargedLabel?: string | null;
}

/**
 * Above-the-fold: nombre de plan + badge de estado (+ periodo corto).
 * El detalle de cobro/cupos sigue en `BillingPlanCard`.
 */
export function BillingPlanStatusStrip({
  subscription,
  isLoading = false,
  periodLabel = null,
  chargedLabel = null,
}: BillingPlanStatusStripProps) {
  const copy = billingCopy.planStatusStrip;

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
        <p className="text-sm text-muted-foreground">{copy.loading}</p>
      </div>
    );
  }

  if (!subscription) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p className="text-lg font-semibold tracking-tight">
          {subscription.planName || billingCopy.plan.planFallback}
        </p>
        <Badge variant="neutral" tone="soft">
          {getSubscriptionStatusLabel(subscription.status)}
        </Badge>
      </div>
      {periodLabel || chargedLabel ? (
        <div className="flex min-w-0 flex-col items-end gap-0.5">
          {periodLabel ? (
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          ) : null}
          {chargedLabel ? (
            <p className="text-sm text-muted-foreground">{chargedLabel}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
