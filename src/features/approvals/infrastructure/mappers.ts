import { deepToCamel } from "@shared/api";
import type { MappedPaginatedResult, MappedSingleResult } from "@shared/api";
import type { ApiSingleResponse } from "@shared/api";
import type {
  ApprovableContext,
  ApprovableItem,
  ApprovalBlock,
  ApprovalCannotActReason,
  ApprovalDecisionOutcome,
  ApprovalDecisionResult,
  ApprovalFieldChange,
  ApprovalFlowStatus,
  ApprovalHistoryEntry,
  ApprovalReapprovalPreviousStatus,
  BulkResult,
  PaginatedApprovals,
  SelfApprovalCapability,
  SelfApprovalPolicy,
} from "../domain";

export interface ApiApprovalBlockRaw {
  flow_status: string;
  step_current: number | null;
  steps_total: number;
  pending_for?: {
    roles?: string[] | null;
    users?: Array<{ user_id: string; full_name: string | null }> | null;
  } | null;
  next_step?: {
    step_no: number;
    roles?: string[] | null;
    users?: Array<{ user_id: string; full_name: string | null }> | null;
  } | null;
  signed_steps?: Array<{
    step_no: number;
    user_id: string | null;
    full_name: string | null;
    role: string | null;
    decided_at: string | null;
  }> | null;
  routed_by?: {
    tier_index: number | null;
    min_amount: number | null;
    matched_conditions?: unknown;
    policy_version: number | null;
    lazy?: boolean | null;
  } | null;
  can_act: boolean;
  cannot_act_reason: string | null;
  escalated?: boolean | null;
  reapproval?: {
    invalidated_at: string | null;
    previous_instance_id: string | null;
    previous_status?: string | null;
    diff?: unknown;
  } | null;
  returned?: {
    reason: string | null;
    reason_code: string | null;
    returned_by: string | null;
    returned_by_name: string | null;
    returned_at: string | null;
  } | null;
}

export interface ApiApprovableItemRaw {
  approvable_type: string;
  id: string;
  amount: number;
  currency: string;
  category: string;
  status: string;
  submitted_at: string;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  self_approved?: boolean | null;
  context: Record<string, unknown>;
  approval_revision?: string | null;
  approval?: ApiApprovalBlockRaw | null;
}

export interface ApiApprovalDecisionRaw extends ApiApprovableItemRaw {
  outcome?: string | null;
}

export interface ApiBulkResultRaw {
  successes: Array<{
    type: string;
    id: string;
    item: ApiApprovableItemRaw;
    outcome?: string | null;
  }>;
  failures: Array<{
    type: string;
    id: string;
    error: { code: string; message: string; details?: unknown };
  }>;
}

export interface ApiApprovalHistoryEntryRaw {
  id: string;
  instance_id: string | null;
  step_no: number | null;
  event_type: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  reason: string | null;
  reason_code: string | null;
  diff?: unknown;
  policy_version_id: string | null;
  policy_version: number | null;
  created_at: string;
}

