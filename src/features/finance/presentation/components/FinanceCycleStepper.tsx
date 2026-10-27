import { Link } from "react-router-dom";
import { financeCopy } from "../copy";
import type { FinanceCycleStep } from "../utils/financeHubNav";

interface FinanceCycleStepperProps {
  steps: readonly FinanceCycleStep[];
}

/**
 * Atajos quietos al ciclo del dinero (sidebar es el launcher principal).
 * Sin cards ATF / MetricTrendCard — solo links de texto.
 */
export function FinanceCycleStepper({ steps }: FinanceCycleStepperProps) {
  if (steps.length === 0) return null;

  const copy = financeCopy.page.hub.cycle;

  return (
    <nav aria-label={copy.ariaLabel}>
      <ul className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted-foreground">
        {steps.map((step, index) => (
          <li key={step.id} className="inline-flex items-center gap-x-1">
            {index > 0 ? (
              <span aria-hidden className="px-1 text-border">
                ·
              </span>
            ) : null}
            <Link
              to={step.href}
              aria-label={`${step.verb}: ${step.label}`}
              title={step.hint}
              className="text-foreground/90 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {step.verb}: {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
