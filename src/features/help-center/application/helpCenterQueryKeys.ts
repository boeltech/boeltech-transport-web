import type { HelpArticlesFilters } from "../infrastructure";

export const helpCenterQueryKeys = {
  all: ["help-center"] as const,
  articles: (filters?: HelpArticlesFilters) =>
    [...helpCenterQueryKeys.all, "articles", filters ?? {}] as const,
  article: (id: string) =>
    [...helpCenterQueryKeys.all, "article", id] as const,
  tickets: (filters?: Record<string, unknown>) =>
    [...helpCenterQueryKeys.all, "tickets", filters ?? {}] as const,
  /** Active open+in_progress count for «Mis tickets (N)» */
  ticketOpenCount: () =>
    [...helpCenterQueryKeys.all, "tickets", "open-count"] as const,
  ticket: (id: string) =>
    [...helpCenterQueryKeys.all, "ticket", id] as const,
};
