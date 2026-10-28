/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPS_CONTRAST_PAIRS,
  OPS_NON_TEXT_PAIRS,
  OPS_THEME_TOKENS,
  auditOpsSoftBadges,
  auditOpsTheme,
  formatContrastRatio,
  parseOpsCssTokenBlocks,
} from "./opsContrastAudit";
import { computeContrastRatio } from "@shared/ui/theme/contrastCompute";

const CSS_PATH = resolve(
  process.cwd(),
  "src/features/platform/presentation/ops/opsTokens.css",
);

describe("opsContrastAudit (L3 · AUDIT-D10)", () => {
  it("defines AA pairs with min 4.5", () => {
    expect(OPS_CONTRAST_PAIRS.length).toBeGreaterThanOrEqual(6);
    for (const pair of OPS_CONTRAST_PAIRS) {
      expect(pair.min).toBeGreaterThanOrEqual(4.5);
      expect(pair.fg).toMatch(/^ops-/);
      expect(pair.bg).toMatch(/^ops-/);
    }
  });

  it("records skeleton on surface outside the text pairs", () => {
    expect(OPS_CONTRAST_PAIRS.some((pair) => pair.fg === "ops-skeleton")).toBe(
      false,
    );
    expect(OPS_NON_TEXT_PAIRS).toEqual([
      expect.objectContaining({
        fg: "ops-skeleton",
        bg: "ops-surface",
        label: expect.stringContaining("no es texto"),
      }),
    ]);
  });

  it("computeContrastRatio works for oklch black/white", () => {
    expect(computeContrastRatio("oklch(0 0 0)", "oklch(1 0 0)")).toBeGreaterThan(
      20,
    );
  });

  it("formatContrastRatio shows measured ratio not Pass hardcoded", () => {
    expect(formatContrastRatio(4.52)).toBe("4.52:1");
  });

  it("OPS_THEME_TOKENS mirrors opsTokens.css theme blocks", () => {
    const css = readFileSync(CSS_PATH, "utf8");
    const parsed = parseOpsCssTokenBlocks(css);
    for (const theme of ["light", "dark"] as const) {
      for (const key of Object.keys(OPS_THEME_TOKENS[theme])) {
        expect(parsed[theme][key], `${theme}.${key}`).toBe(
          OPS_THEME_TOKENS[theme][key],
        );
      }
    }
  });

  it("light Ops tokens meet WCAG AA for documented pairs", () => {
    const results = auditOpsTheme(OPS_THEME_TOKENS.light);
    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      expect.fail(
        `Light Ops AA failures:\n${failures
          .map(
            (f) =>
              `${f.pair.label ?? f.pair.fg}: ${f.ratio.toFixed(2)}:1 (need ${f.pair.min})`,
          )
          .join("\n")}`,
      );
    }
  });

  it("soft badge text meets AA on bg, surface and elevated", () => {
    for (const theme of ["light", "dark"] as const) {
      const failures = auditOpsSoftBadges(OPS_THEME_TOKENS[theme]).filter(
        (result) => !result.pass,
      );
      if (failures.length > 0) {
        expect.fail(
          `${theme} soft badge AA failures:\n${failures
            .map(
              (f) =>
                `${f.pair.label}: ${f.ratio.toFixed(2)}:1 (need ${f.pair.min})`,
            )
            .join("\n")}`,
        );
      }
    }
  });

  it("dark Ops tokens meet WCAG AA for documented pairs", () => {
    const results = auditOpsTheme(OPS_THEME_TOKENS.dark);
    const failures = results.filter((r) => !r.pass);
    if (failures.length > 0) {
      expect.fail(
        `Dark Ops AA failures:\n${failures
          .map(
            (f) =>
              `${f.pair.label ?? f.pair.fg}: ${f.ratio.toFixed(2)}:1 (need ${f.pair.min})`,
          )
          .join("\n")}`,
      );
    }
  });
});
