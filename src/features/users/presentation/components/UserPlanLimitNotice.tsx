/**
 * Alerta de cupo de usuarios del plan.
 * DetailAlertCard + action «Ver Tu plan» (D5).
 */

import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { usersCopy } from "../copy/usersCopy";
import type { UserPlanCapacity } from "../helpers/userPlanCapacity";

interface UserPlanLimitNoticeProps {
  capacity: UserPlanCapacity;
}

export function UserPlanLimitNotice({ capacity }: UserPlanLimitNoticeProps) {
  if (
    (!capacity.limitReached && !capacity.overQuota) ||
    typeof capacity.maxUsers !== "number"
  ) {
    return null;
  }

  const copy = usersCopy.list.limitNotice;
  const title = capacity.overQuota
    ? copy.overQuotaTitle
    : copy.reachedTitle;
  const description = capacity.overQuota
    ? copy.overQuotaDescription(capacity.activeCount, capacity.maxUsers)
    : copy.reachedDescription(capacity.maxUsers);

  return (
    <DetailAlertCard
      severity={capacity.overQuota ? "critical" : "warning"}
      icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
      title={title}
      action={
        <Button type="button" size="sm" variant="outline" asChild>
          <Link to="/settings/subscription">{copy.billingCta}</Link>
        </Button>
      }
    >
      <p>{description}</p>
    </DetailAlertCard>
  );
}
