import {
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_LIST_PATH,
  settlementsPendingApprovalPath,
} from "@features/settlements/application/settlementsRoutes";
import type { ApprovableType } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";

export type ApprovalInboxRelatedConfig = {
  label: string;
  href: string;
  description: string;
};

const relatedCopy = approvalsCopy.inbox.related;

/** relatedConfig del workbench no embebido según filtro `type` activo (Ola 3 D1). */
export function resolveApprovalInboxRelatedConfig(
  approvalType: ApprovableType,
): ApprovalInboxRelatedConfig {
  switch (approvalType) {
    case "driver_advance_request":
      return {
        label: relatedCopy.advances.label,
        href: SETTLEMENTS_ADVANCES_PATH,
        description: relatedCopy.advances.description,
      };
    case "internal_staff_compensation":
      return {
        label: relatedCopy.pendingApproval.label,
        href: settlementsPendingApprovalPath(),
        description: relatedCopy.pendingApproval.description,
      };
    default:
      return {
        label: relatedCopy.operatorPayments.label,
        href: SETTLEMENTS_LIST_PATH,
        description: relatedCopy.operatorPayments.description,
      };
  }
}
