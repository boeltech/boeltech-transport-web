import { describe, expect, it } from "vitest";
import type { FieldErrors } from "react-hook-form";
import type { ClientFormData } from "../validation/clientSchema";
import {
  CLIENT_EDIT_SECTION_IDS,
  CLIENT_EDIT_SECTIONS,
  countClientEditSectionErrors,
  getClientEditSections,
} from "./clientEditSections";

describe("clientEditSections", () => {
  it("expone las 5 secciones de edit con Envío (D8)", () => {
    expect(CLIENT_EDIT_SECTIONS.map((s) => s.label)).toEqual([
      "Tipo",
      "Fiscal",
      "Envío",
      "Comercial",
      "Notas",
    ]);
  });

  it("omite Envío del rail cuando el perfil es Solo comercial", () => {
    expect(getClientEditSections(false).map((s) => s.label)).toEqual([
      "Tipo",
      "Fiscal",
      "Comercial",
      "Notas",
    ]);
  });

  it("cuenta errores por sección del rail", () => {
    const errors = {
      type: { type: "required", message: "Requerido" },
      legalName: { type: "required", message: "Requerido" },
      taxId: { type: "custom", message: "RFC inválido" },
      creditDays: { type: "min", message: "Inválido" },
      notes: { type: "max", message: "Demasiado largo" },
    } as FieldErrors<ClientFormData>;

    const counts = countClientEditSectionErrors(errors);
    expect(counts[CLIENT_EDIT_SECTION_IDS.type]).toBe(1);
    expect(counts[CLIENT_EDIT_SECTION_IDS.fiscal]).toBe(2);
    expect(counts[CLIENT_EDIT_SECTION_IDS.dispatch]).toBe(0);
    expect(counts[CLIENT_EDIT_SECTION_IDS.commercial]).toBe(1);
    expect(counts[CLIENT_EDIT_SECTION_IDS.notes]).toBe(1);
  });
});
