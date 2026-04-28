/**
 * WizardSteps — indicador de progreso lineal (referencia: viajes).
 * Ubicación: src/shared/ui/wizard/WizardSteps.tsx
 */

import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Check } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
}

export interface WizardStepsProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
  /** Etiqueta accesible del nav (ej. "Pasos para crear un viaje") */
  ariaLabel?: string;
}

export function WizardSteps({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = false,
  ariaLabel = "Progreso del asistente",
}: WizardStepsProps) {
  return (
    <nav aria-label={ariaLabel} className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = allowNavigation && (isCompleted || isCurrent);

          return (
            <li
              key={step.id}
              className="relative flex-1"
              aria-current={isCurrent ? "step" : undefined}
            >
              {index !== 0 && (
                <div
                  className={cn(
                    "absolute left-0 top-4 -translate-y-1/2 h-0.5 w-full -translate-x-1/2",
                    isCompleted ? "bg-primary" : "bg-muted",
                  )}
                  style={{
                    width: "calc(100% - 2rem)",
                    left: "calc(-50% + 1rem)",
                  }}
                  aria-hidden
                />
              )}

              <div className="relative flex flex-col items-center group">
                <span className="sr-only">
                  {isCurrent
                    ? "Paso actual: "
                    : isCompleted
                      ? "Completado: "
                      : "Pendiente: "}
                  {step.title}
                  {step.description ? `. ${step.description}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    !isCompleted &&
                      !isCurrent &&
                      "border-muted bg-background text-muted-foreground",
                    isClickable && "cursor-pointer hover:scale-110",
                    !isClickable && "cursor-default",
                  )}
                  aria-label={`${step.title}${isCompleted ? " (completado)" : isCurrent ? " (actual)" : ""}`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <span aria-hidden>{index + 1}</span>
                  )}
                </button>

                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isCurrent && "text-primary",
                      isCompleted && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
