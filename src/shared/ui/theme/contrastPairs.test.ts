/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTRAST_PAIRS } from "./contrastPairs";
import {
  auditContrastPairs,
  computeContrastRatio,
  parseCssTokenBlocks,
} from "./contrastCompute";

const CSS_PATH = resolve(process.cwd(), "src/app/styles/index.css");

describe("contrastPairs", () => {
  it("defines foreground/background pairs with AA threshold", () => {
    expect(CONTRAST_PAIRS.length).toBeGreaterThan(10);
    for (const pair of CONTRAST_PAIRS) {
      expect(pair.min).toBeGreaterThanOrEqual(4.5);
      expect(pair.fg).toBeTruthy();
      expect(pair.bg).toBeTruthy();
    }
  });

  it("computeContrastRatio returns expected ratio for black on white", () => {
    const ratio = computeContrastRatio("oklch(0 0 0)", "oklch(1 0 0)");
    expect(ratio).toBeGreaterThan(20);
  });

  it("dark theme tokens meet WCAG AA for all contrast pairs", () => {
    const css = readFileSync(CSS_PATH, "utf8");
    const { dark } = parseCssTokenBlocks(css);
    const results = auditContrastPairs(dark, CONTRAST_PAIRS);
    const failures = results.filter((result) => !result.pass);

    if (failures.length > 0) {
      const summary = failures
        .map(
          (f) =>
            `${f.pair.fg}/${f.pair.bg}: ${f.ratio.toFixed(2)}:1 (need ${f.pair.min}:1)`,
        )
        .join("\n");
      expect.fail(`Dark contrast failures:\n${summary}`);
    }
  });

  it("light theme tokens meet WCAG AA for all contrast pairs", () => {
    const css = readFileSync(CSS_PATH, "utf8");
    const { light } = parseCssTokenBlocks(css);
    const results = auditContrastPairs(light, CONTRAST_PAIRS);
    const failures = results.filter((result) => !result.pass);

    if (failures.length > 0) {
      const summary = failures
        .map(
          (f) =>
            `${f.pair.fg}/${f.pair.bg}: ${f.ratio.toFixed(2)}:1 (need ${f.pair.min}:1)`,
        )
        .join("\n");
      expect.fail(`Light contrast failures:\n${summary}`);
    }
  });

  it("palette v2 light tokens meet WCAG AA for all contrast pairs", () => {
    const css = readFileSync(CSS_PATH, "utf8");
    const { lightV2 } = parseCssTokenBlocks(css);
    expect(Object.keys(lightV2).length).toBeGreaterThan(20);
    const results = auditContrastPairs(lightV2, CONTRAST_PAIRS);
    const failures = results.filter((result) => !result.pass);

    if (failures.length > 0) {
      const summary = failures
        .map(
          (f) =>
            `${f.pair.fg}/${f.pair.bg}: ${f.ratio.toFixed(2)}:1 (need ${f.pair.min}:1)`,
        )
        .join("\n");
      expect.fail(`Palette v2 light contrast failures:\n${summary}`);
    }
  });

  it("palette v2 dark tokens meet WCAG AA for all contrast pairs", () => {
    const css = readFileSync(CSS_PATH, "utf8");
    const { darkV2 } = parseCssTokenBlocks(css);
    expect(Object.keys(darkV2).length).toBeGreaterThan(20);
    const results = auditContrastPairs(darkV2, CONTRAST_PAIRS);
    const failures = results.filter((result) => !result.pass);

    if (failures.length > 0) {
      const summary = failures
        .map(
          (f) =>
            `${f.pair.fg}/${f.pair.bg}: ${f.ratio.toFixed(2)}:1 (need ${f.pair.min}:1)`,
        )
        .join("\n");
      expect.fail(`Palette v2 dark contrast failures:\n${summary}`);
    }
  });
});
