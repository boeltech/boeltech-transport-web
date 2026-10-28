/**
 * Auditoría AA de tokens Ops (L3 · cierra AUDIT-D10).
 * Usa helpers `contrast*` de `@shared/ui/theme` solo aquí / tests — no ThemeCycle.
 */
import { converter, parse, wcagContrast } from "culori";
import type { ContrastPair } from "@shared/ui/theme/contrastPairs";
import {
  auditContrastPairs,
  resolveCssVar,
  type ContrastAuditResult,
  type CssTokenMap,
} from "@shared/ui/theme/contrastCompute";

export type OpsThemeId = "light" | "dark";

/** Pares documentados — texto normal WCAG AA ≥4.5:1 (PRD §E). */
export const OPS_CONTRAST_PAIRS: readonly ContrastPair[] = [
  { fg: "ops-fg", bg: "ops-bg", min: 4.5, label: "fg sobre bg" },
  { fg: "ops-fg", bg: "ops-surface", min: 4.5, label: "fg sobre surface" },
  {
    fg: "ops-fg",
    bg: "ops-bg-elevated",
    min: 4.5,
    label: "fg sobre elevated",
  },
  {
    fg: "ops-fg-muted",
    bg: "ops-bg",
    min: 4.5,
    label: "muted sobre bg",
  },
  {
    fg: "ops-fg-muted",
    bg: "ops-surface",
    min: 4.5,
    label: "muted sobre surface",
  },
  {
    fg: "ops-accent-fg",
    bg: "ops-accent",
    min: 4.5,
    label: "accent-fg sobre accent",
  },
  { fg: "ops-ok", bg: "ops-bg", min: 4.5, label: "ok sobre bg" },
  { fg: "ops-warn", bg: "ops-bg", min: 4.5, label: "warn sobre bg" },
  { fg: "ops-danger", bg: "ops-bg", min: 4.5, label: "danger sobre bg" },
  { fg: "ops-ok", bg: "ops-surface", min: 4.5, label: "ok sobre surface" },
  { fg: "ops-warn", bg: "ops-surface", min: 4.5, label: "warn sobre surface" },
  { fg: "ops-danger", bg: "ops-surface", min: 4.5, label: "danger sobre surface" },
  { fg: "ops-lime", bg: "ops-bg", min: 4.5, label: "lime sobre bg" },
  { fg: "ops-lime", bg: "ops-surface", min: 4.5, label: "lime sobre surface" },
  {
    fg: "ops-accent-fg",
    bg: "ops-danger",
    min: 4.5,
    label: "texto de botón danger",
  },
  { fg: "ops-fg", bg: "ops-rail", min: 4.5, label: "accent sobre rail" },
] as const;

/**
 * Marca de carga sobre superficie. No es texto: no entra al piso AA 4.5.
 * La pista del medidor reutiliza `--ops-border` (no hay color nuevo).
 */
export const OPS_NON_TEXT_PAIRS: readonly ContrastPair[] = [
  {
    fg: "ops-skeleton",
    bg: "ops-surface",
    min: 3,
    label: "skeleton sobre surface (no es texto)",
  },
] as const;

/** Señal de badge suave: 18% sobre la superficie, igual que `.ops-badge-*`. */
export const OPS_SOFT_BADGE_SIGNALS = [
  "ops-ok",
  "ops-warn",
  "ops-danger",
  "ops-lime",
] as const;

export const OPS_SOFT_BADGE_SURFACES = [
  "ops-bg",
  "ops-surface",
  "ops-bg-elevated",
] as const;

/**
 * Valores B1 PRD §C — espejo de `opsTokens.css` (tema).
 * El test de archivo CSS falla si el CSS diverge.
 */
