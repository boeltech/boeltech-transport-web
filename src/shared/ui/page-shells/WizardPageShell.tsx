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
 * - scroll al inicio de la página al cambiar de paso
 * - confirmación final (valida todos los pasos previos)
 * - deja el feedback de errores al formulario (inline + summary)
 *
 * NL2/NL4: staff = migas + `exitHref` para Cancelar (sin flecha/ícono);
 * portal = ← Volver; legacy (deprecated) = flecha + ícono hasta migrar.
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

/* eslint-disable react-refresh/only-export-components */
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Breadcrumbs, type Crumb } from "@shared/ui/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  WizardNavigationBar,
  WizardProgressCard,
  WizardSteps,
  type WizardNavigationSecondaryAction,
  type WizardStep,
} from "@shared/ui/wizard";
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

/** Helpers expuestos a cada paso vía `renderStep` (p. ej. «Editar» en el resumen). */
export interface WizardStepRenderHelpers {
  /** Navega a un paso (0-indexed). No revalida pasos previos. */
  goToStep: (stepIndex: number) => void;
}

type WizardHeaderBase = {
  title: string;
  subtitle?: string;
};

export type WizardPageShellHeader =
  | (WizardHeaderBase & {
      variant?: "staff";
      crumbs: readonly Crumb[];
      /** Destino de Cancelar / allowExit (no pinta flecha en el header). */
      exitHref: string;
    })
  | (WizardHeaderBase & {
      variant: "portal";
      backHref: string;
      backLabel?: string;
      icon?: ReactNode;
      iconVariant?: "primary" | "muted";
    })
  /** @deprecated Prefer staff `crumbs` + `exitHref` (NL2/NL4). */
  | (WizardHeaderBase & {
      backHref: string;
      backLabel?: string;
      icon: ReactNode;
      iconVariant?: "primary" | "muted";
    });

export interface WizardPageShellProps {
  // ── Pasos ─────────────────────────────────────────────────────────────────
  steps: WizardStep[];

  // ── Conexión con el form ──────────────────────────────────────────────────
  /** Ref del form que expone `triggerStepValidation` y `requestSubmit`. */
  formRef: RefObject<WizardFormRef | null>;

  // ── Header ────────────────────────────────────────────────────────────────
  header: WizardPageShellHeader;

  // ── Render del paso actual ────────────────────────────────────────────────
  /**
   * Recibe el índice del paso actual y helpers de navegación.
   * El shell siempre pasa `helpers`; otras features pueden ignorarlo.
   */
  renderStep: (
    currentStep: number,
    helpers?: WizardStepRenderHelpers,
  ) => ReactNode;

  // ── Submit ────────────────────────────────────────────────────────────────
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel?: string;
  /** Llamado cuando se cancela. Por defecto navega a exitHref (staff) o backHref. */
  onCancel?: () => void;
  /**
   * Si false, oculta Cancelar y no permite salir por el header en el primer paso
   * (asistentes obligatorios, p. ej. onboarding de producto). Default true.
   */
  allowExit?: boolean;

  /**
   * Comportamiento del botón atrás del header (solo portal / legacy).
   * - `exit` (defecto): siempre sale a `backHref`.
   * - `wizard`: si hay paso anterior, retrocede un paso; si no, sale a `backHref`
   *   (salvo `allowExit={false}`, donde el primer paso no sale).
   * Staff no muestra flecha; Cancelar usa `exitHref`.
   */
  headerBackMode?: "exit" | "wizard";
  /** Callback opcional para sobreescribir el back del header (portal / legacy). */
  onHeaderBack?: () => void;

  // ── ARIA / accesibilidad ──────────────────────────────────────────────────
  stepsAriaLabel?: string;

  className?: string;

  /**
   * Clases extra del contenedor principal según el paso activo.
   * Útil para ensanchar solo el paso de revisión sin cambiar el resto del wizard.
   */
  resolveContainerClassName?: (currentStep: number) => string | undefined;

  /**
   * Paso inicial 0-indexed (p. ej. deep-link `?step=2` → índice 1).
   * Se clampea a `[0, steps.length - 1]`. Default 0.
   */
  initialStep?: number;

  /**
   * Overrides del pie por paso (p. ej. Revisar: Enviar + Guardar borradores, sin Siguiente).
   * Valores omitidos conservan el comportamiento default del shell.
   */
  resolveNavigation?: (
    ctx: WizardNavigationResolveContext,
  ) => WizardNavigationResolveResult | undefined;
}

