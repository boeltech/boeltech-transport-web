import { deepToCamel } from "@shared/api";
import type {
  ListNotificationsFilters,
  PaginatedNotifications,
  UserNotification,
} from "../domain";

export interface ApiNotificationItemRaw {
  id: string;
  source: string;
  type: string;
  severity: string;
  title: string;
  body: string | null;
  action_href: string;
  entity_type: string | null;
  entity_id: string | null;
  dedupe_key: string;
  read_at: string | null;
  dismissed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ApiListNotificationsResponseRaw {
  data: ApiNotificationItemRaw[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  meta: {
    unread_count: number;
    synced_at: string;
  };
}

export function mapNotificationItem(raw: ApiNotificationItemRaw): UserNotification {
  return deepToCamel(raw) as UserNotification;
}

export function mapListNotificationsResponse(
  response: ApiListNotificationsResponseRaw,
): PaginatedNotifications {
  return {
    items: response.data.map(mapNotificationItem),
    page: response.pagination.page,
    pageSize: response.pagination.page_size,
    total: response.pagination.total,
    totalPages: response.pagination.total_pages,
    unreadCount: response.meta.unread_count,
    syncedAt: response.meta.synced_at,
  };
}

export function buildListParams(
  filters: ListNotificationsFilters,
): Record<string, string> {
  const params: Record<string, string> = {
    page: String(filters.page ?? 1),
    page_size: String(filters.pageSize ?? 25),
  };

  if (filters.status && filters.status !== "all") {
    params.status = filters.status;
  }
  if (filters.source) params.source = filters.source;
  if (filters.type) params.type = filters.type;
  if (filters.severity) params.severity = filters.severity;

  return params;
}
