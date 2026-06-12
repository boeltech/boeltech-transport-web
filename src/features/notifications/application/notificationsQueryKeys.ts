export const notificationsQueryKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationsQueryKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...notificationsQueryKeys.lists(), filters] as const,
  unreadCount: () => [...notificationsQueryKeys.all, "unread-count"] as const,
};
