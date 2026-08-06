import { Link } from "react-router-dom";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
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
    <AlertWithIcon variant="destructive" title={title}>
      <div className="space-y-3">
        <p>{description}</p>
        <Button type="button" size="sm" variant="outline" asChild>
          <Link to="/settings/subscription">{copy.billingCta}</Link>
        </Button>
      </div>
    </AlertWithIcon>
  );
}
