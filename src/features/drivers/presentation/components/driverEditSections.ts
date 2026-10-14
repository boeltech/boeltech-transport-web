/**
 * Secciones del form de edición de conductor (D8) + conteo de errores por rail.
 */

import type { FieldErrors } from "react-hook-form";
import type { LucideIcon } from "lucide-react";
import {
  Brain,
  CreditCard,
  Cpu,
  FileText,
  FlaskConical,
  Stethoscope,
  User,
} from "lucide-react";
import type { LongFormSectionItem } from "@shared/ui/form";
import type { DriverFormData } from "../validation/driverSchema";
import { driversCopy } from "../copy";

const fc = driversCopy.form;

export const DRIVER_EDIT_SECTION_IDS = {
  employee: "driver-edit-employee",
  licenseFederal: "driver-edit-license-federal",
  licenseState: "driver-edit-license-state",
  medical: "driver-edit-medical",
  psychometric: "driver-edit-psychometric",
  drugTest: "driver-edit-drug-test",
  device: "driver-edit-device",
  notes: "driver-edit-notes",
} as const;

export type DriverEditSectionKey = keyof typeof DRIVER_EDIT_SECTION_IDS;

export const DRIVER_EDIT_SECTION_ORDER: DriverEditSectionKey[] = [
  "employee",
  "licenseFederal",
  "licenseState",
  "medical",
  "psychometric",
  "drugTest",
  "device",
  "notes",
];

const SECTION_ICONS: Record<DriverEditSectionKey, LucideIcon> = {
  employee: User,
  licenseFederal: CreditCard,
  licenseState: CreditCard,
  medical: Stethoscope,
  psychometric: Brain,
  drugTest: FlaskConical,
  device: Cpu,
  notes: FileText,
};

export const DRIVER_EDIT_SECTIONS: LongFormSectionItem[] =
  DRIVER_EDIT_SECTION_ORDER.map((key) => ({
    id: DRIVER_EDIT_SECTION_IDS[key],
    label: fc.section[key].nav,
    icon: SECTION_ICONS[key],
  }));

/** En edición el empleado es inmutable (banner); sin campos del form. */
export const DRIVER_EDIT_SECTION_FIELDS: Record<
  DriverEditSectionKey,
  (keyof DriverFormData)[]
> = {
  employee: [],
  licenseFederal: [
    "federalLicenseNumber",
    "federalLicenseCategory",
    "federalLicenseExpiry",
  ],
  licenseState: [
    "stateLicenseNumber",
    "stateLicenseExpiry",
    "stateIssuingState",
  ],
  medical: [
    "medicalCertificateNumber",
    "medicalCertificateExpiry",
    "medicalCertificateIssuer",
  ],
  psychometric: ["psychometricTestDate", "psychometricTestResult"],
  drugTest: ["lastDrugTestDate", "drugTestResult"],
  device: ["assignedDeviceId"],
  notes: ["notes"],
};

export function countDriverEditSectionErrors(
  errors: FieldErrors<DriverFormData>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of DRIVER_EDIT_SECTION_ORDER) {
    const sectionId = DRIVER_EDIT_SECTION_IDS[key];
    let n = 0;
    for (const field of DRIVER_EDIT_SECTION_FIELDS[key]) {
      if (errors[field]) n += 1;
    }
    counts[sectionId] = n;
  }
  return counts;
}
