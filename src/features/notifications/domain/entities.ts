export const NOTIFICATION_SOURCES = ["approvals", "dashboard"] as const;
export type NotificationSource = (typeof NOTIFICATION_SOURCES)[number];

export const NOTIFICATION_TYPES = [
  "trip_expense_pending",
  "overdue_trip",
  "license_expiring",
  "medical_certificate_expiring",
  "insurance_expiring",
  "sct_permit_expiring",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_SEVERITIES = ["error", "warning", "info"] as const;
export type NotificationSeverity = (typeof NOTIFICATION_SEVERITIES)[number];

export const NOTIFICATION_READ_STATUS = ["all", "unread", "read"] as const;
export type NotificationReadStatus = (typeof NOTIFICATION_READ_STATUS)[number];

export interface UserNotification {
  id: string;
  source: NotificationSource;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string | null;
  actionHref: string;
  entityType: string | null;
  entityId: string | null;
  dedupeKey: string;
  readAt: string | null;
  dismissedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsFilters {
  status?: NotificationReadStatus;
  source?: NotificationSource;
  type?: NotificationType;
  severity?: NotificationSeverity;
  page?: number;
  pageSize?: number;
}

export interface PaginatedNotifications {
  items: UserNotification[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  unreadCount: number;
  syncedAt: string;
}

export interface MarkAllNotificationsReadInput {
  source?: NotificationSource;
  type?: NotificationType;
}
