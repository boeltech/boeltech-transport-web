/**
 * Preferencia comercial del embudo self-serve (sessionStorage).
 * También se envía en POST /onboarding/register (planCode + declaredFleetBand);
 * el storage sigue alimentando el copy del onboarding de producto.
 */
import type { DeclaredFleetBand } from "@shared/commercial/recommendOperationalPlan";
import { DEFAULT_OPERATIONAL_PLAN_CODE } from "@shared/commercial/recommendOperationalPlan";

const STORAGE_KEY = "boeltech.registerFunnelPreference.v1";

export type RegisterFunnelPreference = {
  declaredFleetBand: DeclaredFleetBand | null;
  preferredPlanCode: string;
  savedAt: string;
};

export function saveRegisterFunnelPreference(
  preference: Omit<RegisterFunnelPreference, "savedAt">,
): void {
  try {
    const payload: RegisterFunnelPreference = {
      ...preference,
      preferredPlanCode:
        preference.preferredPlanCode || DEFAULT_OPERATIONAL_PLAN_CODE,
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readRegisterFunnelPreference(): RegisterFunnelPreference | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegisterFunnelPreference;
    if (!parsed || typeof parsed.preferredPlanCode !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRegisterFunnelPreference(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
