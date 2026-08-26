import {
  CheckCircle2,
  Clock,
  FileEdit,
  Loader2,
  Mail,
  Send,
  XCircle,
} from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import type { DispatchRunStatus } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

export const DISPATCH_RUN_STATUS_CONFIG: Record<
  DispatchRunStatus,
  StatusConfig
> = {
  draft: createStatusConfig("neutral", {
    label: dispatchRunsCopy.status.draft,
    description: "Envío en borrador, aún no preparado",
    icon: FileEdit,
  }),
  previewed: createStatusConfig("info", {
    label: dispatchRunsCopy.status.previewed,
    description: "Lista de facturas preparada para revisar",
    icon: Mail,
  }),
  send_confirmed: createStatusConfig("warning", {
    label: dispatchRunsCopy.status.send_confirmed,
    description: "Envío confirmado y en proceso",
    icon: Send,
  }),
  sending: createStatusConfig("info", {
    label: dispatchRunsCopy.status.sending,
    description: "Correos en curso de envío",
    icon: Loader2,
  }),
  completed: createStatusConfig("success", {
    label: dispatchRunsCopy.status.completed,
    description: "Envío finalizado correctamente",
    icon: CheckCircle2,
  }),
  failed: createStatusConfig("destructive", {
    label: dispatchRunsCopy.status.failed,
    description: "El envío terminó con errores",
    icon: XCircle,
  }),
  cancelled: createStatusConfig("neutral", {
    label: dispatchRunsCopy.status.cancelled,
    description: "Envío cancelado",
    icon: Clock,
  }),
};

export const DispatchRunStatusBadge = createStatusBadgeComponent(
  DISPATCH_RUN_STATUS_CONFIG,
);

export function getDispatchRunStatusLabel(status: string): string {
  return (
    dispatchRunsCopy.status[status as DispatchRunStatus] ?? status
  );
}
