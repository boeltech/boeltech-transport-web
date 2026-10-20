import { describe, expect, it } from "vitest";
import { createFleetMarkerElement } from "./FleetMapMarker";

describe("createFleetMarkerElement", () => {
  it("online + course: camión top-down rotado al rumbo", () => {
    const el = createFleetMarkerElement({
      status: "online",
      courseDeg: 90,
      label: "U-001",
    });

    expect(el.getAttribute("aria-label")).toBe("U-001");
    const svg = el.querySelector("svg");
    expect(svg?.getAttribute("data-fleet-marker-glyph")).toBe("truck");
    expect(svg?.getAttribute("style") ?? "").toContain("rotate(90deg)");
    expect(el.querySelector("path")).toBeTruthy();
    expect(el.innerHTML).not.toMatch(/🚛|🚚/);
  });

  it("online sin course: camión sin rotación", () => {
    const el = createFleetMarkerElement({
      status: "online",
      courseDeg: null,
      label: "U-002",
    });

    const svg = el.querySelector("svg");
    expect(svg?.getAttribute("data-fleet-marker-glyph")).toBe("truck");
    expect(svg?.getAttribute("style") ?? "").not.toContain("rotate(");
  });

  it("stale: punto ámbar sin rotación (anillo opcional)", () => {
    const el = createFleetMarkerElement({
      status: "stale",
      courseDeg: 180,
      label: "U-003",
    });

    const svg = el.querySelector("svg");
    expect(svg?.getAttribute("data-fleet-marker-glyph")).toBe("point");
    expect(svg?.getAttribute("style") ?? "").not.toContain("rotate(");
    expect(el.querySelectorAll("circle").length).toBeGreaterThanOrEqual(1);
  });

  it("offline: outline sin rotación aunque haya course", () => {
    const el = createFleetMarkerElement({
      status: "offline",
      courseDeg: 45,
      label: "U-004",
    });

    const svg = el.querySelector("svg");
    expect(svg?.getAttribute("data-fleet-marker-glyph")).toBe("point");
    expect(svg?.getAttribute("style") ?? "").not.toContain("rotate(");
    const circle = el.querySelector("circle");
    expect(circle?.getAttribute("fill")).toBe("transparent");
  });

  it("badge rojo cuando unreadAlertCount > 0", () => {
    const el = createFleetMarkerElement({
      status: "online",
      courseDeg: 0,
      label: "U-005",
      unreadAlertCount: 2,
    });

    expect(el.querySelector('[data-fleet-marker-badge="unread"]')).toBeTruthy();
  });

  it("sin badge cuando unreadAlertCount es 0 o ausente", () => {
    const el = createFleetMarkerElement({
      status: "online",
      courseDeg: 0,
      label: "U-006",
    });

    expect(el.querySelector('[data-fleet-marker-badge="unread"]')).toBeNull();
  });
});
