/**
 * Stepper vertical del registro para el panel de marca (desktop)
 * y progreso compacto en móvil.
 * Colores: panel marca suave (foreground / muted), no primary-foreground.
 */
import { Check } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { registerFunnelCopy as copy } from "./registerFunnelCopy";
import {
  REGISTER_FUNNEL_STEPS,
  type RegisterFunnelStep,
} from "./registerFunnelSteps";

type RegisterBrandStepperProps = {
  currentStep: RegisterFunnelStep;
  /** panel = vertical en aside; compact = móvil sobre el form */
  variant?: "panel" | "compact";
  className?: string;
};

export function RegisterBrandStepper({
  currentStep,
  variant = "panel",
  className,
}: RegisterBrandStepperProps) {
  const stepIndex = REGISTER_FUNNEL_STEPS.indexOf(currentStep);

  if (variant === "compact") {
    return (
      <div
        className={cn("w-full space-y-2", className)}
        aria-label={copy.progressAria}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {copy.panel.progressLabel}
          </p>
          <p className="text-muted-foreground text-xs">
            {copy.panel.stepOf(stepIndex + 1, REGISTER_FUNNEL_STEPS.length)}
          </p>
        </div>
        <ol className="flex gap-1.5">
          {REGISTER_FUNNEL_STEPS.map((s, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <li
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  done || current ? "bg-primary" : "bg-border",
                )}
                aria-current={current ? "step" : undefined}
              >
                <span className="sr-only">{copy.steps[s].title}</span>
              </li>
            );
          })}
        </ol>
        {/* D5: única mención de trial en móvil (aside oculto) */}
        <p className="text-muted-foreground text-center text-xs">
          {copy.trialHint}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {copy.panel.progressLabel}
        </p>
        <p className="text-foreground text-lg font-semibold tracking-tight">
          {copy.panel.progressTitle}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {copy.panel.progressHint}
        </p>
        {/* D5: única mención de trial en desktop (panel marca) */}
        <p className="text-primary pt-1 text-sm font-medium">{copy.trialHint}</p>
      </div>

      <ol className="space-y-0" aria-label={copy.progressAria}>
        {REGISTER_FUNNEL_STEPS.map((s, i) => {
          const meta = copy.steps[s];
          const status =
            s === currentStep ? "current" : i < stepIndex ? "done" : "upcoming";
          const isLast = i === REGISTER_FUNNEL_STEPS.length - 1;

          return (
            <li key={s} className="relative flex gap-3">
              {!isLast ? (
                <span
                  className={cn(
                    "absolute top-8 left-[15px] h-[calc(100%-1.25rem)] w-px",
                    status === "upcoming" ? "bg-border" : "bg-primary/40",
                  )}
                  aria-hidden
                />
              ) : null}

              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300",
                  status === "current" &&
                    "bg-primary text-primary-foreground shadow-sm",
                  status === "done" && "bg-primary/15 text-primary",
                  status === "upcoming" &&
                    "bg-background text-muted-foreground border-border border",
                )}
                aria-current={status === "current" ? "step" : undefined}
              >
                {status === "done" ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <span aria-hidden>{i + 1}</span>
                )}
              </span>

              <div
                className={cn(
                  "min-w-0 pb-6",
                  isLast && "pb-0",
                  status === "upcoming" && "opacity-60",
                )}
              >
                <p
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    status === "current" ? "text-foreground" : "text-foreground/90",
                  )}
                >
                  {meta.title}
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {meta.panelHint}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
