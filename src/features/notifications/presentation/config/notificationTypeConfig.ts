import {
  AlertTriangle,
  Bell,
  ClipboardCheck,
  Info,
  ShieldAlert,
  Truck,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { NotificationSeverity, NotificationType } from "../../domain";

export interface NotificationTypeVisual {
  icon: LucideIcon;
  badgeVariant: "destructive" | "warning" | "info" | "neutral";
}

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  NotificationTypeVisual
> = {
  trip_expense_pending: {
    icon: ClipboardCheck,
    badgeVariant: "warning",
  },
  overdue_trip: {
    icon: Truck,
    badgeVariant: "destructive",
  },
  license_expiring: {
    icon: UserRound,
    badgeVariant: "warning",
  },
  medical_certificate_expiring: {
    icon: UserRound,
    badgeVariant: "warning",
  },
  insurance_expiring: {
    icon: ShieldAlert,
    badgeVariant: "warning",
  },
  sct_permit_expiring: {
    icon: Wrench,
    badgeVariant: "warning",
  },
};

export function getNotificationSeverityTone(
  severity: NotificationSeverity,
): "destructive" | "warning" | "info" {
  if (severity === "error") return "destructive";
  if (severity === "warning") return "warning";
  return "info";
}

export function getNotificationFallbackIcon(): LucideIcon {
  return Bell;
}

export function getNotificationFallbackIconForSeverity(
  severity: NotificationSeverity,
): LucideIcon {
  if (severity === "error") return AlertTriangle;
  if (severity === "warning") return AlertTriangle;
  return Info;
}