export interface WizardNavigationResolveContext {
  currentStep: number;
  lastStepIndex: number;
  isSubmitting: boolean;
  goToStep: (stepIndex: number) => void;
}

export interface WizardNavigationResolveResult {
  isLastStep?: boolean;
  submitLabel?: string;
  onSubmit?: () => void;
  onNext?: () => void;
  disableNext?: boolean;
  disableSubmit?: boolean;
  secondaryAction?: WizardNavigationSecondaryAction;
  hidePrimary?: boolean;
  /** Oculta por completo la barra Anterior/Cancelar/primaria. */
  hideNav?: boolean;
  /** Oculta solo el botón Anterior (si hideNav no aplica). */
  hidePrevious?: boolean;
  /** Si false, oculta Cancelar en este paso. Default: allowExit del shell. */
  showCancel?: boolean;
  /**
   * Si true, no se puede volver a pasos previos (stepper ni goToStep atrás).
   * Útil en un paso resultado tras mutación exitosa.
   */
  lockBackward?: boolean;
  primaryTestId?: string;
  /** Si false, oculta el icono Check del submit. Default true. */
  showSubmitIcon?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

export function clampWizardInitialStep(
  initialStep: number | undefined,
  stepCount: number,
): number {
  if (stepCount <= 0) return 0;
  if (initialStep == null || Number.isNaN(initialStep)) return 0;
  return Math.min(Math.max(Math.trunc(initialStep), 0), stepCount - 1);
}

function hasCrumbs(
  header: WizardPageShellHeader,
): header is WizardHeaderBase & {
  crumbs: readonly Crumb[];
  exitHref: string;
} {
  return (
    "crumbs" in header &&
    Array.isArray((header as { crumbs?: unknown }).crumbs)
  );
}

function resolveExitHref(header: WizardPageShellHeader): string {
  if (hasCrumbs(header)) return header.exitHref;
  return (header as { backHref: string }).backHref;
}

const iconBgVariants: Record<"primary" | "muted", string> = {
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
  allowExit = true,
  headerBackMode = "exit",
  onHeaderBack,
  stepsAriaLabel = "Pasos del asistente",
  className,
  resolveContainerClassName,
  initialStep,
  resolveNavigation,
}: WizardPageShellProps) {
  const navigate = useNavigate();
  const staff = hasCrumbs(header);
  const showHeaderBack = !staff;
  const showIcon =
    !staff && "icon" in header && header.icon != null;
  const iconVariant =
    !staff && "iconVariant" in header
      ? (header.iconVariant ?? "primary")
      : "primary";
  const exitHref = resolveExitHref(header);

  const [currentStep, setCurrentStep] = useState(() =>
    clampWizardInitialStep(initialStep, steps.length),
  );
  /** Lock while confirm validates async steps before mutation `isPending`. */
  const [isConfirming, setIsConfirming] = useState(false);
  const isConfirmingRef = useRef(false);
  const isFirstStepRenderRef = useRef(true);

  const lastStepIndex = steps.length - 1;
  const isReview = currentStep === lastStepIndex;
  const navBusy = isSubmitting || isConfirming;
  const headerBackDisabled =
    navBusy || (!allowExit && currentStep === 0 && !onHeaderBack);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const lockBackwardRef = useRef(false);

  useEffect(() => {
    if (isFirstStepRenderRef.current) {
      isFirstStepRenderRef.current = false;
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const handleHeaderBack = useCallback(() => {
    if (onHeaderBack) {
      onHeaderBack();
      return;
    }
    if (lockBackwardRef.current) {
      if (!allowExit) return;
      navigate(exitHref);
      return;
    }
    if (headerBackMode === "wizard" && currentStep > 0) {
      setCurrentStep((s) => s - 1);
      return;
    }
    if (!allowExit) return;
    navigate(exitHref);
  }, [
    onHeaderBack,
    headerBackMode,
    currentStep,
    allowExit,
    navigate,
    exitHref,
  ]);

  const handleCancel = useCallback(() => {
    if (!allowExit) return;
    if (onCancel) onCancel();
    else navigate(exitHref);
  }, [allowExit, onCancel, navigate, exitHref]);

  const validateCurrentStep = useCallback(async () => {
    if (currentStep >= lastStepIndex) return true;
    return (
      (await formRef.current?.triggerStepValidation(currentStep)) ?? false
    );
  }, [currentStep, lastStepIndex, formRef]);

  const handleNext = useCallback(async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    if (currentStep < lastStepIndex) {
      setCurrentStep((s) => s + 1);
    }
  }, [validateCurrentStep, currentStep, lastStepIndex]);

  const handlePrevious = useCallback(() => {
    if (lockBackwardRef.current) return;
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const handleStepClick = useCallback(
    async (stepIndex: number) => {
      if (lockBackwardRef.current && stepIndex < currentStepRef.current) {
        return;
      }
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
    if (isSubmitting || isConfirmingRef.current) return;
    isConfirmingRef.current = true;
    setIsConfirming(true);
    try {
      // Validar todos los pasos previos al review
      for (let i = 0; i < lastStepIndex; i++) {
        const ok = (await formRef.current?.triggerStepValidation(i)) ?? false;
        if (!ok) {
          setCurrentStep(i);
          return;
        }
      }
      formRef.current?.requestSubmit();
    } finally {
      isConfirmingRef.current = false;
      setIsConfirming(false);
    }
  }, [lastStepIndex, formRef, isSubmitting]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex > lastStepIndex) return;
      if (lockBackwardRef.current && stepIndex < currentStepRef.current) {
        return;
      }
      setCurrentStep(stepIndex);
    },
    [lastStepIndex],
  );

  const stepRenderHelpers = useMemo<WizardStepRenderHelpers>(
    () => ({ goToStep }),
    [goToStep],
  );

  const navigationOverrides = resolveNavigation?.({
    currentStep,
    lastStepIndex,
    isSubmitting: navBusy,
    goToStep,
  });
  lockBackwardRef.current = navigationOverrides?.lockBackward === true;
  const hideNav = navigationOverrides?.hideNav === true;
  const footerIsLastStep = navigationOverrides?.isLastStep ?? isReview;
  const footerSubmitLabel = navigationOverrides?.submitLabel ?? submitLabel;
  const footerOnSubmit = navigationOverrides?.onSubmit ?? handleConfirm;
  const footerOnNext = navigationOverrides?.onNext ?? handleNext;
  const footerShowSubmitIcon = navigationOverrides?.showSubmitIcon !== false;
  const footerShowCancel = navigationOverrides?.showCancel ?? allowExit;
  const footerHidePrevious = navigationOverrides?.hidePrevious === true;

  return (
    <div
      className={cn(
        "mx-auto max-w-4xl space-y-6 p-6 pb-24",
        resolveContainerClassName?.(currentStep),
        className,
      )}
    >
      {/* ====================================================================
       * Header
       * ================================================================== */}
      <div className="flex flex-col gap-1.5">
        {staff ? <Breadcrumbs crumbs={header.crumbs} /> : null}
        <div className="flex items-center gap-4">
          {showHeaderBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleHeaderBack}
              disabled={headerBackDisabled}
              aria-label={
                "backLabel" in header && header.backLabel
                  ? header.backLabel
                  : "Volver"
              }
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="flex items-center gap-3">
            {showIcon ? (
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  iconBgVariants[iconVariant],
                )}
              >
                {header.icon}
              </div>
            ) : null}
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
      </div>

      {/* ====================================================================
       * Steps
       * ================================================================== */}
      <WizardProgressCard>
        <WizardSteps
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          allowNavigation={navigationOverrides?.lockBackward !== true}
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
        <CardContent>{renderStep(currentStep, stepRenderHelpers)}</CardContent>
      </Card>

      {/* ====================================================================
       * Navigation bar
       * ================================================================== */}
      {hideNav ? null : (
        <WizardNavigationBar
          canGoBack={
            currentStep > 0 &&
            !navBusy &&
            navigationOverrides?.lockBackward !== true
          }
          isLastStep={footerIsLastStep}
          onPrevious={handlePrevious}
          onCancel={footerShowCancel ? handleCancel : undefined}
          showCancel={footerShowCancel}
          onNext={footerOnNext}
          onSubmit={footerOnSubmit}
          isSubmitting={navBusy}
          submitLabel={footerSubmitLabel}
          disableNext={navigationOverrides?.disableNext}
          disableSubmit={navigationOverrides?.disableSubmit}
          secondaryAction={navigationOverrides?.secondaryAction}
          hidePrimary={navigationOverrides?.hidePrimary}
          hidePrevious={footerHidePrevious}
          primaryTestId={navigationOverrides?.primaryTestId}
          submittingContent={
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {submittingLabel}
            </>
          }
          submitIcon={
            footerShowSubmitIcon ? <Check className="mr-2 h-4 w-4" /> : undefined
          }
        />
      )}
    </div>
  );
});

export default WizardPageShell;
