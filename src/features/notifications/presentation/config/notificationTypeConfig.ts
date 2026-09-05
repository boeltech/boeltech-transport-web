import {
  AlertTriangle,
  Banknote,
  Bell,
  ClipboardCheck,
  FileCheck,
  Info,
  MailWarning,
  Mail,
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
  driver_advance_pending: {
    icon: Banknote,
    badgeVariant: "warning",
  },
  settlement_pending: {
    icon: FileCheck,
    badgeVariant: "info",
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
  dispatch_item_failed: {
    icon: MailWarning,
    badgeVariant: "destructive",
  },
  dispatch_run_failed: {
    icon: MailWarning,
    badgeVariant: "destructive",
  },
  dispatch_pending_stamp: {
    icon: Mail,
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
