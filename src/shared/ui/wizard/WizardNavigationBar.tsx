import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@shared/ui/button";

export interface WizardNavigationSecondaryAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** data-testid del botón secundario. */
  testId?: string;
}

export interface WizardNavigationBarProps {
  canGoBack: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onCancel?: () => void;
  /** Si false, oculta Cancelar (asistentes obligatorios). Default true. */
  showCancel?: boolean;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  disableNext?: boolean;
  disableSubmit?: boolean;
  submitLabel: string;
  submittingContent?: ReactNode;
  submitIcon?: ReactNode;
  className?: string;
  /** Acción secundaria a la izquierda de la primaria (p. ej. Guardar borradores). */
  secondaryAction?: WizardNavigationSecondaryAction;
  /** Oculta Siguiente / Enviar (paso resultado con CTAs en el cuerpo). */
  hidePrimary?: boolean;
  /** Oculta el botón Anterior (paso terminal). */
  hidePrevious?: boolean;
  /** data-testid del botón primario (Siguiente o submit). */
  primaryTestId?: string;
}

export function WizardNavigationBar({
  canGoBack,
  isLastStep,
  onPrevious,
  onCancel,
  showCancel = true,
  onNext,
  onSubmit,
  isSubmitting = false,
  disableNext = false,
  disableSubmit = false,
  submitLabel,
  submittingContent,
  submitIcon,
  className,
  secondaryAction,
  hidePrimary = false,
  hidePrevious = false,
  primaryTestId,
}: WizardNavigationBarProps) {
  return (
    <div className={`flex items-center justify-between border-t pt-6 mt-6 ${className ?? ""}`}>
      {hidePrevious ? (
        <div />
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoBack}
          aria-label="Anterior"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
      )}

      <div className="flex items-center gap-2">
        {showCancel && onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} aria-label="Cancelar">
            Cancelar
          </Button>
        ) : null}

        {secondaryAction ? (
          <Button
            type="button"
            variant="outline"
            onClick={secondaryAction.onClick}
            disabled={isSubmitting || secondaryAction.disabled}
            data-testid={secondaryAction.testId}
          >
            {secondaryAction.label}
          </Button>
        ) : null}

        {hidePrimary ? null : isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || disableSubmit}
            aria-label={submitLabel}
            data-testid={primaryTestId}
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
          <Button
            type="button"
            onClick={onNext}
            disabled={isSubmitting || disableNext}
            aria-label="Siguiente"
            data-testid={primaryTestId}
          >
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
