import { describe, expect, it } from "vitest";

import { trackingCopy } from "../../copy";
import {
  TRACKING_ON_SITE_PRIMARY_KINDS,
  buildTrackingHeaderContextPhrase,
} from "./trackingHeaderContext";

describe("buildTrackingHeaderContextPhrase (F7.1)", () => {
  it("en sitio + en espera no usa «Siguiente:»", () => {
    const phrase = buildTrackingHeaderContextPhrase({
      situation: "on_site",
      stopLabel: "Coca Cola: Ciel Norte",
      waitingPhase: true,
    });
    expect(phrase).toBe(
      `${trackingCopy.label.onSite} · Coca Cola: Ciel Norte · ${trackingCopy.label.waitingPhase}`,
    );
    expect(phrase).not.toMatch(/Siguiente:/);
  });

  it("en sitio sin fase de espera omite «En espera»", () => {
    const phrase = buildTrackingHeaderContextPhrase({
      situation: "on_site",
      stopLabel: "Bodega QRO",
      waitingPhase: false,
    });
    expect(phrase).toBe(`${trackingCopy.label.onSite} · Bodega QRO`);
    expect(phrase).not.toMatch(/En espera/);
  });

  it("en tránsito usa Siguiente + ETA", () => {
    const phrase = buildTrackingHeaderContextPhrase({
      situation: "in_transit",
      stopLabel: "Cliente CDMX",
      estimatedArrival: new Date("2026-07-12T16:21:00.000Z"),
    });
    expect(phrase).toMatch(/^Siguiente: Cliente CDMX · Llega ~/);
  });

  it("en tránsito sin ETA muestra noEta", () => {
    const phrase = buildTrackingHeaderContextPhrase({
      situation: "in_transit",
      nextStopLabel: "Bodega QRO",
      estimatedArrival: null,
    });
    expect(phrase).toBe(
      `${trackingCopy.label.nextStop("Bodega QRO")} · ${trackingCopy.state.noEta}`,
    );
  });
});

describe("TRACKING_ON_SITE_PRIMARY_KINDS", () => {
  it("incluye cargos/salidas/cierre y no arrive/dispatch", () => {
    expect(TRACKING_ON_SITE_PRIMARY_KINDS.has("cargo_blocked")).toBe(true);
    expect(TRACKING_ON_SITE_PRIMARY_KINDS.has("depart")).toBe(true);
    expect(TRACKING_ON_SITE_PRIMARY_KINDS.has("depart_origin")).toBe(true);
    expect(TRACKING_ON_SITE_PRIMARY_KINDS.has("close")).toBe(true);
    expect(TRACKING_ON_SITE_PRIMARY_KINDS.has("arrive")).toBe(false);
    expect(TRACKING_ON_SITE_PRIMARY_KINDS.has("dispatch")).toBe(false);
  });
});
