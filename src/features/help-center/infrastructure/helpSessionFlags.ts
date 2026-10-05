/**
 * Flags de sesión para feedback y correlación ticket←artículo (TEC §5.5–5.6).
 * Keys: `help.feedback.<articleId>` · `help.viewed.<articleId>`
 */

const FEEDBACK_PREFIX = "help.feedback.";
const VIEWED_PREFIX = "help.viewed.";

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // private mode / quota — no bloquear UX
  }
}

export function hasHelpFeedback(articleId: string): boolean {
  return safeGet(`${FEEDBACK_PREFIX}${articleId}`) === "1";
}

export function markHelpFeedback(articleId: string): void {
  safeSet(`${FEEDBACK_PREFIX}${articleId}`, "1");
}

export function hasHelpArticleViewed(articleId: string): boolean {
  return safeGet(`${VIEWED_PREFIX}${articleId}`) === "1";
}

export function markHelpArticleViewed(articleId: string): void {
  safeSet(`${VIEWED_PREFIX}${articleId}`, "1");
}
