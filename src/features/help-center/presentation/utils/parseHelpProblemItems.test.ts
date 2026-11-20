import { describe, expect, it } from "vitest";
import { parseHelpProblemItems } from "./parseHelpProblemItems";

describe("parseHelpProblemItems", () => {
  it("splits bold symptom and fix; skips support footer", () => {
    const items = parseHelpProblemItems(
      [
        "- **No aparece Despachar….** El viaje no está en **Programado**.",
        "- **El kilometraje final no se acepta.** Corrige el odómetro.",
        "",
        "Si el error persiste, escribe a soporte por correo e incluye la pantalla donde estabas.",
      ].join("\n"),
    );
    expect(items).toEqual([
      {
        symptom: "No aparece Despachar….",
        fix: "El viaje no está en **Programado**.",
      },
      {
        symptom: "El kilometraje final no se acepta.",
        fix: "Corrige el odómetro.",
      },
    ]);
  });
});
