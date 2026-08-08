import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MailX,
  MinusCircle,
} from "lucide-react";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import { createStatusConfig, type StatusConfig } from "@shared/config/status/types";
import {
  ADMIN_ACTIVATION_STATUS_LABELS,
  AdminActivationStatus,
  type AdminActivationStatusType,
} from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";

const labels = platformCopy.tenants.detail.adminActivation.statusLabels;
const hints = platformCopy.tenants.detail.adminActivation.statusHints;

export const ADMIN_ACTIVATION_STATUS_CONFIG: Record<
  AdminActivationStatusType,
  StatusConfig
> = {
  [AdminActivationStatus.PENDING]: createStatusConfig("warning", {
    label: labels.pending ?? ADMIN_ACTIVATION_STATUS_LABELS.pending,
    icon: Clock,
    description: hints.pending,
  }),
  [AdminActivationStatus.EMAIL_FAILED]: createStatusConfig("destructive", {
    label: labels.email_failed ?? ADMIN_ACTIVATION_STATUS_LABELS.email_failed,
    icon: MailX,
    description: hints.email_failed,
  }),
  [AdminActivationStatus.EXPIRED]: createStatusConfig("warning", {
    label: labels.expired ?? ADMIN_ACTIVATION_STATUS_LABELS.expired,
    icon: AlertTriangle,
    description: hints.expired,
  }),
  [AdminActivationStatus.ACTIVATED]: createStatusConfig("success", {
    label: labels.activated ?? ADMIN_ACTIVATION_STATUS_LABELS.activated,
    icon: CheckCircle2,
    description: hints.activated,
  }),
  [AdminActivationStatus.NONE]: createStatusConfig("neutral", {
    label: labels.none ?? ADMIN_ACTIVATION_STATUS_LABELS.none,
    icon: MinusCircle,
    description: hints.none,
  }),
};

export const AdminActivationStatusBadge = createStatusBadgeComponent(
  ADMIN_ACTIVATION_STATUS_CONFIG,
);
