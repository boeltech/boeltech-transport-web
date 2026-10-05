import { afterEach, describe, expect, it } from "vitest";
import {
  setHelpSpotlightChrome,
  waitForSpotlightChrome,
} from "./helpSpotlightChrome";

describe("helpSpotlightChrome", () => {
  afterEach(() => {
    setHelpSpotlightChrome(false);
    document.body.innerHTML = "";
  });

  it("tucks panel and backdrop when active", () => {
    const backdrop = document.createElement("div");
    backdrop.setAttribute("data-sheet-backdrop", "");
    const panel = document.createElement("div");
    panel.setAttribute("data-help-panel", "");
    document.body.append(backdrop, panel);

    setHelpSpotlightChrome(true);

    expect(
      document.documentElement.getAttribute("data-help-spotlight-active"),
    ).toBe("");
    expect(panel.getAttribute("data-help-spotlight")).toBe("");
    expect(backdrop.getAttribute("data-help-spotlight-backdrop")).toBe("");

    setHelpSpotlightChrome(false);

    expect(
      document.documentElement.hasAttribute("data-help-spotlight-active"),
    ).toBe(false);
    expect(panel.hasAttribute("data-help-spotlight")).toBe(false);
    expect(backdrop.hasAttribute("data-help-spotlight-backdrop")).toBe(false);
  });

  it("waitForSpotlightChrome resolves", async () => {
    await expect(waitForSpotlightChrome()).resolves.toBeUndefined();
  });
});
