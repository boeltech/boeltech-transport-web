import { describe, expect, it } from "vitest";
import { vehiclesCopy } from "./copy/vehiclesCopy";

const BANNED =
  /\bpool\b|ADR-0077|\bADR\b|SubTipoRem|vehicle_remolques|para esta unidad|Agregar remolque/i;

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }
  if (typeof value === "function") {
    const sample = value("ABC1234", 1);
    if (typeof sample === "string") acc.push(sample);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) collectStrings(nested, acc);
  }
  return acc;
}

describe("vehicles cutover copy (Capa 1 D6/D7)", () => {
  it("keeps form and detail free of trailer-as-unit-child lexicon", () => {
    const strings = [
      ...collectStrings(vehiclesCopy.form),
      ...collectStrings(vehiclesCopy.detail),
    ];
    const offenders = strings.filter((text) => BANNED.test(text));
    expect(offenders).toEqual([]);
  });

  it("orients remolque assignment to the trip without a capture section", () => {
    expect(vehiclesCopy.form.hint.trailerAssignedOnTrip).toBe(
      "Si esta configuración usa remolque, se elige al crear el viaje.",
    );
    expect(vehiclesCopy.form.hint.trailerCatalogLink).toBe("Flota → Remolques");
    expect(vehiclesCopy.detail.hint.trailerAssignedOnTrip).toBe(
      "Si esta configuración usa remolque, se elige al crear el viaje.",
    );
    expect("groupTrailers" in vehiclesCopy.form.section.cartaPorte).toBe(false);
    expect("reviewTrailers" in vehiclesCopy.form.label).toBe(false);
    expect("addTrailer" in vehiclesCopy.form.action).toBe(false);
    expect("groupTrailers" in vehiclesCopy.detail.section.permitConfig).toBe(
      false,
    );
    expect("noTrailers" in vehiclesCopy.detail.hint).toBe(false);
  });
});
