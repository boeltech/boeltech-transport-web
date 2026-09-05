import { AlertTriangle, CheckCircle2, MinusCircle, PauseCircle } from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import { compensationCopy } from "../copy/compensationCopy";
import type { TemplateUsageStatus } from "../utils/templateCompositionTypes";
import { getTemplateUsageStatus } from "../utils/getTemplateCompleteness";
import type { CompensationTemplate } from "../../domain/entities";

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
  template: Pick<CompensationTemplate, "isActive" | "rules" | "corridorIds">;
}) {
  return (
    <CompensationUsageStatusBadgeBase status={getTemplateUsageStatus(template)} />
  );
}
