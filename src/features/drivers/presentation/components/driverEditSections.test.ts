import { describe, expect, it } from "vitest";
import type { FieldErrors } from "react-hook-form";
import type { DriverFormData } from "../validation/driverSchema";
import {
  DRIVER_EDIT_SECTION_IDS,
  DRIVER_EDIT_SECTIONS,
  countDriverEditSectionErrors,
} from "./driverEditSections";

describe("driverEditSections", () => {
  it("expone las 8 secciones D8 en orden", () => {
    expect(DRIVER_EDIT_SECTIONS.map((s) => s.label)).toEqual([
      "Empleado",
      "Lic. federal",
      "Lic. estatal",
      "Médico",
      "Psicométrico",
      "Antidoping",
      "Dispositivo",
      "Notas",
    ]);
  });

  it("cuenta errores por sección del rail", () => {
    const errors = {
      federalLicenseNumber: { type: "required", message: "Requerido" },
      medicalCertificateExpiry: { type: "custom", message: "Fecha inválida" },
      notes: { type: "max", message: "Demasiado largo" },
    } as FieldErrors<DriverFormData>;

    const counts = countDriverEditSectionErrors(errors);
    expect(counts[DRIVER_EDIT_SECTION_IDS.employee]).toBe(0);
    expect(counts[DRIVER_EDIT_SECTION_IDS.licenseFederal]).toBe(1);
    expect(counts[DRIVER_EDIT_SECTION_IDS.licenseState]).toBe(0);
    expect(counts[DRIVER_EDIT_SECTION_IDS.medical]).toBe(1);
    expect(counts[DRIVER_EDIT_SECTION_IDS.psychometric]).toBe(0);
    expect(counts[DRIVER_EDIT_SECTION_IDS.drugTest]).toBe(0);
    expect(counts[DRIVER_EDIT_SECTION_IDS.device]).toBe(0);
    expect(counts[DRIVER_EDIT_SECTION_IDS.notes]).toBe(1);
  });
});
