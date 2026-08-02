import { Link } from "react-router-dom";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import type { BranchListMeta } from "../../domain";
import { branchesCopy } from "../copy/branchesCopy";

interface BranchOverQuotaBannerProps {
  meta?: BranchListMeta;
  canReconcile?: boolean;
  onReconcile?: () => void;
  /** Oculta el enlace a Plan y consumo cuando el banner ya se muestra ahí. */
  hideBillingLink?: boolean;
}

export function BranchOverQuotaBanner({
  meta,
  canReconcile = false,
  onReconcile,
  hideBillingLink = false,
}: BranchOverQuotaBannerProps) {
  if (!meta?.overQuota || meta.maxBranches === null) {
    return null;
  }

  const copy = branchesCopy.overQuota;

  return (
    <AlertWithIcon variant="destructive" className="mb-4">
      <div className="space-y-3">
        <div>
          <p className="font-medium">{copy.title}</p>
          <p className="text-sm">
            {copy.description(meta.activeCount, meta.maxBranches)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReconcile && onReconcile ? (
            <Button type="button" size="sm" variant="secondary" onClick={onReconcile}>
              {copy.adjustAction}
            </Button>
          ) : null}
          {hideBillingLink ? null : (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/settings/subscription">{copy.billingHint}</Link>
            </Button>
          )}
        </div>
      </div>
    </AlertWithIcon>
  );
}
