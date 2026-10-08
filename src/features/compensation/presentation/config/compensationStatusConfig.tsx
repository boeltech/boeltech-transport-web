import {
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  History,
  MinusCircle,
  PauseCircle,
} from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { compensationCopy } from "../copy/compensationCopy";
import type { TemplateUsageStatus } from "../utils/templateCompositionTypes";
import { getTemplateUsageStatus } from "../utils/getTemplateCompleteness";
import {
  TEMPLATE_DISPLAY_STATUS_LABELS,
  type TemplateDisplayStatus,
  getTemplateDisplayStatus,
} from "../utils/getTemplateDisplayStatus";
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
    description: "Vigente en pagos",
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
    description: "Borrador — aún no se usa al armar pagos",
    tone: "soft",
  }),
  active: createStatusConfig("success", {
    label: copy.status.active,
    icon: CheckCircle2,
    description: "Activa para armar pagos",
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

const COMPENSATION_TEMPLATE_DISPLAY_STATUS_CONFIG: Record<
  TemplateDisplayStatus,
  StatusConfig
> = {
  draft: COMPENSATION_TEMPLATE_STATUS_CONFIG.draft,
  active: COMPENSATION_TEMPLATE_STATUS_CONFIG.active,
  superseded: createStatusConfig("info", {
    label: TEMPLATE_DISPLAY_STATUS_LABELS.superseded,
    icon: History,
    description: copy.statusTooltips.superseded,
    tone: "soft",
  }),
  deactivated: createStatusConfig("neutral", {
    label: TEMPLATE_DISPLAY_STATUS_LABELS.deactivated,
    icon: PauseCircle,
    description: copy.statusTooltips.deactivated,
    tone: "soft",
  }),
  inactive_unknown: COMPENSATION_TEMPLATE_STATUS_CONFIG.inactive,
};

const DISPLAY_STATUS_TOOLTIPS: Partial<Record<TemplateDisplayStatus, string>> = {
  superseded: copy.statusTooltips.superseded,
  deactivated: copy.statusTooltips.deactivated,
};

const CompensationTemplateDisplayStatusBadgeBase = createStatusBadgeComponent(
  COMPENSATION_TEMPLATE_DISPLAY_STATUS_CONFIG,
);

/** Insignia calculada (Reemplazada / Desactivada / fallback «Inactiva»); tooltip solo en las dos primeras. */
export function CompensationTemplateDisplayStatusBadge({
  template,
}: {
  template: Parameters<typeof getTemplateDisplayStatus>[0];
}) {
  const displayStatus = getTemplateDisplayStatus(template);
  const badge = <CompensationTemplateDisplayStatusBadgeBase status={displayStatus} />;
  const tooltip = DISPLAY_STATUS_TOOLTIPS[displayStatus];
  if (!tooltip) return badge;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-flex cursor-help rounded-md"
            data-testid="template-display-status-trigger"
          >
            {badge}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const COMPENSATION_USAGE_STATUS_CONFIG: Record<
  TemplateUsageStatus,
  StatusConfig
> = {
  ready: createStatusConfig("success", {
    label: copy.usage.ready,
    icon: CheckCircle2,
    description: "Se puede usar al armar el pago",
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
    description: "Faltan reglas de pago o tarifas por corredor",
    tone: "soft",
  }),
  superseded_paying: createStatusConfig("info", {
    label: copy.usage.supersededPaying,
    icon: History,
    description: "Sigue calculando el pago de los operadores asignados",
    tone: "soft",
  }),
  paused: createStatusConfig("neutral", {
    label: copy.usage.paused,
    icon: PauseCircle,
    description: "No se usa al armar el pago",
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
    "status" | "isActive" | "rules" | "corridorIds" | "inactiveReason"
  >;
}) {
  return (
    <CompensationUsageStatusBadgeBase status={getTemplateUsageStatus(template)} />
  );
}
