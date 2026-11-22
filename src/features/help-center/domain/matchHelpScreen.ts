/**
 * Parity twin: boeltech-transport-api/src/modules/help-center/domain/matchHelpScreen.ts
 *
 * Match / score a runtime screen (pathname + optional query) against
 * help_articles.screens patterns. Patterns may include `:param` segments and
 * optional literal query pairs (`?key=value`).
 *
 * Specificity: +100 fixed segment, +1 `:param`, +10 each satisfied query pair.
 * Runtime query keys not declared on the pattern are ignored.
 */

export function scoreHelpScreen(
  screen: string,
  patterns: readonly string[],
): number | null {
  let best: number | null = null;
  for (const pattern of patterns) {
    const score = scoreHelpScreenPattern(screen, pattern);
    if (score !== null && (best === null || score > best)) {
      best = score;
    }
  }
  return best;
}

/**
 * Compatibility wrapper: true when at least one pattern scores.
 * Prefer {@link scoreHelpScreen} + {@link filterArticlesByMaxScreenScore} for lists.
 */
export function matchHelpScreen(
  screen: string,
  patterns: readonly string[],
): boolean {
  return scoreHelpScreen(screen, patterns) !== null;
}

/**
 * Keep only articles whose best screen score equals the maximum among candidates.
 * Articles with no matching pattern are dropped.
 */
export function filterArticlesByMaxScreenScore<
  T extends { screens: readonly string[] },
>(screen: string, articles: readonly T[]): T[] {
  const scored: { article: T; score: number }[] = [];
  for (const article of articles) {
    const score = scoreHelpScreen(screen, article.screens);
    if (score !== null) {
      scored.push({ article, score });
    }
  }
  if (scored.length === 0) return [];
  let maxS = scored[0]!.score;
  for (let i = 1; i < scored.length; i++) {
    if (scored[i]!.score > maxS) maxS = scored[i]!.score;
  }
  return scored.filter((entry) => entry.score === maxS).map((entry) => entry.article);
}

function scoreHelpScreenPattern(screen: string, pattern: string): number | null {
  const runtime = parseScreen(screen);
  const declared = parseScreen(pattern);

  if (!matchesPathname(runtime.pathname, declared.pathname)) {
    return null;
  }

  const queryPairs = declared.query.size;
  if (queryPairs > 0) {
    for (const [key, value] of declared.query) {
      if (runtime.query.get(key) !== value) {
        return null;
      }
    }
  }

  return scorePathSegments(declared.pathname) + queryPairs * 10;
}

function matchesPathname(pathname: string, patternPath: string): boolean {
  if (pathname === patternPath) return true;
  if (!patternPath.includes(":")) return false;

  const regexBody = patternPath
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":") && segment.length > 1) {
        return "[^/]+";
      }
      return escapeRegExp(segment);
    })
    .join("/");

  return new RegExp(`^${regexBody}$`).test(pathname);
}

function scorePathSegments(patternPath: string): number {
  let score = 0;
  for (const segment of patternPath.split("/")) {
    if (segment.length === 0) continue;
    if (segment.startsWith(":") && segment.length > 1) {
      score += 1;
    } else {
      score += 100;
    }
  }
  return score;
}

function parseScreen(value: string): {
  pathname: string;
  query: Map<string, string>;
} {
  const q = value.indexOf("?");
  if (q === -1) {
    return { pathname: value, query: new Map() };
  }

  const pathname = value.slice(0, q);
  const query = new Map<string, string>();
  const search = value.slice(q + 1);
  if (search.length > 0) {
    for (const part of search.split("&")) {
      if (part.length === 0) continue;
      const eq = part.indexOf("=");
      if (eq === -1) {
        query.set(part, "");
      } else {
        query.set(part.slice(0, eq), part.slice(eq + 1));
      }
    }
  }
  return { pathname, query };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
