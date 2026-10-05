/**
 * Match a runtime pathname against help_articles.screens patterns.
 * Patterns may include params (`:id`, `:ticketId`, …) that match one path segment.
 * Parity with API `matchHelpScreen` (TEC §2 / OA-3).
 */
export function matchHelpScreen(
  pathname: string,
  patterns: readonly string[],
): boolean {
  const path = stripQuery(pathname);
  return patterns.some((pattern) => matchesScreenPattern(path, pattern));
}

function matchesScreenPattern(pathname: string, pattern: string): boolean {
  if (pathname === pattern) return true;
  if (!pattern.includes(":")) return false;

  const regexBody = pattern
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

function stripQuery(pathname: string): string {
  const q = pathname.indexOf("?");
  return q === -1 ? pathname : pathname.slice(0, q);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
