/**
 * Teaser wayfinding a frecuencias (ADR-0082) en Finanzas.
 * Conserva deep-link; no es requisito de timbre.
 */

import { memo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { FINANCE_DISPATCH_PERIOD_PATH } from "@features/finance/application";

import { billingSettingsCopy } from "../copy/billingSettingsCopy";

const copy = billingSettingsCopy.dispatchSchemes;

export const BillingDispatchSchemesCard = memo(
  function BillingDispatchSchemesCard() {
    return (
      <Link
        to={FINANCE_DISPATCH_PERIOD_PATH}
        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0">
          <p className="font-medium text-foreground">{copy.title}</p>
          <p className="text-xs text-muted-foreground">{copy.description}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
          {copy.openInFinance}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </Link>
    );
  },
);