export interface ApiListApprovalsPaginationRaw {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface ApiSelfApprovalCapabilityRaw {
  allowed?: boolean | null;
  active_counterpart_count?: number | null;
}

export interface ApiSelfApprovalPolicyRaw {
  advance_approve?: ApiSelfApprovalCapabilityRaw | null;
  advance_disburse?: ApiSelfApprovalCapabilityRaw | null;
  settlement_approve?: ApiSelfApprovalCapabilityRaw | null;
  settlement_disburse?: ApiSelfApprovalCapabilityRaw | null;
  trip_expense_approve?: ApiSelfApprovalCapabilityRaw | null;
}

const FLOW_STATUSES: readonly ApprovalFlowStatus[] = [
  "not_started",
  "in_progress",
  "approved",
  "rejected",
  "returned",
  "superseded",
  "cancelled",
];

const CANNOT_ACT_REASONS: readonly ApprovalCannotActReason[] = [
  "no_permission",
  "not_eligible",
  "already_signed",
  "self_action",
  "no_active_eligible",
  "returned",
  "closed",
];

const REAPPROVAL_PREVIOUS_STATUSES: readonly ApprovalReapprovalPreviousStatus[] = [
  "approved",
  "in_progress",
];

function mapReapprovalPreviousStatus(raw: unknown): ApprovalReapprovalPreviousStatus | null {
  return typeof raw === "string" &&
    (REAPPROVAL_PREVIOUS_STATUSES as readonly string[]).includes(raw)
    ? (raw as ApprovalReapprovalPreviousStatus)
    : null;
}

const DECISION_OUTCOMES: readonly ApprovalDecisionOutcome[] = [
  "approved",
  "rejected",
  "step_signed",
  "returned",
];

function mapContext(raw: Record<string, unknown>): ApprovableContext {
  const camel = deepToCamel(raw) as unknown as ApprovableContext;
  return camel;
}

function mapOutcome(raw: unknown): ApprovalDecisionOutcome | null {
  return typeof raw === "string" &&
    (DECISION_OUTCOMES as readonly string[]).includes(raw)
    ? (raw as ApprovalDecisionOutcome)
    : null;
}

/** Diff de campos materiales (`[{ field, from, to }]`); lo demás se descarta. */
export function mapApprovalFieldChanges(raw: unknown): ApprovalFieldChange[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.field !== "string" || record.field === "") return [];
    return [{ field: record.field, from: record.from ?? null, to: record.to ?? null }];
  });
}

export function mapApprovalBlock(raw: ApiApprovalBlockRaw): ApprovalBlock {
  const flowStatus = (FLOW_STATUSES as readonly string[]).includes(raw.flow_status)
    ? (raw.flow_status as ApprovalFlowStatus)
    : "in_progress";
  const reason =
    raw.cannot_act_reason &&
    (CANNOT_ACT_REASONS as readonly string[]).includes(raw.cannot_act_reason)
      ? (raw.cannot_act_reason as ApprovalCannotActReason)
      : raw.can_act
        ? null
        : "closed";
  const matched = raw.routed_by?.matched_conditions;

  return {
    flowStatus,
    stepCurrent: raw.step_current ?? null,
    stepsTotal: Number.isFinite(raw.steps_total) && raw.steps_total > 0 ? raw.steps_total : 1,
    pendingFor: {
      roles: raw.pending_for?.roles ?? [],
      users: (raw.pending_for?.users ?? []).map((user) => ({
        userId: user.user_id,
        fullName: user.full_name,
      })),
    },
    ...(raw.next_step === undefined
      ? {}
      : {
          nextStep: raw.next_step
            ? {
                stepNo: raw.next_step.step_no,
                roles: raw.next_step.roles ?? [],
                users: (raw.next_step.users ?? []).map((user) => ({
                  userId: user.user_id,
                  fullName: user.full_name,
                })),
              }
            : null,
        }),
    signedSteps: (raw.signed_steps ?? []).map((step) => ({
      stepNo: step.step_no,
      userId: step.user_id,
      fullName: step.full_name,
      role: step.role,
      decidedAt: step.decided_at,
    })),
    routedBy: {
      tierIndex: raw.routed_by?.tier_index ?? null,
      minAmount: raw.routed_by?.min_amount ?? null,
      matchedConditions: Array.isArray(matched) ? matched.map(String) : [],
      policyVersion: raw.routed_by?.policy_version ?? null,
      lazy: raw.routed_by?.lazy === true,
    },
    canAct: raw.can_act === true,
    cannotActReason: reason,
    escalated: raw.escalated === true,
    reapproval: raw.reapproval
      ? {
          invalidatedAt: raw.reapproval.invalidated_at,
          previousInstanceId: raw.reapproval.previous_instance_id,
          previousStatus: mapReapprovalPreviousStatus(raw.reapproval.previous_status),
          changes: mapApprovalFieldChanges(raw.reapproval.diff),
        }
      : null,
    returned: raw.returned
      ? {
          reason: raw.returned.reason,
          reasonCode: raw.returned.reason_code,
          returnedBy: raw.returned.returned_by,
          returnedByName: raw.returned.returned_by_name,
          returnedAt: raw.returned.returned_at,
        }
      : null,
  };
}

