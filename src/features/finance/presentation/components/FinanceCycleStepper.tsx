import { Link } from "react-router-dom";
import { financeCopy } from "../copy";
import type { FinanceCycleStep } from "../utils/financeHubNav";

interface FinanceCycleStepperProps {
  steps: readonly FinanceCycleStep[];
}

/**
 * Colas del ciclo (K4) — Por facturar · Envíos · Facturas a crédito · Cobros sin factura.
 */
export function FinanceCycleStepper({ steps }: FinanceCycleStepperProps) {
  if (steps.length === 0) return null;

  const copy = financeCopy.page.hub.cycle;

  return (
    <nav aria-label={copy.ariaLabel}>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <li key={step.id}>
            <Link
              to={step.href}
              aria-label={`${step.label}: ${step.countLabel}`}
              className="flex h-full min-h-0 flex-col gap-1 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-sm font-medium text-muted-foreground">
                {step.label}
              </span>
              <span className="text-base font-semibold tabular-nums text-foreground">
                {step.countLabel}
                <span aria-hidden className="ml-1 text-muted-foreground">
                  ↗
                </span>
              </span>
              <span className="text-xs text-muted-foreground">{step.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
