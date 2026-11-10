const DAY_MS = 24 * 60 * 60 * 1000;

/** Días calendario desde el envío a autorización (C27). */
export function approvalAgeDays(
  submittedAt: string | null | undefined,
  now: number = Date.now(),
): number | null {
  if (!submittedAt) return null;
  const submittedMs = Date.parse(submittedAt);
  if (Number.isNaN(submittedMs)) return null;
  return Math.max(0, Math.floor((now - submittedMs) / DAY_MS));
}

export function isApprovalAgingWarning(ageDays: number | null): boolean {
  return typeof ageDays === "number" && ageDays > 1;
}
