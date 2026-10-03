import {
  isApprovableActionable,
  resolveApprovableActionUi,
  resolveApprovalActionUi,
  type ApprovableItem,
  type ApprovalActionUi,
  type SelfActionUi,
  type SelfApprovalPolicy,
} from "../../domain";

/** Sin `actionUi` explícito: mismo resolver con la autoacción ya calculada. */
export function deriveApprovalActionUi(
  item: ApprovableItem,
  canUpdate: boolean,
  selfActionUi: SelfActionUi = "normal",
): ApprovalActionUi {
  return resolveApprovalActionUi(item.approval, {
    isOwn: selfActionUi !== "normal",
    selfPolicy: { allowed: selfActionUi === "self_confirm" },
    canDecide: canUpdate,
    isPending: isApprovableActionable(item),
  });
}

/** Solo filas que el usuario puede decidir ahora llevan casilla (handoff F6 D7). */
export function isApprovableSelectable(
  item: ApprovableItem,
  canUpdate: boolean,
  currentUserId: string | null | undefined,
  selfApprovalPolicy: SelfApprovalPolicy | null | undefined,
): boolean {
  return (
    canUpdate &&
    isApprovableActionable(item) &&
    resolveApprovableActionUi(item, currentUserId, selfApprovalPolicy, canUpdate).kind ===
      "act"
  );
}
