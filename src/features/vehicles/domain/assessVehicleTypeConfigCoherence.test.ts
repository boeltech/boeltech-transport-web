import { describe, expect, it } from "vitest";
import {
  assessVehicleTypeConfigCoherence,
  classifyVehicleConfigFamily,
} from "./assessVehicleTypeConfigCoherence";

/**
 * Tabla DOM (handoff `2026-10-14-vehiculos-coherencia-tipo-config`):
 * truck → T* · torton → C3 / C3R* · rabon → C2 / C2R* · pickup → VL (C2* sin aviso)
 * utility → sin expectativa · OTRO* y GPL* → sin expectativa.
 */

describe("classifyVehicleConfigFamily", () => {
  it.each([
    ["T3S2", "tracto"],
    ["T2S1R2", "tracto"],
    ["C3", "torton"],
    ["C3R2", "torton"],
    ["C3R3", "torton"],
    ["C2", "rabon"],
    ["C2R2", "rabon"],
    ["C2R3", "rabon"],
    ["VL", "ligera"],
  ])("%s → %s", (code, family) => {
    expect(classifyVehicleConfigFamily(code)).toBe(family);
  });

  it("OTRO* / GPL* y vacíos no se clasifican", () => {
    expect(classifyVehicleConfigFamily("OTROEVGP")).toBeNull();
    expect(classifyVehicleConfigFamily("OTROSG")).toBeNull();
    expect(classifyVehicleConfigFamily("GPLUTA")).toBeNull();
    expect(classifyVehicleConfigFamily("GPLATA")).toBeNull();
    expect(classifyVehicleConfigFamily("")).toBeNull();
    expect(classifyVehicleConfigFamily("   ")).toBeNull();
    expect(classifyVehicleConfigFamily(null)).toBeNull();
    expect(classifyVehicleConfigFamily(undefined)).toBeNull();
  });

  it("normaliza espacios y minúsculas", () => {
    expect(classifyVehicleConfigFamily(" t3s2 ")).toBe("tracto");
  });
});

describe("assessVehicleTypeConfigCoherence — tabla DOM", () => {
  it.each([
    ["truck", "T3S2"],
    ["truck", "T2S1R2"],
    ["torton", "C3"],
    ["torton", "C3R2"],
    ["rabon", "C2"],
    ["rabon", "C2R2"],
    ["pickup", "VL"],
  ])("%s + %s → coherente", (type, code) => {
    expect(assessVehicleTypeConfigCoherence(type, code).status).toBe(
      "coherent",
    );
  });

  it("CA6: pickup + C2 → sin aviso (C2* no avisa en camioneta)", () => {
    expect(assessVehicleTypeConfigCoherence("pickup", "C2").status).toBe(
      "coherent",
    );
    expect(assessVehicleTypeConfigCoherence("pickup", "C2R2").status).toBe(
      "coherent",
    );
  });

  it("CA1: tortón + T3S2 → mismatch con familia tracto detectada", () => {
    const result = assessVehicleTypeConfigCoherence("torton", "T3S2");
    expect(result.status).toBe("mismatch");
    if (result.status !== "mismatch") return;
    expect(result.configFamily).toBe("tracto");
    expect(result.expectedFamilies).toEqual(["torton"]);
  });

  it.each([
    ["truck", "C2", "rabon"],
    ["truck", "C3R2", "torton"],
    ["truck", "VL", "ligera"],
    ["torton", "C2", "rabon"],
    ["rabon", "C3", "torton"],
    ["rabon", "T3S3", "tracto"],
    ["pickup", "C3", "torton"],
    ["pickup", "T3S2", "tracto"],
  ])("%s + %s → mismatch (config de %s)", (type, code, configFamily) => {
    const result = assessVehicleTypeConfigCoherence(type, code);
    expect(result.status).toBe("mismatch");
    if (result.status !== "mismatch") return;
    expect(result.configFamily).toBe(configFamily);
  });

  it("CA6: utilitario nunca avisa", () => {
    for (const code of ["T3S2", "C2", "C3", "VL", "OTROSG"]) {
      expect(assessVehicleTypeConfigCoherence("utility", code)).toEqual({
        status: "no_expectation",
      });
    }
  });

  it("CA6: OTRO* / GPL* sin expectativa para cualquier tipo", () => {
    for (const type of ["truck", "torton", "rabon", "pickup"]) {
      expect(assessVehicleTypeConfigCoherence(type, "OTROEVGP")).toEqual({
        status: "no_expectation",
      });
      expect(assessVehicleTypeConfigCoherence(type, "GPLUTA")).toEqual({
        status: "no_expectation",
      });
    }
  });

  it("CA6: config vacía o tipo vacío → sin expectativa", () => {
    expect(assessVehicleTypeConfigCoherence("truck", "")).toEqual({
      status: "no_expectation",
    });
    expect(assessVehicleTypeConfigCoherence("truck", null)).toEqual({
      status: "no_expectation",
    });
    expect(assessVehicleTypeConfigCoherence(undefined, "T3S2")).toEqual({
      status: "no_expectation",
    });
    expect(assessVehicleTypeConfigCoherence("", "T3S2")).toEqual({
      status: "no_expectation",
    });
  });

  it("código desconocido → sin expectativa (no se inventa familia)", () => {
    expect(assessVehicleTypeConfigCoherence("truck", "ZZ9")).toEqual({
      status: "no_expectation",
    });
  });
});
