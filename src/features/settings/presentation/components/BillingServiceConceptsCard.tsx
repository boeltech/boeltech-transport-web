/**
 * Teaser a servicios de cobro (hija). No forma parte del path crítico de timbre.
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { usePermissions } from "@shared/permissions";
import { Skeleton } from "@shared/ui/skeleton";

import { useBillingServiceConcepts } from "../../application/hooks";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";

const copy = billingSettingsCopy.serviceConcepts;

export const BillingServiceConceptsCard = memo(
  function BillingServiceConceptsCard() {
    const { hasPermission } = usePermissions();
    const canRead = hasPermission("billing_service_concepts", "read");
    const { data, isLoading } = useBillingServiceConcepts({ isActive: true });
    const total = data?.length ?? 0;

    if (!canRead) {
      return null;
    }

    return (
      <Link
        to="/settings/billing/service-concepts"
        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0">
          <p className="font-medium text-foreground">{copy.title}</p>
          <p className="text-xs text-muted-foreground">{copy.description}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-4 w-36" />
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {total > 0 ? copy.count(total) : copy.empty}
            </p>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
          {copy.manage}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </Link>
    );
  },
);
