/**
 * Soft-match SICT federal category ↔ VehicleType (ADR-0080).
 * Mirror of API `licenseVehicleMatch` — never hard-blocks trip create.
 */

import type { LicenseTypeValue } from "./entities";

export type LicenseMatchVehicleType =
  | "truck"
  | "torton"
  | "rabon"
  | "pickup"
  | "utility";

const ACCEPTED_CATEGORIES: Record<LicenseMatchVehicleType, LicenseTypeValue[]> =
  {
    truck: ["B", "E"],
    torton: ["B", "C", "E"],
    rabon: ["B", "C", "E"],
    pickup: ["B", "C", "E"],
    utility: ["B", "C", "E"],
  };

/** Soft signal kinds for trip assignment UI (Capa 1 P5). */
export type LicenseAssignmentSoftKind =
  | "category_mismatch"
  | "missing_federal";

export type FederalCategoryMatchResult =
  | { ok: true }
  | {
      ok: false;
      code: "LICENSE_CATEGORY_SOFT_MISMATCH" | "LICENSE_FEDERAL_MISSING";
      kind: LicenseAssignmentSoftKind;
      message: string;
    };

export type LicenseAssignmentSoftSignal = {
  kind: LicenseAssignmentSoftKind;
  message: string;
};

/**
 * Soft evaluation of federal SICT category vs operational vehicle type.
 * Unknown vehicle types → ok (do not warn).
 */
export function evaluateFederalCategoryForVehicleType(
  category: LicenseTypeValue | null | undefined,
  vehicleType: string,
  opts?: { requireFederalForTrip?: boolean },
): FederalCategoryMatchResult {
  const normalized = vehicleType
    .trim()
    .toLowerCase() as LicenseMatchVehicleType;
  const accepted = ACCEPTED_CATEGORIES[normalized];
  if (!accepted) {
    return { ok: true };
  }

  if (!category) {
    if (opts?.requireFederalForTrip) {
      return {
        ok: false,
        code: "LICENSE_FEDERAL_MISSING",
        kind: "missing_federal",
        message:
          "El conductor no tiene licencia federal SICT; se recomienda para esta unidad y para Carta Porte.",
      };
    }
    return { ok: true };
  }

  if (accepted.includes(category)) {
    return { ok: true };
  }

  return {
    ok: false,
    code: "LICENSE_CATEGORY_SOFT_MISMATCH",
    kind: "category_mismatch",
    message: `La categoría SICT ${category} no es la habitual para unidad tipo ${normalized} (recomendadas: ${accepted.join(", ")}).`,
  };
}

/** Known fleet types: warn if federal category missing or mismatched. */
export function getDriverLicenseAssignmentSoftSignal(
  driver: {
    federalLicenseCategory: LicenseTypeValue | null;
  },
  vehicleType: string | null | undefined,
): LicenseAssignmentSoftSignal | undefined {
  if (!vehicleType?.trim()) return undefined;
  const result = evaluateFederalCategoryForVehicleType(
    driver.federalLicenseCategory,
    vehicleType,
    { requireFederalForTrip: true },
  );
  if (result.ok) return undefined;
  return { kind: result.kind, message: result.message };
}

/** @deprecated Prefer getDriverLicenseAssignmentSoftSignal for distinct badges. */
export function getDriverLicenseCategorySoftWarning(
  driver: {
    federalLicenseCategory: LicenseTypeValue | null;
  },
  vehicleType: string | null | undefined,
): string | undefined {
  return getDriverLicenseAssignmentSoftSignal(driver, vehicleType)?.message;
}
