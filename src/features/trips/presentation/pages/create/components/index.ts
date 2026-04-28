/**
 * Trip Wizard Components - Barrel Export
 */

export { WizardSteps } from "@shared/ui/wizard";
export type { WizardStep } from "@shared/ui/wizard";

export {
  tripWizardSchema,
  tripStopSchema,
  tripCargoSchema,
  tripExpenseSchema,
  WIZARD_STEPS,
  defaultWizardFormValues,
  validateRouteStep,
  stopHasUnifiedAddressId,
} from "./validation";

export type {
  TripWizardFormValues,
  TripStopFormValues,
  TripCargoFormValues,
  TripExpenseFormValues,
  // WizardStepDefinition,
} from "./validation";

export { BasicInfoStep } from "./BasicInfoStep";
export { RouteStep } from "./RouteStep";
export { CargoStep } from "./CargoStep";
export { CostsStep } from "./CostsStep";
export { SummaryStep } from "./SummaryStep";
