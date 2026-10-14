import { describe, expect, it } from "vitest";

import { employeesCopy } from "./employeesCopy";

describe("employeesCopy F3 (D14)", () => {
  it("centraliza copy del create (título / subtitle / submit)", () => {
    const { create } = employeesCopy.form;
    expect(create.title).toBe("Nuevo empleado");
    expect(create.subtitle).toBe(
      "Completa los pasos para registrar un empleado",
    );
    expect(create.backLabel).toBe("Volver al listado");
    expect(create.submit).toBe("Registrar empleado");
    expect(create.submittingLabel).toBe("Registrando...");
    expect(create.wizardAriaLabel).toBe("Pasos para registrar un empleado");
  });

  it("usa sentence case en labels del review del wizard", () => {
    const { label, section } = employeesCopy.form;
    for (const text of [
      section.review.title,
      label.reviewName,
      label.reviewHire,
      label.reviewEmail,
      label.reviewAddress,
    ]) {
      expect(text).not.toBe(text.toUpperCase());
      expect(text).not.toMatch(/^[A-ZÁÉÍÓÚÑÜ\s/]+$/);
    }
  });
});
