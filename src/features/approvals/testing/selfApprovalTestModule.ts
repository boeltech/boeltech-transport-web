/**
 * Piezas reales de autoaprobación (ADR-0098) y del flujo por pasos (ADR-0099)
 * para mocks parciales de `@features/approvals` en tests de otras features.
 * Evita cargar el barrel completo, que arrastra dependencias cruzadas con
 * efectos de red.
 */
export * from "../domain/selfApproval";
export {
  getApprovalGuardCode,
  isIntermediateStep,
  isMultiStepApproval,
  resolveApprovalActionUi,
  returnReasonCodesFor,
  showsApprovalPolicySignals,
} from "../domain/approvalAction";
export {
  approvalsCopy,
  selfApprovalSubjectForType,
} from "../presentation/copy/approvalsCopy";
export { SelfApprovalConfirmDialog } from "../presentation/components/SelfApprovalConfirmDialog";
export {
  OwnRequestChip,
  OwnRequestMenuItem,
  SelfApprovedBadge,
} from "../presentation/components/SelfApprovalIndicators";
export {
  ApprovalActionStateChip,
  ApprovalFlowLines,
  ReturnedChip,
} from "../presentation/components/ApprovalFlowIndicators";
export { ReturnedAlert } from "../presentation/components/ReturnedAlert";
export { DecisionReasonSheet } from "../presentation/components/DecisionReasonSheet";
export { ApprovalHistorySheet } from "../presentation/components/ApprovalHistorySheet";
export {
  approvalActionStateLabel,
  approvalGuardsFor,
  formatApprovalRole,
  formatNextStepLabel,
  formatPendingFor,
  formatReturnedSummary,
  guardErrorMessage,
} from "../presentation/utils/approvalFlowFormat";
export { mapApprovalBlock } from "../infrastructure/mappers";
export {
  invalidateSelfApprovalPolicy,
  useSelfActionForbiddenHandler,
} from "../application/hooks/useSelfApprovalPolicy";
