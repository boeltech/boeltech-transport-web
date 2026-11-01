/**
 * Reexport del PeriodStepper de Armar pago para consumidores de otras features
 * (p. ej. compensation) sin importar `presentation` cruzado (ADR-0102).
 */
export {
  PeriodStepper,
  type PeriodStepperProps,
} from "../presentation/components/PeriodStepper";
