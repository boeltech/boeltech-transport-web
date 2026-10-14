import { describe, expect, it } from "vitest";
import type { FieldErrors } from "react-hook-form";
import type { BranchFormData } from "../validation/branchSchema";
import {
  BRANCH_EDIT_SECTION_IDS,
  BRANCH_EDIT_SECTIONS,
  countBranchEditSectionErrors,
} from "./branchEditSections";

describe("branchEditSections", () => {
  it("expone las 3 secciones de edit (D8)", () => {
    expect(BRANCH_EDIT_SECTIONS.map((s) => s.label)).toEqual([
      "General",
      "Contacto",
      "Ubicación",
    ]);
  });

  it("cuenta errores por sección del rail", () => {
    const errors = {
      name: { type: "required", message: "Requerido" },
      email: { type: "custom", message: "Correo inválido" },
      notes: { type: "max", message: "Demasiado largo" },
      address: {
        street: { type: "required", message: "Requerido" },
        postalCode: { type: "custom", message: "CP inválido" },
      },
    } as FieldErrors<BranchFormData>;

    const counts = countBranchEditSectionErrors(errors);
    expect(counts[BRANCH_EDIT_SECTION_IDS.general]).toBe(1);
    expect(counts[BRANCH_EDIT_SECTION_IDS.contact]).toBe(1);
    expect(counts[BRANCH_EDIT_SECTION_IDS.location]).toBe(3);
  });
});
