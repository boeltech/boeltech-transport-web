import { describe, expect, it } from "vitest";
import {
  isZeroKmClose,
  parseStartMileageInput,
  resolveSuggestedEndMileage,
  resolveSuggestedStartMileage,
} from "./startTripMileage";

describe("resolveSuggestedStartMileage", () => {
  it("prioriza kilometraje actual del vehiculo", () => {
    expect(resolveSuggestedStartMileage(125_000, 120_000)).toBe(125_000);
  });

  it("usa start_mileage del viaje si no hay vehiculo", () => {
    expect(resolveSuggestedStartMileage(undefined, 120_000)).toBe(120_000);
  });

  it("acepta 0 km del vehículo como sugerencia", () => {
    expect(resolveSuggestedStartMileage(0, null)).toBe(0);
  });
});

describe("resolveSuggestedEndMileage", () => {
  it("suma km inicial + distancia total del viaje", () => {
    expect(resolveSuggestedEndMileage(3200, 450.4)).toBe(3650);
  });

  it("sin distancia cae al km inicial", () => {
    expect(resolveSuggestedEndMileage(3200, null)).toBe(3200);
    expect(resolveSuggestedEndMileage(3200, 0)).toBe(3200);
  });

  it("sin km inicial no sugiere", () => {
    expect(resolveSuggestedEndMileage(undefined, 100)).toBeUndefined();
    expect(resolveSuggestedEndMileage(null, 100)).toBeUndefined();
  });
});

describe("isZeroKmClose", () => {
  it("marca km final igual al de salida", () => {
    expect(isZeroKmClose(3200, 3200)).toBe(true);
    expect(isZeroKmClose(0, 0)).toBe(true);
  });

  it("no marca con recorrido, sin km de salida o sin km final", () => {
    expect(isZeroKmClose(3200, 3201)).toBe(false);
    expect(isZeroKmClose(null, 3200)).toBe(false);
    expect(isZeroKmClose(undefined, 3200)).toBe(false);
    expect(isZeroKmClose(3200, null)).toBe(false);
  });
});

describe("parseStartMileageInput", () => {
  it("parsea enteros no negativos", () => {
    expect(parseStartMileageInput("150000")).toBe(150_000);
    expect(parseStartMileageInput("0")).toBe(0);
  });

  it("rechaza vacio o invalido", () => {
    expect(parseStartMileageInput("")).toBeNull();
    expect(parseStartMileageInput("-1")).toBeNull();
    expect(parseStartMileageInput("abc")).toBeNull();
  });
});
