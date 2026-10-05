/** Subtítulo opcional en ⌘K (~80 chars). */
export function truncateHelpPhrase(phrase: string, max = 80): string {
  const trimmed = phrase.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
