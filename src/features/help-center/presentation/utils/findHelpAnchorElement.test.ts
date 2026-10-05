import { afterEach, describe, expect, it } from "vitest";
import { findHelpAnchorElement } from "./findHelpAnchorElement";

describe("findHelpAnchorElement", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns not_in_dom when the attribute is absent", () => {
    expect(findHelpAnchorElement("inv-facturar-row")).toEqual({
      ok: false,
      reason: "not_in_dom",
    });
  });

  it("returns the first visible element", () => {
    const a = document.createElement("button");
    a.setAttribute("data-help-anchor", "trip-reservar-cta");
    a.textContent = "Reservar";
    Object.defineProperty(a, "getClientRects", {
      value: () => [{ width: 10, height: 10 }],
    });
    document.body.appendChild(a);

    const result = findHelpAnchorElement("trip-reservar-cta");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.element).toBe(a);
    }
  });

  it("returns not_visible when every match is display:none", () => {
    const hidden = document.createElement("button");
    hidden.setAttribute("data-help-anchor", "send-enviar-factura");
    hidden.style.display = "none";
    document.body.appendChild(hidden);

    expect(findHelpAnchorElement("send-enviar-factura")).toEqual({
      ok: false,
      reason: "not_visible",
    });
  });
});
