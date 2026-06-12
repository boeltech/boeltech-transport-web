import { AlertCircle, CheckCircle2, Clock, Minus } from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import type { RepStatus } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail.repStatus;

export const REP_STATUS_CONFIG: Record<RepStatus, StatusConfig> = {
  not_required: createStatusConfig("neutral", {
    label: copy.notRequired,
    icon: Minus,
    description: copy.notRequired,
  }),
  pending: createStatusConfig("warning", {
    label: copy.pending,
    icon: Clock,
    description: copy.pendingHint,
  }),
  stamped: createStatusConfig("success", {
    label: copy.stamped,
    icon: CheckCircle2,
    description: copy.stamped,
  }),
  failed: createStatusConfig("destructive", {
    label: copy.failed,
    icon: AlertCircle,
    description: copy.failedHint,
  }),
};

export const RepStatusBadge = createStatusBadgeComponent(REP_STATUS_CONFIG);

export function getRepStatusConfig(status: RepStatus): StatusConfig {
  return REP_STATUS_CONFIG[status];
}
