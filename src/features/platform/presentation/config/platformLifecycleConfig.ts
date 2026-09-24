import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  PauseCircle,
  Rocket,
  Sparkles,
  UserPlus,
  XCircle,
} from "lucide-react";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import { createStatusConfig, type StatusConfig } from "@shared/config/status/types";
import {
  PlatformLifecycleStage,
  type PlatformLifecycleStageType,
} from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";

const labels = platformCopy.lifecycle.labels;

export const PLATFORM_LIFECYCLE_CONFIG: Record<
  PlatformLifecycleStageType,
  StatusConfig
> = {
  [PlatformLifecycleStage.PROSPECT]: createStatusConfig("neutral", {
    label: labels.prospect,
    icon: UserPlus,
    description: "Oportunidad comercial (fuera de tenants F1)",
  }),
  [PlatformLifecycleStage.PROVISIONING]: createStatusConfig("info", {
    label: labels.provisioning,
    icon: Rocket,
    description: "Alta en curso o activación pendiente",
  }),
  [PlatformLifecycleStage.TRIALING]: createStatusConfig("info", {
    label: labels.trialing,
    icon: Sparkles,
    description: "Periodo de prueba activo",
  }),
  [PlatformLifecycleStage.ONBOARDING]: createStatusConfig("warning", {
    label: labels.onboarding,
    icon: Clock,
    description: "Activa reciente sin uso operativo",
  }),
  [PlatformLifecycleStage.ACTIVE]: createStatusConfig("success", {
    label: labels.active,
    icon: CheckCircle2,
    description: "Operación saludable",
  }),
  [PlatformLifecycleStage.AT_RISK]: createStatusConfig("destructive", {
    label: labels.at_risk,
    icon: AlertTriangle,
    description: "Requiere atención (cobro o health)",
  }),
  [PlatformLifecycleStage.SUSPENDED]: createStatusConfig("warning", {
    label: labels.suspended,
    icon: PauseCircle,
    description: "Acceso bloqueado",
  }),
  [PlatformLifecycleStage.CHURNED]: createStatusConfig("neutral", {
    label: labels.churned,
    icon: XCircle,
    description: "Cancelada recientemente",
  }),
  [PlatformLifecycleStage.ARCHIVED]: createStatusConfig("neutral", {
    label: labels.archived,
    icon: Archive,
    description: "Baja antigua",
  }),
};

export const TenantLifecycleBadge = createStatusBadgeComponent(
  PLATFORM_LIFECYCLE_CONFIG,
);

export function getLifecycleStageLabel(stage: string): string {
  return labels[stage] ?? stage;
}
