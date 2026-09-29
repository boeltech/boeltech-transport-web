import { TripStatus } from "@features/trips/domain";

import { costsCopy } from "../copy/tripDetail/costsCopy";

export type CostsStatusBannerKind =
  | "pending"
  | "postCloseOpen"
  | "postCloseClosed"
  | "inProgress"
  | "marginCritical";

export type CostsStatusBannerCopy = {
  kind: CostsStatusBannerKind;
  title: string;
  body: string;
};

/**
 * Texto del banner del tab Costos (prioridad D5).
 * Operator usa copy de escala; admin/manager/accountant conservan el actual.
 */
export function pickCostsStatusBannerCopy(input: {
  isOperator: boolean;
  pendingExpenseCount: number;
  canApproveExpenses: boolean;
  expenseWindowOpen: boolean;
  expenseWindowClosed: boolean;
  tripStatus: string;
  manageHint: boolean;
  marginCritical: boolean;
}): CostsStatusBannerCopy | null {
  const {
    isOperator,
    pendingExpenseCount,
    canApproveExpenses,
    expenseWindowOpen,
    expenseWindowClosed,
    tripStatus,
    manageHint,
    marginCritical,
  } = input;

  if (pendingExpenseCount > 0) {
    return {
      kind: "pending",
      title: costsCopy.alert.pendingApprovalTitle,
      body: canApproveExpenses
        ? costsCopy.alert.pendingApprovalBodyCanApprove
        : isOperator
          ? costsCopy.alert.pendingApprovalBodyOperator
          : costsCopy.alert.pendingApprovalBody,
    };
  }

  if (expenseWindowOpen) {
    return {
      kind: "postCloseOpen",
      title: costsCopy.alert.postCloseWindowTitle,
      body: isOperator
        ? costsCopy.hint.postCloseWindowOperator
        : costsCopy.hint.postCloseWindow,
    };
  }

  if (expenseWindowClosed) {
    return {
      kind: "postCloseClosed",
      title: costsCopy.alert.postCloseWindowClosedTitle,
      body: isOperator
        ? costsCopy.hint.postCloseWindowClosedOperator
        : costsCopy.hint.postCloseWindowClosed,
    };
  }

  if (tripStatus === TripStatus.IN_PROGRESS && manageHint) {
    return {
      kind: "inProgress",
      title: costsCopy.alert.inProgressTitle,
      body: isOperator
        ? costsCopy.hint.inProgressOperator
        : costsCopy.hint.inProgress,
    };
  }

  if (marginCritical) {
    return {
      kind: "marginCritical",
      title: costsCopy.alert.marginCriticalTitle,
      body: isOperator
        ? costsCopy.alert.marginCriticalBodyOperator
        : costsCopy.alert.marginCriticalBody,
    };
  }

  return null;
}
