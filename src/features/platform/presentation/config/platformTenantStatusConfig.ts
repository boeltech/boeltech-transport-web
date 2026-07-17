import { Ban, CheckCircle2, XCircle } from "lucide-react";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import { createStatusConfig, type StatusConfig } from "@shared/config/status/types";
import {
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformTenantStatus,
  type PlatformTenantStatusType,
} from "../../domain/entities";

export const PLATFORM_TENANT_STATUS_CONFIG: Record<
  PlatformTenantStatusType,
  StatusConfig
> = {
  [PlatformTenantStatus.ACTIVE]: createStatusConfig("success", {
    label: PLATFORM_TENANT_STATUS_LABELS[PlatformTenantStatus.ACTIVE],
    icon: CheckCircle2,
    description: "Tenant operativo",
  }),
  [PlatformTenantStatus.SUSPENDED]: createStatusConfig("warning", {
    label: PLATFORM_TENANT_STATUS_LABELS[PlatformTenantStatus.SUSPENDED],
    icon: Ban,
    description: "Acceso tenant bloqueado",
  }),
  [PlatformTenantStatus.CANCELLED]: createStatusConfig("neutral", {
    label: PLATFORM_TENANT_STATUS_LABELS[PlatformTenantStatus.CANCELLED],
    icon: XCircle,
    description: "Cuenta cancelada",
  }),
};

export const PlatformTenantStatusBadge = createStatusBadgeComponent(
  PLATFORM_TENANT_STATUS_CONFIG,
);
