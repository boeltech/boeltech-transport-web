import { AlertTriangle, Info } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { resolvePastDueGraceDeadline } from "@features/billing/presentation/utils/billingGrace";
import type {
  PlatformLifecycleStageType,
  PlatformTenantStatusType,
} from "../../domain/entities";
import { PlatformTenantStatusBadge } from "../config/platformTenantStatusConfig";
import {
  TenantLifecycleBadge,
  getLifecycleStageLabel,
} from "../config/platformLifecycleConfig";
import { platformCopy } from "../copy/platformCopy";
import { getPlatformSubscriptionStatusLabel } from "../utils/platformBillingFormatters";

export interface TenantCommercialStatusStripProps {
  accessStatus: PlatformTenantStatusType;
  subscriptionStatus: string | null;
  planName: string | null;
  lifecycleStage: PlatformLifecycleStageType;
  /** Period start used to compute past_due grace reference. */
  currentPeriodStart?: string | null;
  trialEndsAt?: string | null;
  /** Same-page Cobros (tab Comercial · AR). Required when past_due. */
  onViewCollections?: () => void;
}

/**
 * First-paint commercial strip for tenant detail (all tabs).
 * Acceso = tenants.status; Suscripción = subscription.status; lifecycle = tooltip only.
 * Badges here are canonical (Governance must not twin them).
 */
export function TenantCommercialStatusStrip({
  accessStatus,
  subscriptionStatus,
  planName,
  lifecycleStage,
  currentPeriodStart,
  trialEndsAt,
  onViewCollections,
}: TenantCommercialStatusStripProps) {
  const copy = platformCopy.tenants.detail.commercialStrip;
  const isPastDue = subscriptionStatus === "past_due";
  const isTrialing = subscriptionStatus === "trialing";
  const graceDeadline = isPastDue
    ? resolvePastDueGraceDeadline(currentPeriodStart)
    : null;
  const graceDeadlineLabel = graceDeadline
    ? formatDate(graceDeadline.toISOString())
    : "";
  const lifecycleLabel = getLifecycleStageLabel(lifecycleStage);

  return (
    <div
      className="space-y-3 rounded-xl border bg-card p-3 shadow-sm"
      data-testid="tenant-commercial-status-strip"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {copy.accessLabel}
          </span>
          <PlatformTenantStatusBadge status={accessStatus} size="sm" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {copy.subscriptionLabel}
          </span>
          {subscriptionStatus ? (
            <Badge
              tone="soft"
              variant={isPastDue ? "warning" : "secondary"}
              className="text-xs"
            >
              {getPlatformSubscriptionStatusLabel(subscriptionStatus)}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {copy.subscriptionMissing}
            </span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {copy.planLabel}
          </span>
          <span className="truncate text-sm font-medium">
            {planName?.trim() ? planName : copy.planMissing}
          </span>
        </div>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={copy.lifecycleTooltip(lifecycleLabel)}
              >
                <span className="text-xs font-medium">{copy.lifecycleLabel}</span>
                <TenantLifecycleBadge status={lifecycleStage} size="sm" />
                <Info className="h-3.5 w-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {copy.lifecycleTooltip(lifecycleLabel)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isPastDue ? (
        <DetailAlertCard
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
          title={copy.pastDueOperating}
          action={
            onViewCollections ? (
              <Button size="sm" variant="outline" onClick={onViewCollections}>
                {copy.viewAr}
              </Button>
            ) : undefined
          }
        >
          <p className="text-sm">
            {graceDeadlineLabel
              ? copy.graceRef(graceDeadlineLabel)
              : copy.graceMissing}
          </p>
        </DetailAlertCard>
      ) : null}

      {isTrialing && trialEndsAt ? (
        <p className="text-sm text-muted-foreground">
          {copy.trialEnds(formatDateTime(trialEndsAt))}
        </p>
      ) : null}
    </div>
  );
}
