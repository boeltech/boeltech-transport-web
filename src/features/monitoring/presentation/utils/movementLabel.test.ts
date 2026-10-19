import { describe, expect, it } from "vitest";
import { movementLabel } from "./movementLabel";

describe("movementLabel", () => {
  const labels = {
    moving: "En movimiento",
    stopped: "Detenido",
    empty: "—",
  };

  it("maps moving / stopped / null", () => {
    expect(movementLabel("moving", labels)).toBe("En movimiento");
    expect(movementLabel("stopped", labels)).toBe("Detenido");
    expect(movementLabel(null, labels)).toBe("—");
    expect(movementLabel(undefined, labels)).toBe("—");
  });
});
