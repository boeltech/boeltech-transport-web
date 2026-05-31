import type { CopyAcc } from "./types";

export function formatAccLine(copy: CopyAcc): string {
  const first = copy.context ? `${copy.action} — ${copy.context}` : copy.action;
  return copy.consequence ? `${first}. ${copy.consequence}` : first;
}
