import { Ban, ShieldAlert, UserCheck } from "lucide-react";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import { createStatusConfig, type StatusConfig } from "@shared/config/status/types";
import {
  USER_STATUS_LABELS,
  UserStatus,
  type UserStatusType,
} from "../../domain";

export const USER_STATUS_CONFIG: Record<UserStatusType, StatusConfig> = {
  [UserStatus.ACTIVE]: createStatusConfig("success", {
    label: USER_STATUS_LABELS[UserStatus.ACTIVE],
    icon: UserCheck,
    description: "Usuario con acceso activo",
  }),
  [UserStatus.INACTIVE]: createStatusConfig("neutral", {
    label: USER_STATUS_LABELS[UserStatus.INACTIVE],
    icon: Ban,
    description: "Usuario desactivado",
  }),
  [UserStatus.SUSPENDED]: createStatusConfig("warning", {
    label: USER_STATUS_LABELS[UserStatus.SUSPENDED],
    icon: ShieldAlert,
    description: "Usuario suspendido temporalmente",
  }),
};

export const UserStatusBadge = createStatusBadgeComponent(USER_STATUS_CONFIG);

export function getUserStatusConfig(status: UserStatusType): StatusConfig {
  return USER_STATUS_CONFIG[status];
}
