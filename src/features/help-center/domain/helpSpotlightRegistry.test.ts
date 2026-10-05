import { describe, expect, it } from "vitest";
import {
  getHelpSpotlightTargets,
  getPrimaryHelpSpotlightTarget,
  helpSpotlightRegistry,
} from "./helpSpotlightRegistry";

describe("helpSpotlightRegistry", () => {
  it("covers the five pilot articles with a primary anchor", () => {
    const pilots = [
      ["facturar-viaje", "inv-facturar-row"],
      ["reservar-viaje", "trip-reservar-cta"],
      ["aprobar-cola", "appr-approve-action"],
      ["liquidar-viaje", "stl-liquidar-periodo"],
      ["enviar-factura", "send-enviar-factura"],
    ] as const;

    for (const [articleId, anchorId] of pilots) {
      const primary = getPrimaryHelpSpotlightTarget(articleId);
      expect(primary, articleId).not.toBeNull();
      expect(primary!.anchorId).toBe(anchorId);
      expect(primary!.stepLabel.length).toBeGreaterThan(0);
    }

    expect(Object.keys(helpSpotlightRegistry)).toHaveLength(5);
  });

  it("returns empty targets for unknown articles", () => {
    expect(getHelpSpotlightTargets("no-existe")).toEqual([]);
    expect(getPrimaryHelpSpotlightTarget("no-existe")).toBeNull();
  });
});
