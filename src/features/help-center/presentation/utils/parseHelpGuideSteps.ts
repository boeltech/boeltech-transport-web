/**
 * Extrae pasos numerados `1. …` del markdown de `guide`.
 * Si no hay al menos un ítem numerado, devuelve [].
 */
export function parseHelpGuideSteps(guide: string): string[] {
  const lines = guide.replace(/\r\n/g, "\n").split("\n");
  const steps: string[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      steps.push(match[2].trim());
    }
  }

  return steps;
}
