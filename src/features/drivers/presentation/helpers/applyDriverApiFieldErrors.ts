import { snakeToCamel } from "@shared/api/utils/case-transformer";
import type { DriverFormData } from "../validation/driverSchema";

const DRIVER_FORM_FIELD_NAMES = new Set<string>([
  "employeeId",
  "federalLicenseNumber",
  "federalLicenseCategory",
  "federalLicenseExpiry",
  "stateLicenseNumber",
  "stateLicenseExpiry",
  "stateIssuingState",
  "medicalCertificateNumber",
  "medicalCertificateExpiry",
  "medicalCertificateIssuer",
  "psychometricTestDate",
  "psychometricTestResult",
  "lastDrugTestDate",
  "drugTestResult",
  "assignedDeviceId",
  "notes",
]);

/**
 * Mapea path de error API (snake_case o camelCase) a campo del form de conductor.
 */
export function resolveDriverFormField(
  apiField: string,
): keyof DriverFormData | null {
  const segment = apiField.split(".").pop()?.trim() || apiField;
  if (!segment || segment === "general") return null;

  const camel = segment.includes("_") ? snakeToCamel(segment) : segment;
  if (DRIVER_FORM_FIELD_NAMES.has(camel)) {
    return camel as keyof DriverFormData;
  }
  return null;
}
