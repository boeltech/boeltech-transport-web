import { describe, expect, it } from "vitest";
import type { FieldErrors } from "react-hook-form";
import type { CreateVehicleFormData } from "../validation";
import {
  VEHICLE_EDIT_SECTION_IDS,
  VEHICLE_EDIT_SECTIONS,
  countVehicleEditSectionErrors,
} from "./vehicleEditSections";

describe("vehicleEditSections", () => {
  it("expone las 5 secciones D7 en orden", () => {
    expect(VEHICLE_EDIT_SECTIONS.map((s) => s.label)).toEqual([
      "Identificación",
      "Características",
      "Capacidades",
      "Documentación",
      "Carta Porte",
    ]);
  });

  it("cuenta errores por sección del rail", () => {
    const errors = {
      licensePlate: { type: "required", message: "Requerido" },
      year: { type: "min", message: "Año inválido" },
      pesoBrutoVehicular: { type: "required", message: "Requerido" },
    } as FieldErrors<CreateVehicleFormData>;

    const counts = countVehicleEditSectionErrors(errors);
    expect(counts[VEHICLE_EDIT_SECTION_IDS.identification]).toBe(1);
    expect(counts[VEHICLE_EDIT_SECTION_IDS.characteristics]).toBe(1);
    expect(counts[VEHICLE_EDIT_SECTION_IDS.capacities]).toBe(0);
    expect(counts[VEHICLE_EDIT_SECTION_IDS.documentation]).toBe(0);
    expect(counts[VEHICLE_EDIT_SECTION_IDS.cartaPorte]).toBe(1);
  });
});
