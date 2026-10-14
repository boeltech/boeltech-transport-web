import { parse, wcagContrast } from "culori";
import type { ContrastPair } from "./contrastPairs";

export type CssTokenMap = Record<string, string>;

type TokenBlockId = "light" | "dark" | "lightV2" | "darkV2";

const BLOCK_SELECTORS: { id: TokenBlockId; pattern: string }[] = [
  { id: "light", pattern: ":root" },
  { id: "dark", pattern: "\\.dark" },
  {
    id: "lightV2",
    pattern: 'html\\[data-palette="v2"\\]:not\\(\\.dark\\)',
  },
  {
    id: "darkV2",
    pattern: 'html\\.dark\\[data-palette="v2"\\]',
  },
];

function extractDecls(body: string): CssTokenMap {
  const tokens: CssTokenMap = {};
  let decl: RegExpExecArray | null;
  const declRe = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  while ((decl = declRe.exec(body)) !== null) {
    tokens[decl[1]] = decl[2].trim();
  }
  return tokens;
}

/**
 * Parsea bloques de tokens en index.css.
 * v2 se mergea sobre v1 (overrides) para auditar el estado efectivo al switchear.
 */
export function parseCssTokenBlocks(css: string): {
  light: CssTokenMap;
  dark: CssTokenMap;
  lightV2: CssTokenMap;
  darkV2: CssTokenMap;
} {
  const raw: Record<TokenBlockId, CssTokenMap> = {
    light: {},
    dark: {},
    lightV2: {},
    darkV2: {},
  };

  for (const { id, pattern } of BLOCK_SELECTORS) {
    const blockRe = new RegExp(`${pattern}\\s*\\{([^}]*)\\}`, "g");
    let match: RegExpExecArray | null;
    while ((match = blockRe.exec(css)) !== null) {
      Object.assign(raw[id], extractDecls(match[1]));
    }
  }

  return {
    light: raw.light,
    dark: raw.dark,
    lightV2: { ...raw.light, ...raw.lightV2 },
    darkV2: { ...raw.dark, ...raw.darkV2 },
  };
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
