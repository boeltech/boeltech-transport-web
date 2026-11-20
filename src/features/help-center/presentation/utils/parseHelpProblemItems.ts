export interface HelpProblemItem {
  symptom: string;
  fix: string;
}

const SUPPORT_FOOTER_RE =
  /^Si el error persiste/i;

/**
 * Extrae filas «síntoma + salida» de `problem` (bullets con negrita al inicio).
 * Omite el pie de soporte del estándar (mailto vive fuera, V3).
 */
export function parseHelpProblemItems(problem: string): HelpProblemItem[] {
  const lines = problem.replace(/\r\n/g, "\n").split("\n");
  const items: HelpProblemItem[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed || SUPPORT_FOOTER_RE.test(trimmed)) continue;

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (!bullet) continue;

    const body = bullet[1].trim();
    const boldLead = body.match(/^\*\*(.+?)\*\*\s*(.*)$/);
    if (boldLead) {
      items.push({
        symptom: boldLead[1].trim(),
        fix: boldLead[2].trim(),
      });
      continue;
    }

    items.push({ symptom: body, fix: "" });
  }

  return items;
}
