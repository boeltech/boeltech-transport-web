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
    icon: FileEdit,
  }),
  previewed: createStatusConfig("info", {
    label: dispatchRunsCopy.status.previewed,
    icon: Mail,
  }),
  send_confirmed: createStatusConfig("warning", {
    label: dispatchRunsCopy.status.send_confirmed,
    icon: Send,
  }),
  sending: createStatusConfig("info", {
    label: dispatchRunsCopy.status.sending,
    icon: Loader2,
  }),
  completed: createStatusConfig("success", {
    label: dispatchRunsCopy.status.completed,
    icon: CheckCircle2,
  }),
  failed: createStatusConfig("destructive", {
    label: dispatchRunsCopy.status.failed,
    icon: XCircle,
  }),
  cancelled: createStatusConfig("neutral", {
    label: dispatchRunsCopy.status.cancelled,
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
