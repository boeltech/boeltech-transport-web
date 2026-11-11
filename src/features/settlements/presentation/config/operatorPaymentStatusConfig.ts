import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  Layers,
  Link2Off,
  PauseCircle,
} from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import {
  OPERATOR_PAYMENT_STATUS_LABELS,
  type OperatorPaymentReadinessStatus,
} from "../../domain/enums";

export const OPERATOR_PAYMENT_STATUS_CONFIG: Record<
  OperatorPaymentReadinessStatus,
  StatusConfig
> = {
  ready: createStatusConfig("success", {
    label: OPERATOR_PAYMENT_STATUS_LABELS.ready,
    icon: CheckCircle2,
    description: "Tarifa, sueldo y cuenta listos para entrar a un corte",
  }),
  no_template: createStatusConfig("destructive", {
    label: OPERATOR_PAYMENT_STATUS_LABELS.no_template,
    icon: Ban,
    description: "Sin tarifa asignada; no entra a ningún corte",
  }),
  template_not_payable: createStatusConfig("warning", {
    label: OPERATOR_PAYMENT_STATUS_LABELS.template_not_payable,
    icon: PauseCircle,
    description: "Tiene tarifa asignada, pero no es pagable (borrador o inactiva)",
  }),
  template_scheduled: createStatusConfig("warning", {
    label: OPERATOR_PAYMENT_STATUS_LABELS.template_scheduled,
    icon: CalendarClock,
    description: "La tarifa pagable aún no entra en vigencia",
  }),
  dual_template: createStatusConfig("warning", {
    label: OPERATOR_PAYMENT_STATUS_LABELS.dual_template,
    icon: Layers,
    description: "Hay más de una tarifa pagable vigente",
  }),
  no_clabe: createStatusConfig("warning", {
    label: OPERATOR_PAYMENT_STATUS_LABELS.no_clabe,
    icon: Link2Off,
    description: "Falta CLABE en la ficha del empleado",
  }),
  version_superseded: createStatusConfig("warning", {
    label: OPERATOR_PAYMENT_STATUS_LABELS.version_superseded,
    icon: AlertTriangle,
    description: "La versión de tarifa asignada ya fue reemplazada",
  }),
};

export const OperatorPaymentStatusBadge = createStatusBadgeComponent(
  OPERATOR_PAYMENT_STATUS_CONFIG,
);
