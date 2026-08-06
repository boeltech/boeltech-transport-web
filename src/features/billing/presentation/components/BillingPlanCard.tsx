import { CreditCard, Mail } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { formatDate } from "@shared/utils/dateUtils";
import type { BillingSubscription } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatHistoryMonths,
  formatLimitValue,
  getSubscriptionStatusLabel,
} from "../utils/billingFormatters";
import { isTrialDateReached } from "../utils/billingNotice";

interface BillingPlanCardProps {
  subscription?: BillingSubscription | null;
  isLoading: boolean;
  /** Cupo del periodo según `GET /billing/usage` (en prueba no es el del plan). */
  includedStamps?: number;
}

export function BillingPlanCard({
  subscription,
  isLoading,
  includedStamps,
}: BillingPlanCardProps) {
  const copy = billingCopy.plan;
  const trialEnded = isTrialDateReached(subscription?.trialEndsAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : subscription ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold tracking-tight">
                {subscription.planName || copy.planFallback}
              </p>
              <Badge variant="neutral" tone="soft">
                {getSubscriptionStatusLabel(subscription.status)}
              </Badge>
            </div>

            <InfoRow
              variant="inline"
              label={copy.fields.users}
              value={formatLimitValue(subscription.limits.maxUsers)}
            />
            <InfoRow
              variant="inline"
              label={copy.fields.branches}
              value={formatLimitValue(subscription.limits.maxBranches)}
            />
            <InfoRow
              variant="inline"
              label={copy.fields.historyRetention}
              value={formatHistoryMonths(subscription.limits.historyMonths)}
            />
            {subscription.trialEndsAt ? (
              <InfoRow
                variant="inline"
                label={copy.fields.trial}
                value={formatDate(subscription.trialEndsAt)}
                alert={trialEnded ? "warning" : undefined}
              />
            ) : null}
            {subscription.status === "trialing" &&
            !trialEnded &&
            includedStamps ? (
              <p className="text-xs text-muted-foreground">
                {copy.trialQuotaHint(includedStamps)}
              </p>
            ) : null}
            {subscription.status === "trialing" && trialEnded ? (
              <p className="text-xs text-muted-foreground">
                {copy.trialEndedHint}
              </p>
            ) : null}
            {subscription.notes ? (
              <InfoRow
                variant="inline"
                label={copy.fields.notes}
                value={subscription.notes}
              />
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={<CreditCard className="h-10 w-10" />}
            title={copy.empty.title}
            description={copy.empty.description}
            size="sm"
            cta={{
              label: copy.empty.contactCta,
              icon: <Mail className="h-4 w-4" />,
              variant: "outline",
              onClick: () => {
                window.location.href = `mailto:${billingCopy.contact.email}`;
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
