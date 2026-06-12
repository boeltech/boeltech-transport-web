import { parse, wcagContrast } from "culori";
import type { ContrastPair } from "./contrastPairs";

export type CssTokenMap = Record<string, string>;

export function parseCssTokenBlocks(css: string): {
  light: CssTokenMap;
  dark: CssTokenMap;
} {
  const light: CssTokenMap = {};
  const dark: CssTokenMap = {};

  let match: RegExpExecArray | null;
  const blockRe = /(:root|\.dark)\s*\{([^}]*)\}/g;

  while ((match = blockRe.exec(css)) !== null) {
    const selector = match[1];
    const body = match[2];
    const target = selector === ":root" ? light : dark;

    let decl: RegExpExecArray | null;
    const declRe = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
    while ((decl = declRe.exec(body)) !== null) {
      target[decl[1]] = decl[2].trim();
    }
  }

  return { light, dark };
}

export function resolveCssVar(
  value: string,
  tokens: CssTokenMap,
  depth = 0,
): string {
  if (depth > 8) return value;

  const varMatch = value.match(/^var\(--([a-z0-9-]+)\)$/);
  if (varMatch) {
    const resolved = tokens[varMatch[1]];
    if (resolved) {
      return resolveCssVar(resolved, tokens, depth + 1);
    }
  }

  return value;
}

export function computeContrastRatio(fg: string, bg: string): number {
  const fgColor = parse(fg);
  const bgColor = parse(bg);

  if (!fgColor || !bgColor) {
    return 0;
  }

  return wcagContrast(fgColor, bgColor);
}

export interface ContrastAuditResult {
  pair: ContrastPair;
  fgValue: string;
  bgValue: string;
  ratio: number;
  pass: boolean;
}

export function auditContrastPairs(
  tokens: CssTokenMap,
  pairs: readonly ContrastPair[],
): ContrastAuditResult[] {
  return pairs.map((pair) => {
    const fgRaw = tokens[pair.fg] ?? "";
    const bgRaw = tokens[pair.bg] ?? "";
    const fgValue = resolveCssVar(fgRaw, tokens);
    const bgValue = resolveCssVar(bgRaw, tokens);
    const ratio = computeContrastRatio(fgValue, bgValue);

    return {
      pair,
      fgValue,
      bgValue,
      ratio,
      pass: ratio >= pair.min,
    };
  });
}
