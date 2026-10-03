import {
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  MinusCircle,
  PauseCircle,
} from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import { compensationCopy } from "../copy/compensationCopy";
import type { TemplateUsageStatus } from "../utils/templateCompositionTypes";
import { getTemplateUsageStatus } from "../utils/getTemplateCompleteness";
import type { CompensationTemplate } from "../../domain/entities";
import type { CompensationTemplateStatus } from "../../domain/enums";

const copy = compensationCopy.templates;

export type CompensationActiveStatus = "active" | "inactive";

export const COMPENSATION_ACTIVE_STATUS_CONFIG: Record<
  CompensationActiveStatus,
  StatusConfig
> = {
  active: createStatusConfig("success", {
    label: copy.active,
    icon: CheckCircle2,
    description: "Vigente en liquidaciones",
    tone: "soft",
  }),
  inactive: createStatusConfig("neutral", {
    label: copy.inactive,
    icon: MinusCircle,
    description: "Inactivo o fuera de vigencia",
    tone: "soft",
  }),
};

const CompensationActiveStatusBadgeBase = createStatusBadgeComponent(
  COMPENSATION_ACTIVE_STATUS_CONFIG,
);

export function CompensationActiveStatusBadge({
  isActive,
}: {
  isActive: boolean;
}) {
  return (
    <CompensationActiveStatusBadgeBase
      status={isActive ? "active" : "inactive"}
    />
  );
}

export const COMPENSATION_TEMPLATE_STATUS_CONFIG: Record<
  CompensationTemplateStatus,
  StatusConfig
> = {
  draft: createStatusConfig("warning", {
    label: copy.status.draft,
    icon: FileEdit,
    description: "Borrador — aún no se usa al liquidar",
    tone: "soft",
  }),
  active: createStatusConfig("success", {
    label: copy.status.active,
    icon: CheckCircle2,
    description: "Activa para liquidar",
    tone: "soft",
  }),
  inactive: createStatusConfig("neutral", {
    label: copy.status.inactive,
    icon: PauseCircle,
    description: "Desactivada",
    tone: "soft",
  }),
};

const CompensationTemplateStatusBadgeBase = createStatusBadgeComponent(
  COMPENSATION_TEMPLATE_STATUS_CONFIG,
);

export function CompensationTemplateStatusBadge({
  status,
}: {
  status: CompensationTemplateStatus;
}) {
  return <CompensationTemplateStatusBadgeBase status={status} />;
}

export const COMPENSATION_USAGE_STATUS_CONFIG: Record<
  TemplateUsageStatus,
  StatusConfig
> = {
  ready: createStatusConfig("success", {
    label: copy.usage.ready,
    icon: CheckCircle2,
    description: "Se puede usar al liquidar",
    tone: "soft",
  }),
  ready_to_activate: createStatusConfig("info", {
    label: copy.usage.readyToActivate,
    icon: CheckCircle2,
    description: "Configurada; falta activar",
    tone: "soft",
  }),
  needs_payment: createStatusConfig("warning", {
    label: copy.usage.needsPayment,
    icon: AlertTriangle,
    description: "Faltan reglas de pago o rutas con tarifa fija",
    tone: "soft",
  }),
  paused: createStatusConfig("neutral", {
    label: copy.usage.paused,
    icon: PauseCircle,
    description: "No se usa al liquidar",
    tone: "soft",
  }),
};

const CompensationUsageStatusBadgeBase = createStatusBadgeComponent(
  COMPENSATION_USAGE_STATUS_CONFIG,
);

export function CompensationUsageStatusBadge({
  template,
}: {
  template: Pick<
    CompensationTemplate,
    "status" | "isActive" | "rules" | "corridorIds"
  >;
}) {
  return (
    <CompensationUsageStatusBadgeBase status={getTemplateUsageStatus(template)} />
  );
}
