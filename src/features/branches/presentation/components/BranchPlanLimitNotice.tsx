import { Link } from "react-router-dom";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import type { BranchListMeta } from "../../domain";
import { branchesCopy } from "../copy/branchesCopy";

interface BranchPlanLimitNoticeProps {
  meta?: BranchListMeta;
}

/**
 * Aviso cuando el plan está al tope (sin sobrecupo).
 * El sobrecupo sigue en `BranchOverQuotaBanner` (con reconcile).
 */
export function BranchPlanLimitNotice({ meta }: BranchPlanLimitNoticeProps) {
  if (
    !meta ||
    !meta.limitReached ||
    meta.overQuota ||
    typeof meta.maxBranches !== "number"
  ) {
    return null;
  }

  const copy = branchesCopy.limitReached;

  return (
    <AlertWithIcon variant="destructive" title={copy.title}>
      <div className="space-y-3">
        <p>{copy.descriptionWithLimit(meta.maxBranches)}</p>
        <Button type="button" size="sm" variant="outline" asChild>
          <Link to="/settings/subscription">{copy.billingCta}</Link>
        </Button>
      </div>
    </AlertWithIcon>
  );
}