export function mapApprovableItem(raw: ApiApprovableItemRaw): ApprovableItem {
  const base = deepToCamel({
    approvable_type: raw.approvable_type,
    id: raw.id,
    amount: raw.amount,
    currency: raw.currency,
    category: raw.category,
    status: raw.status,
    submitted_at: raw.submitted_at,
    submitted_by: raw.submitted_by,
    approved_at: raw.approved_at,
    approved_by: raw.approved_by,
    rejected_at: raw.rejected_at,
    rejection_reason: raw.rejection_reason,
  }) as Omit<ApprovableItem, "context">;

  return {
    ...base,
    currency: base.currency as ApprovableItem["currency"],
    status: base.status as ApprovableItem["status"],
    approvableType: base.approvableType as ApprovableItem["approvableType"],
    selfApproved: raw.self_approved === true,
    context: mapContext(raw.context),
    approvalRevision: raw.approval_revision ?? null,
    ...(raw.approval !== undefined
      ? { approval: raw.approval ? mapApprovalBlock(raw.approval) : null }
      : {}),
  };
}

function mapSelfApprovalCapability(
  raw: ApiSelfApprovalCapabilityRaw | null | undefined,
): SelfApprovalCapability {
  const count = Number(raw?.active_counterpart_count);
  return {
    allowed: raw?.allowed === true,
    activeCounterpartCount: Number.isFinite(count) ? count : 0,
  };
}

export function mapSelfApprovalPolicy(
  raw: ApiSelfApprovalPolicyRaw | null | undefined,
): SelfApprovalPolicy {
  return {
    advanceApprove: mapSelfApprovalCapability(raw?.advance_approve),
    advanceDisburse: mapSelfApprovalCapability(raw?.advance_disburse),
    settlementApprove: mapSelfApprovalCapability(raw?.settlement_approve),
    settlementDisburse: mapSelfApprovalCapability(raw?.settlement_disburse),
    tripExpenseApprove: mapSelfApprovalCapability(raw?.trip_expense_approve),
  };
}

export function mapListApprovalsResponse(response: {
  data: ApiApprovableItemRaw[];
  pagination: ApiListApprovalsPaginationRaw;
}): MappedPaginatedResult<ApprovableItem> {
  return {
    data: response.data.map(mapApprovableItem),
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.page_size,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    },
  };
}

export function mapSingleApprovableResponse(
  response: ApiSingleResponse<ApiApprovableItemRaw>,
): MappedSingleResult<ApprovableItem> {
  return {
    data: mapApprovableItem(response.data),
    ...(response.message ? { message: response.message } : {}),
  };
}

export function mapApprovalDecisionResponse(
  response: ApiSingleResponse<ApiApprovalDecisionRaw>,
): ApprovalDecisionResult {
  return {
    data: mapApprovableItem(response.data),
    outcome: mapOutcome(response.data.outcome),
    ...(response.message ? { message: response.message } : {}),
  };
}

export function mapBulkResultResponse(raw: ApiBulkResultRaw): BulkResult {
  return {
    successes: raw.successes.map((success) => {
      const outcome = mapOutcome(success.outcome);
      return {
        type: success.type as BulkResult["successes"][number]["type"],
        id: success.id,
        item: mapApprovableItem(success.item),
        ...(outcome ? { outcome } : {}),
      };
    }),
    failures: raw.failures.map((failure) => ({
      type: failure.type as BulkResult["failures"][number]["type"],
      id: failure.id,
      error: failure.error,
    })),
  };
}

export function mapApprovalHistory(
  raw: ApiApprovalHistoryEntryRaw[],
): ApprovalHistoryEntry[] {
  return raw.map((entry) => ({
    id: entry.id,
    instanceId: entry.instance_id,
    stepNo: entry.step_no,
    eventType: entry.event_type,
    actorId: entry.actor_id,
    actorName: entry.actor_name,
    actorRole: entry.actor_role,
    reason: entry.reason,
    reasonCode: entry.reason_code,
    changes: mapApprovalFieldChanges(entry.diff),
    policyVersionId: entry.policy_version_id,
    policyVersion: entry.policy_version,
    createdAt: entry.created_at,
  }));
}

export type { PaginatedApprovals };
