import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@shared/ui/button";

export interface WizardNavigationBarProps {
  canGoBack: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onCancel: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  disableNext?: boolean;
  disableSubmit?: boolean;
  submitLabel: string;
  submittingContent?: ReactNode;
  submitIcon?: ReactNode;
  className?: string;
}

export function WizardNavigationBar({
  canGoBack,
  isLastStep,
  onPrevious,
  onCancel,
  onNext,
  onSubmit,
  isSubmitting = false,
  disableNext = false,
  disableSubmit = false,
  submitLabel,
  submittingContent,
  submitIcon,
  className,
}: WizardNavigationBarProps) {
  return (
    <div className={`flex items-center justify-between border-t pt-6 mt-6 ${className ?? ""}`}>
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoBack}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Anterior
      </Button>

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || disableSubmit}
          >
            {isSubmitting ? (
              submittingContent ?? "Guardando..."
            ) : (
              <>
                {submitIcon}
                {submitLabel}
              </>
            )}
          </Button>
        ) : (
          <Button type="button" onClick={onNext} disabled={isSubmitting || disableNext}>
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
