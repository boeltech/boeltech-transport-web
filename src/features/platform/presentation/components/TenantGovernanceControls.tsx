import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { resolvePastDueGraceDeadline } from "@features/billing/presentation/utils/billingGrace";
import {
  PlatformTenantStatus,
  type PlatformTenantDetail,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import { usePlatformTenantSubscription } from "../../application/hooks/usePlatformBilling";
import { PlatformTenantStatusBadge } from "../config/platformTenantStatusConfig";
import { platformCopy } from "../copy/platformCopy";
import { getPlatformSubscriptionStatusLabel } from "../utils/platformBillingFormatters";

interface TenantGovernanceControlsProps {
  tenant: PlatformTenantDetail;
  canMutate: boolean;
  onManageSubscription: () => void;
}

function accessEffect(status: PlatformTenantStatusType): string {
  const effects = platformCopy.tenants.detail.governance.accessEffect;
  if (status === PlatformTenantStatus.SUSPENDED) return effects.suspended;
  if (status === PlatformTenantStatus.CANCELLED) return effects.cancelled;
  return effects.active;
}

function commercialEffect(status: string | null | undefined): string {
  const effects = platformCopy.tenants.detail.governance.commercialEffect;
  if (!status) return effects.missing;
  return (
    effects[status as keyof typeof effects] ??
    platformCopy.tenants.detail.subscription.statusLabels[
      status as keyof typeof platformCopy.tenants.detail.subscription.statusLabels
    ] ??
    status
  );
}

export function TenantGovernanceControls({
  tenant,
  canMutate,
  onManageSubscription,
}: TenantGovernanceControlsProps) {
  const copy = platformCopy.tenants.detail.governance;
  const [helpOpen, setHelpOpen] = useState(false);
  const { data: subscription, isLoading } = usePlatformTenantSubscription(
    tenant.id,
  );

  const commercialStatus = subscription?.status ?? tenant.subscriptionStatus;
  const isPastDue = commercialStatus === "past_due";
  const graceDeadline = resolvePastDueGraceDeadline(
    subscription?.currentPeriodStart,
  );
  const graceDeadlineLabel = graceDeadline
    ? formatDate(graceDeadline.toISOString())
    : "";

  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="text-base">{copy.title}</CardTitle>
        <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-xs text-muted-foreground hover:bg-transparent"
            >
              {helpOpen ? copy.helpHide : copy.helpLabel}
              <ChevronDown
                aria-hidden
                className={cn(
                  "ml-1 h-3.5 w-3.5 transition-transform",
                  helpOpen && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1">
            <p className="text-sm text-muted-foreground">{copy.helpBody}</p>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.accessTitle}
            </p>
            <div className="mt-2">
              <PlatformTenantStatusBadge status={tenant.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {accessEffect(tenant.status)}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.commercialTitle}
            </p>
            {isLoading && !commercialStatus ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {copy.commercialLoading}
              </p>
            ) : (
              <>
                <div className="mt-2">
                  <Badge variant={isPastDue ? "warning" : "secondary"}>
                    {commercialStatus
                      ? getPlatformSubscriptionStatusLabel(commercialStatus)
                      : copy.commercialEffect.missing}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {commercialEffect(commercialStatus)}
                </p>
              </>
            )}
          </div>
        </div>

        {isPastDue ? (
          <AlertWithIcon variant="warning" title={copy.grace.title}>
            <p className="text-sm">
              {graceDeadlineLabel
                ? copy.grace.orientation(graceDeadlineLabel)
                : copy.grace.orientationMissing}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              <li>{copy.grace.itemNotes}</li>
              <li>{copy.grace.itemPause}</li>
              <li>{copy.grace.itemActive}</li>
            </ul>
            {canMutate ? (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={onManageSubscription}>
                  {copy.grace.openSubscription}
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                {copy.grace.readOnlyHint}
              </p>
            )}
          </AlertWithIcon>
        ) : null}
      </CardContent>
    </Card>
  );
}
