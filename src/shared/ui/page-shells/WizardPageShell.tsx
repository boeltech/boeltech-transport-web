/**
 * WizardPageShell
 * Shared UI - Page Shells
 *
 * Esqueleto estándar para páginas tipo wizard (creación con pasos).
 * Reemplaza el patrón en DriverCreatePage, CreateVehiclePage, TripFormPage.
 *
 * El shell maneja internamente:
 * - estado del paso actual
 * - validación por paso (delegada al ref del form)
 * - navegación (next, prev, click en step)
 * - confirmación final (valida todos los pasos previos)
 * - toast de "Revisa el formulario" cuando hay errores
 *
 * El form debe exponer este ref para que el shell lo controle:
 *
 * ```ts
 * export interface WizardFormRef {
 *   triggerStepValidation: (stepIndex: number) => Promise<boolean>;
 *   requestSubmit: () => void;
 * }
 * ```
 */

import {
  memo,
  useCallback,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  WizardNavigationBar,
  WizardProgressCard,
  WizardSteps,
  type WizardStep,
} from "@shared/ui/wizard";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";

// ============================================================================
// TYPES
// ============================================================================

export interface WizardFormRef {
  /** Validar un paso específico (0-indexed). Retorna true si pasa. */
  triggerStepValidation: (stepIndex: number) => Promise<boolean>;
  /** Disparar el submit del form. */
  requestSubmit: () => void;
}

export interface WizardPageShellHeader {
  backHref: string;
  backLabel?: string;
  icon: ReactNode;
  iconVariant?: "primary" | "muted";
  title: string;
  subtitle?: string;
}

export interface WizardPageShellProps {
  // ── Pasos ─────────────────────────────────────────────────────────────────
  steps: WizardStep[];

  // ── Conexión con el form ──────────────────────────────────────────────────
  /** Ref del form que expone `triggerStepValidation` y `requestSubmit`. */
  formRef: RefObject<WizardFormRef | null>;

  // ── Header ────────────────────────────────────────────────────────────────
  header: WizardPageShellHeader;

  // ── Render del paso actual ────────────────────────────────────────────────
  /** Recibe el índice del paso actual; retorna el JSX del paso. */
  renderStep: (currentStep: number) => ReactNode;

  // ── Submit ────────────────────────────────────────────────────────────────
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel?: string;
  /** Llamado cuando se cancela. Por defecto navega a backHref. */
  onCancel?: () => void;

  /**
   * Comportamiento del botón atrás del header.
   * - `exit` (defecto): siempre `navigate(header.backHref)`.
   * - `wizard`: si hay paso anterior, retrocede un paso; si no, sale a `backHref`.
   */
  headerBackMode?: "exit" | "wizard";
  /** Callback opcional para sobreescribir el back del header. */
  onHeaderBack?: () => void;

  // ── ARIA / accesibilidad ──────────────────────────────────────────────────
  stepsAriaLabel?: string;

  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const iconBgVariants: Record<
  NonNullable<WizardPageShellHeader["iconVariant"]>,
  string
> = {
  primary: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const WizardPageShell = memo(function WizardPageShell({
  steps,
  formRef,
  header,
  renderStep,
  isSubmitting,
  submitLabel,
  submittingLabel = "Guardando...",
  onCancel,
  headerBackMode = "exit",
  onHeaderBack,
  stepsAriaLabel = "Pasos del asistente",
  className,
}: WizardPageShellProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const lastStepIndex = steps.length - 1;
  const isReview = currentStep === lastStepIndex;

  const handleHeaderBack = useCallback(() => {
    if (onHeaderBack) {
      onHeaderBack();
      return;
    }
    if (headerBackMode === "wizard" && currentStep > 0) {
      setCurrentStep((s) => s - 1);
      return;
    }
    navigate(header.backHref);
  }, [onHeaderBack, headerBackMode, currentStep, navigate, header.backHref]);

  const handleCancel = useCallback(() => {
    if (onCancel) onCancel();
    else navigate(header.backHref);
  }, [onCancel, navigate, header.backHref]);

  const validateCurrentStep = useCallback(async () => {
    if (currentStep >= lastStepIndex) return true;
    return (
      (await formRef.current?.triggerStepValidation(currentStep)) ?? false
    );
  }, [currentStep, lastStepIndex, formRef]);

  const handleNext = useCallback(async () => {
    const ok = await validateCurrentStep();
    if (ok && currentStep < lastStepIndex) {
      setCurrentStep((s) => s + 1);
    }
  }, [validateCurrentStep, currentStep, lastStepIndex]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleStepClick = useCallback(
    async (stepIndex: number) => {
      if (stepIndex <= currentStep) {
        setCurrentStep(stepIndex);
        return;
      }
      const ok = await validateCurrentStep();
      if (!ok) return;
      // Avance por clic: solo un paso a la vez (evita saltar datos obligatorios)
      setCurrentStep((prev) =>
        stepIndex > prev + 1 ? prev + 1 : stepIndex,
      );
    },
    [currentStep, validateCurrentStep],
  );

  const handleConfirm = useCallback(async () => {
    // Validar todos los pasos previos al review
    for (let i = 0; i < lastStepIndex; i++) {
      const ok = (await formRef.current?.triggerStepValidation(i)) ?? false;
      if (!ok) {
        setCurrentStep(i);
        toast({
          title: "Revisa el formulario",
          description: "Corrige los errores en este paso antes de continuar.",
          variant: "destructive",
        });
        return;
      }
    }
    formRef.current?.requestSubmit();
  }, [lastStepIndex, formRef, toast]);

  return (
    <div className={cn("mx-auto max-w-4xl space-y-6 p-6 pb-24", className)}>
      {/* ====================================================================
       * Header
       * ================================================================== */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleHeaderBack}
          disabled={isSubmitting}
          aria-label={header.backLabel ?? "Volver"}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconBgVariants[header.iconVariant ?? "primary"],
            )}
          >
            {header.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {header.title}
            </h1>
            {header.subtitle ? (
              <p className="text-sm text-muted-foreground">{header.subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ====================================================================
       * Steps
       * ================================================================== */}
      <WizardProgressCard>
        <WizardSteps
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          allowNavigation
          ariaLabel={stepsAriaLabel}
        />
      </WizardProgressCard>

      {/* ====================================================================
       * Step content
       * ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {steps[currentStep]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>{renderStep(currentStep)}</CardContent>
      </Card>

      {/* ====================================================================
       * Navigation bar
       * ================================================================== */}
      <WizardNavigationBar
        canGoBack={currentStep > 0 && !isSubmitting}
        isLastStep={isReview}
        onPrevious={handlePrevious}
        onCancel={handleCancel}
        onNext={handleNext}
        onSubmit={handleConfirm}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        submittingContent={
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {submittingLabel}
          </>
        }
        submitIcon={<Check className="mr-2 h-4 w-4" />}
      />
    </div>
  );
});

export default WizardPageShell;
