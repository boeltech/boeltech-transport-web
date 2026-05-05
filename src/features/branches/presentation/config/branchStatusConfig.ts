import { Building2, Ban } from "lucide-react";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import { createStatusConfig, type StatusConfig } from "@shared/config/status/types";
import {
  BRANCH_STATUS_LABELS,
  BranchStatus,
  type BranchStatusType,
} from "../../domain";

export const BRANCH_STATUS_CONFIG: Record<BranchStatusType, StatusConfig> = {
  [BranchStatus.ACTIVE]: createStatusConfig("success", {
    label: BRANCH_STATUS_LABELS[BranchStatus.ACTIVE],
    icon: Building2,
    description: "Sucursal disponible para operación",
  }),
  [BranchStatus.INACTIVE]: createStatusConfig("neutral", {
    label: BRANCH_STATUS_LABELS[BranchStatus.INACTIVE],
    icon: Ban,
    description: "Sucursal inactiva",
  }),
};

export const BranchStatusBadge = createStatusBadgeComponent(BRANCH_STATUS_CONFIG);

export function getBranchStatusLabel(status: BranchStatusType): string {
  return BRANCH_STATUS_CONFIG[status]?.label ?? status;
}
