/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { OPS_THEME_TOKENS, parseOpsCssTokenBlocks } from "./design-system/opsContrastAudit";

const CSS_PATH = resolve(
  process.cwd(),
  "src/features/platform/presentation/ops/opsTokens.css",
);

/** GitHub Primer brand blue — craft reference only; never Ops accent. */
const GH_PRIMER_BLUE = "#0969DA";

describe("Ops foundations F1 (Primer denso × Mando acero)", () => {
  const css = readFileSync(CSS_PATH, "utf8");

  it("keeps density / chrome geometry locked", () => {
    expect(css).toMatch(/--ops-radius:\s*3px/);
    expect(css).toMatch(/--ops-tick-w:\s*3px/);
    expect(css).toMatch(/--ops-row-h:\s*37px/);
    expect(css).toMatch(/--ops-topbar-h:\s*42px/);
    expect(css).toMatch(/--ops-rail-w:\s*168px/);
    expect(css).toMatch(/IBM Plex Sans/);
    expect(css).toMatch(/IBM Plex Mono/);
  });

  it("declares outline + notice tokens and wires the outline button", () => {
    expect(css).toMatch(/--ops-btn-outline-bg:\s*var\(--ops-bg-elevated\)/);
    expect(css).toMatch(/--ops-notice:/);
    expect(css).toMatch(/--ops-focus-ring-w:\s*2px/);
    expect(css).toMatch(/\.platform-ops \.ops-btn-outline\b/);
  });

  it("styles nav active as tick + fill (oficio GH sidebar)", () => {
    expect(css).toMatch(
      /\.ops-nav-link\[aria-current=["']page["']\]\s*\{[^}]*box-shadow:\s*inset var\(--ops-tick-w\)/,
    );
    expect(css).toMatch(
      /\.ops-nav-link\[aria-current=["']page["']\]\s*\{[^}]*color-mix\(in oklch,\s*var\(--ops-fg\)/,
    );
  });

  it("keeps --ops-accent as acero Mando (≠ Primer #0969DA)", () => {
    const parsed = parseOpsCssTokenBlocks(css);
    expect(parsed.light["ops-accent"]).toBe("oklch(0.45 0.07 250)");
    expect(parsed.dark["ops-accent"]).toBe("oklch(0.78 0.08 250)");
    expect(parsed.light["ops-accent"]).not.toMatch(/0969da|#0969/i);
    expect(parsed.dark["ops-accent"]).not.toMatch(/0969da|#0969/i);
    expect(OPS_THEME_TOKENS.light["ops-accent"]).toBe(parsed.light["ops-accent"]);
    expect(OPS_THEME_TOKENS.dark["ops-accent"]).toBe(parsed.dark["ops-accent"]);
    // Comments may cite GH blue as anti-ref; the accent declaration must stay oklch acero.
    expect(css).not.toMatch(
      new RegExp(`--ops-accent:\\s*${GH_PRIMER_BLUE}`, "i"),
    );
  });

  it("keeps surface ladder rail < canvas < surface < elevated", () => {
    const { light, dark } = OPS_THEME_TOKENS;
    const L = (token: string) => {
      const m = /^oklch\(([\d.]+)/.exec(token);
      expect(m, token).toBeTruthy();
      return Number(m![1]);
    };
    for (const theme of [light, dark] as const) {
      expect(L(theme["ops-rail"]!)).toBeLessThan(L(theme["ops-bg"]!));
      expect(L(theme["ops-bg"]!)).toBeLessThan(L(theme["ops-surface"]!));
      expect(L(theme["ops-surface"]!)).toBeLessThan(L(theme["ops-bg-elevated"]!));
    }
  });
});
