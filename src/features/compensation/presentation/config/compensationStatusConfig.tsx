import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
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
import { formatDate } from "@shared/utils/dateUtils";
import { compensationCopy } from "../copy/compensationCopy";
import type { TemplateUsageStatus } from "../utils/templateCompositionTypes";
import {
  type AssignmentDisplayStatus,
  getAssignmentDisplayStatus,
} from "../utils/getAssignmentDisplayStatus";
import { getTemplateUsageStatus } from "../utils/getTemplateCompleteness";
import {
  TEMPLATE_DISPLAY_STATUS_LABELS,
  type TemplateDisplayStatus,
  getTemplateDisplayStatus,
} from "../utils/getTemplateDisplayStatus";
import type { CompensationTemplate, TemplateAssignment } from "../../domain/entities";
import type { CompensationTemplateStatus } from "../../domain/enums";

const copy = compensationCopy.templates;
const assignmentCopy = compensationCopy.assignments;

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

const ASSIGNMENT_DISPLAY_STATUS_CONFIG: Record<AssignmentDisplayStatus, StatusConfig> = {
  current: createStatusConfig("success", {
    label: assignmentCopy.displayStatus.current,
    icon: CheckCircle2,
    description: assignmentCopy.displayStatusTooltip.current,
    tone: "soft",
  }),
  scheduled: createStatusConfig("info", {
    label: assignmentCopy.displayStatus.scheduled,
    icon: CalendarClock,
    description: assignmentCopy.displayStatus.scheduled,
    tone: "soft",
  }),
  concluded: {
    ...createStatusConfig("neutral", {
      label: assignmentCopy.displayStatus.concluded,
      icon: CalendarCheck,
      description: assignmentCopy.displayStatus.concluded,
      tone: "soft",
    }),
    bgColor: "bg-transparent",
    textColor: "text-muted-foreground",
  },
  deactivated: createStatusConfig("neutral", {
    label: assignmentCopy.displayStatus.deactivated,
    icon: PauseCircle,
    description: assignmentCopy.displayStatusTooltip.deactivated,
    tone: "soft",
  }),
};

const AssignmentDisplayStatusBadgeBase = createStatusBadgeComponent(
  ASSIGNMENT_DISPLAY_STATUS_CONFIG,
);

function assignmentStatusTooltip(
  status: AssignmentDisplayStatus,
  assignment: Pick<TemplateAssignment, "effectiveFrom" | "effectiveTo">,
): string {
  const tooltips = assignmentCopy.displayStatusTooltip;
  switch (status) {
    case "current":
      return tooltips.current;
    case "scheduled":
      return tooltips.scheduled(formatDate(assignment.effectiveFrom));
    case "concluded":
      return tooltips.concluded(formatDate(assignment.effectiveTo));
    case "deactivated":
      return tooltips.deactivated;
  }
}

/** Insignia por vigencia contra hoy (CDMX), con tooltip accesible por teclado. */
export function AssignmentDisplayStatusBadge({
  assignment,
  status,
}: {
  assignment: Pick<TemplateAssignment, "isActive" | "effectiveFrom" | "effectiveTo">;
  /** Ya calculado por quien ordena la tabla; si falta, se calcula con hoy. */
  status?: AssignmentDisplayStatus;
}) {
  const displayStatus = status ?? getAssignmentDisplayStatus(assignment);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-flex cursor-help rounded-md"
            data-testid="assignment-display-status-trigger"
          >
            <AssignmentDisplayStatusBadgeBase status={displayStatus} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {assignmentStatusTooltip(displayStatus, assignment)}
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
