import type { LicenseTypeValue } from "./entities";

export type DriverLicenseJurisdiction = "federal" | "state" | "both" | "none";

type LicensePresenceInput = {
  hasFederalLicense?: boolean;
  hasStateLicense?: boolean;
  federalLicenseNumber?: string | null;
  stateLicenseNumber?: string | null;
};

function hasFederal(d: LicensePresenceInput): boolean {
  if (typeof d.hasFederalLicense === "boolean") return d.hasFederalLicense;
  return Boolean(d.federalLicenseNumber?.trim());
}

function hasState(d: LicensePresenceInput): boolean {
  if (typeof d.hasStateLicense === "boolean") return d.hasStateLicense;
  return Boolean(d.stateLicenseNumber?.trim());
}

/** Jurisdicción del expediente dual (ADR-0080). */
export function getDriverLicenseJurisdiction(
  d: LicensePresenceInput,
): DriverLicenseJurisdiction {
  const federal = hasFederal(d);
  const state = hasState(d);
  if (federal && state) return "both";
  if (federal) return "federal";
  if (state) return "state";
  return "none";
}

export function getDriverPrimaryLicenseNumber(d: {
  federalLicenseNumber: string | null;
  stateLicenseNumber: string | null;
}): string {
  const federal = d.federalLicenseNumber?.trim();
  if (federal) return federal;
  return d.stateLicenseNumber?.trim() ?? "";
}

export function getDriverPrimaryLicenseExpiry(d: {
  federalLicenseExpiry: string | null;
  stateLicenseExpiry: string | null;
}): string | null {
  const federal = d.federalLicenseExpiry?.trim();
  if (federal) return federal;
  const state = d.stateLicenseExpiry?.trim();
  return state || null;
}

export function getDriverPrimaryCategoryLabel(
  d: { federalLicenseCategory: LicenseTypeValue | null },
  labels: Record<string, string>,
): string {
  if (!d.federalLicenseCategory) return "";
  return labels[d.federalLicenseCategory] ?? d.federalLicenseCategory;
}
