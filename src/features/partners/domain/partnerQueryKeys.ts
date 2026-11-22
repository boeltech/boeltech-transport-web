export const partnerQueryKeys = {
  all: ["partners"] as const,
  search: () => [...partnerQueryKeys.all, "search"] as const,
  searchQuery: (q: string) => [...partnerQueryKeys.search(), q] as const,
};
