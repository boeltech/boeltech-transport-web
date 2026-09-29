import { Link } from "react-router-dom";
import { financeCopy } from "../copy";
import type { FinanceCycleStep } from "../utils/financeHubNav";

interface FinanceCycleStepperProps {
  steps: readonly FinanceCycleStep[];
}

export function FinanceCycleStepper({ steps }: FinanceCycleStepperProps) {
  if (steps.length === 0) return null;

  const copy = financeCopy.page.hub.cycle;

  return (
    <nav aria-label={copy.ariaLabel}>
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.id}>
            <Link
              to={step.href}
              aria-label={`${step.verb}: ${step.label}`}
              className="flex h-full flex-col gap-1 rounded-xl border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {index + 1}. {step.verb}
              </p>
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.hint}</p>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
