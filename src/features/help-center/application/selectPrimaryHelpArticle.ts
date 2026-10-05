import type { HelpArticle } from "../domain";

/**
 * Artículo primario de pantalla = primer resultado por `sortOrder` ASC
 * (mismo orden que `GET /help/articles`).
 */
export function selectPrimaryHelpArticle(
  articles: readonly HelpArticle[] | undefined | null,
): HelpArticle | null {
  if (!articles || articles.length === 0) return null;
  return [...articles].sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
}
