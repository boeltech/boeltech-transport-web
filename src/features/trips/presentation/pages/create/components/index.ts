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
  WIZARD_STEP_FIELDS,
  defaultWizardFormValues,
  validateRouteStep,
  validateCostsStep,
  wizardHasContractingClient,
  stopHasUnifiedAddressId,
} from "./validation";

export {
  tripWizardSchemaWithCreateApiAlignment,
  tripWizardSchemaWithUpdateApiAlignment,
} from "./wizardPackageAlignedSchema";

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
export { TripExpenseSheet } from "./TripExpenseSheet";
export type { TripExpenseSheetKind } from "./expenseCategories";
export { SummaryStep } from "./SummaryStep";
export { TripWizardFinancialSummary } from "./TripWizardFinancialSummary";
export { TripWizardExpenseReadOnlyCard } from "./TripWizardExpenseReadOnlyCard";
export { buildTripWizardFinancialSnapshot } from "./tripWizardFinancialSnapshot";
export {
  formatWizardStopAddressLine,
  formatWizardStopCityLine,
  getWizardStopRoleLabel,
} from "./wizardStopFormat";
