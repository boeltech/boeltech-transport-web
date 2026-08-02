/**
 * Pasos del embudo de registro self-serve (compartidos stepper + página).
 */
export type RegisterFunnelStep = "company" | "plan" | "admin" | "confirm";

export const REGISTER_FUNNEL_STEPS: RegisterFunnelStep[] = [
  "company",
  "plan",
  "admin",
  "confirm",
];
