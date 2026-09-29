/** Recortes del panel «Filtros». El periodo no cuenta. */
export function countUserActivityPanelFilters(input: {
  action: string;
  subjectUserId: string;
  actorUserId: string;
}): number {
  return (
    Number(Boolean(input.action)) +
    Number(Boolean(input.subjectUserId)) +
    Number(Boolean(input.actorUserId))
  );
}

export type UserActivityEmptyKind = "virgin" | "window" | "recorte";

export function resolveUserActivityEmptyKind(input: {
  hasRecortes: boolean;
  isEntireHistory: boolean;
}): UserActivityEmptyKind {
  if (input.hasRecortes) return "recorte";
  if (input.isEntireHistory) return "virgin";
  return "window";
}
