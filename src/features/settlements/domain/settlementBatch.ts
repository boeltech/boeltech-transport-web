/**
 * F7 — autorizar / rechazar / registrar en lote.
 * Códigos de omitido alineados a API `settlementBatch.ts` (R6).
 */

export type SettlementBatchReasonCode =
  | "self_actor"
  | "wrong_status"
  | "not_found"
  | "concurrency"
  | "no_permission"
  | "batch_row_failed"
  | "batch_too_many"
  | string;

export interface SettlementBatchProcessedRow {
  readonly settlementId: string;
  readonly settlementNumber: string;
  readonly status: string;
  readonly netAmount: number;
  readonly approvalOutcome?: "approved" | "step_signed" | "rejected" | null;
  readonly disbursementMethod?: string | null;
}

export interface SettlementBatchOmittedRow {
  readonly settlementId: string;
  readonly reasonCode: SettlementBatchReasonCode;
  readonly reason: string;
  readonly httpStatus: number;
}

export interface SettlementBatchActionResult {
  readonly processed: readonly SettlementBatchProcessedRow[];
  readonly omitted: readonly SettlementBatchOmittedRow[];
  readonly message?: string;
}

export interface BatchApproveSettlementsPayload {
  readonly settlementIds: readonly string[];
  readonly expectedStep?: number;
  readonly expectedRevision?: string;
}

export interface BatchRejectSettlementsPayload {
  readonly settlementIds: readonly string[];
  readonly reason: string;
  readonly expectedStep?: number;
  readonly expectedRevision?: string;
}

export interface BatchDisburseSettlementsPayload {
  readonly settlementIds: readonly string[];
  readonly disbursementReference: string;
  readonly disbursedAt: string;
  readonly notes?: string | null;
  /** Omitir para que el API derive SPEI/cash por hasClabe (HB-T5). */
  readonly disbursementMethod?: "bank_transfer" | "check" | "cash" | "electronic_wallet";
  /** F8 — oculto en UI; si se envía, el API lo ignora hasta Banamex. */
  readonly generateDispersionFile?: boolean;
  readonly expectedRevisions: Readonly<Record<string, string>>;
}

/** Omitido local (R6) antes de llamar al API — misma forma estable para banner/toast. */
export interface SettlementBatchLocalOmit {
  readonly settlementId: string;
  readonly settlementNumber: string;
  readonly employeeFullName: string;
  readonly reasonCode: SettlementBatchReasonCode;
  readonly reason: string;
}
