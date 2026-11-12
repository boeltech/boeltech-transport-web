import { beforeEach, describe, expect, it } from "vitest";
import {
  buildCutZeroKmAckStorageKey,
  clearCutZeroKmAcks,
  readCutZeroKmAcks,
  writeCutZeroKmAcks,
} from "./settlementCutZeroKmAckSession";

const PERIOD = {
  periodStart: "2026-11-03",
  periodEnd: "2026-11-09",
  salaryPeriod: "weekly",
} as const;

describe("settlementCutZeroKmAckSession", () => {
  const storageKey = buildCutZeroKmAckStorageKey(PERIOD);

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("buildCutZeroKmAckStorageKey usa periodStart|periodEnd|salaryPeriod", () => {
    expect(storageKey).toBe(
      "settlements.cut.zeroKmAck.v1:2026-11-03|2026-11-09|weekly",
    );
  });

  it("persiste y restaura acks tras «remount» (misma clave de corte)", () => {
    writeCutZeroKmAcks(storageKey, new Set(["emp-xochitl", "emp-fernando"]));

    const restored = readCutZeroKmAcks(storageKey);
    expect([...restored].sort()).toEqual(["emp-fernando", "emp-xochitl"]);
  });

  it("otra sesión de corte (otro periodo) no reutiliza los acks", () => {
    writeCutZeroKmAcks(storageKey, new Set(["emp-xochitl"]));

    const otherKey = buildCutZeroKmAckStorageKey({
      ...PERIOD,
      periodStart: "2026-11-10",
      periodEnd: "2026-11-16",
    });
    expect(readCutZeroKmAcks(otherKey).size).toBe(0);
  });

  it("clearCutZeroKmAcks deja la sesión vacía (p. ej. tras create exitoso)", () => {
    writeCutZeroKmAcks(storageKey, new Set(["emp-felix"]));
    clearCutZeroKmAcks(storageKey);
    expect(readCutZeroKmAcks(storageKey).size).toBe(0);
  });

  it("JSON corrupto o no-array no rompe — Set vacío", () => {
    sessionStorage.setItem(storageKey, "{not-json");
    expect(readCutZeroKmAcks(storageKey).size).toBe(0);

    sessionStorage.setItem(storageKey, JSON.stringify({ ids: ["emp-1"] }));
    expect(readCutZeroKmAcks(storageKey).size).toBe(0);
  });
});
