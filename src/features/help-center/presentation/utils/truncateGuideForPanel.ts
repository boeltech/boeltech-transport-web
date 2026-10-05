/**
 * Panel-first preview of a help article guide (PRD densidad P1).
 * Keeps the first N steps / ~maxChars so the Sheet stays scannable.
 */
export function truncateGuideForPanel(
  guide: string,
  options?: { maxSteps?: number; maxChars?: number },
): { preview: string; truncated: boolean } {
  const maxSteps = options?.maxSteps ?? 5;
  const maxChars = options?.maxChars ?? 700;
  const text = guide.replace(/\r\n/g, "\n").trim();
  if (!text) return { preview: "", truncated: false };

  const lines = text.split("\n");
  const out: string[] = [];
  let steps = 0;
  let truncated = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isStep = /^\d+\.\s+/.test(line.trim());
    if (isStep) {
      if (steps >= maxSteps) {
        truncated = true;
        break;
      }
      steps += 1;
    }

    const candidate = [...out, line].join("\n");
    if (candidate.length > maxChars && out.length > 0) {
      truncated = true;
      break;
    }
    out.push(line);
  }

  if (!truncated && text.length > maxChars) {
    truncated = true;
  }

  // If we stopped mid-section without hitting step limit, still mark truncated
  // when remaining content exists after the preview.
  const preview = out.join("\n").trim();
  if (!truncated && preview.length < text.length) {
    truncated = true;
  }

  return { preview, truncated };
}