export const OPS_THEME_TOKENS: Record<OpsThemeId, CssTokenMap> = {
  light: {
    "ops-bg": "oklch(0.972 0.003 250)",
    "ops-rail": "oklch(0.94 0.008 250)",
    "ops-surface": "oklch(0.985 0.002 250)",
    "ops-bg-elevated": "oklch(0.995 0.001 250)",
    "ops-border": "oklch(0.88 0.01 250)",
    "ops-fg": "oklch(0.28 0.02 250)",
    "ops-fg-muted": "oklch(0.46 0.015 250)",
    "ops-accent": "oklch(0.45 0.07 250)",
    "ops-accent-fg": "var(--ops-bg-elevated)",
    "ops-ok": "oklch(0.42 0.11 158)",
    "ops-warn": "oklch(0.44 0.11 58)",
    "ops-danger": "oklch(0.44 0.16 27)",
    "ops-lime": "oklch(0.44 0.13 118)",
    "ops-skeleton": "oklch(0.72 0.01 250)",
  },
  dark: {
    "ops-bg": "oklch(0.185 0.01 255)",
    "ops-rail": "oklch(0.155 0.01 255)",
    "ops-surface": "oklch(0.248 0.012 255)",
    "ops-bg-elevated": "oklch(0.215 0.01 255)",
    "ops-border": "oklch(0.42 0.015 255)",
    "ops-fg": "oklch(0.925 0.008 255)",
    "ops-fg-muted": "oklch(0.76 0.012 255)",
    "ops-accent": "oklch(0.78 0.08 250)",
    "ops-accent-fg": "var(--ops-bg)",
    "ops-ok": "oklch(0.78 0.13 158)",
    "ops-warn": "oklch(0.85 0.14 78)",
    "ops-danger": "oklch(0.76 0.17 22)",
    "ops-lime": "oklch(0.84 0.14 118)",
    "ops-skeleton": "oklch(0.55 0.012 255)",
  },
};

function extractDecls(body: string): CssTokenMap {
  const tokens: CssTokenMap = {};
  const declRe = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let decl: RegExpExecArray | null;
  while ((decl = declRe.exec(body)) !== null) {
    tokens[decl[1]] = decl[2].trim();
  }
  return tokens;
}

/**
 * Extrae bloques `.platform-ops[data-ops-theme="light"|"dark"]` de `opsTokens.css`.
 */
export function parseOpsCssTokenBlocks(css: string): {
  light: CssTokenMap;
  dark: CssTokenMap;
} {
  const out: Record<OpsThemeId, CssTokenMap> = { light: {}, dark: {} };

  for (const theme of ["light", "dark"] as const) {
    const re = new RegExp(
      `\\.platform-ops\\[data-ops-theme=["']${theme}["']\\]\\s*\\{([^}]*)\\}`,
      "g",
    );
    let match: RegExpExecArray | null;
    while ((match = re.exec(css)) !== null) {
      Object.assign(out[theme], extractDecls(match[1]));
    }
  }

  return out;
}

export function auditOpsTheme(
  tokens: CssTokenMap,
  pairs: readonly ContrastPair[] = OPS_CONTRAST_PAIRS,
) {
  return auditContrastPairs(tokens, pairs);
}

const toRgb = converter("rgb");

/** Compuesto de `color-mix(signal 18%, transparent)` sobre la superficie. */
function compositeSoft(signal: string, base: string, alpha = 0.18) {
  const fg = toRgb(parse(signal));
  const bg = toRgb(parse(base));
  if (!fg || !bg) return null;
  return {
    mode: "rgb" as const,
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  };
}

export function auditOpsSoftBadges(
  tokens: CssTokenMap,
  surfaces: readonly string[] = OPS_SOFT_BADGE_SURFACES,
): ContrastAuditResult[] {
  const results: ContrastAuditResult[] = [];
  for (const signal of OPS_SOFT_BADGE_SIGNALS) {
    for (const surface of surfaces) {
      const signalValue = resolveCssVar(tokens[signal] ?? "", tokens);
      const surfaceValue = resolveCssVar(tokens[surface] ?? "", tokens);
      const mixed = compositeSoft(signalValue, surfaceValue);
      const ratio =
        mixed && parse(signalValue)
          ? wcagContrast(parse(signalValue)!, mixed)
          : 0;
      const pair: ContrastPair = {
        fg: signal,
        bg: `${surface}-soft`,
        min: 4.5,
        label: `${signal.replace("ops-", "")} badge sobre ${surface.replace("ops-", "")}`,
      };
      results.push({
        pair,
        fgValue: signalValue,
        bgValue: surfaceValue,
        ratio,
        pass: ratio >= pair.min,
      });
    }
  }
  return results;
}

export function formatContrastRatio(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return "—";
  return `${ratio.toFixed(2)}:1`;
}
