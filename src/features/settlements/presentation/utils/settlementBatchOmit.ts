/**
 * F7 R5/R6 — filtrado local de lote antes de abrir Sheet / llamar API.
 * Los omitidos no bloquean el resto; se muestran con motivo.
 */

import type { SelfApprovalPolicy } from "@features/approvals/domain";
import type { DriverSettlement } from "../../domain/entities";
import type { SettlementBatchLocalOmit } from "../../domain/settlementBatch";
import {
  canApproveSettlement,
  canDisburse,
  resolveSettlementApproveUi,
  resolveSettlementDisburseUi,
} from "./settlementCta";

export type SettlementBatchActionKind = "approve" | "reject" | "disburse";

export interface SettlementBatchPartition {
  readonly eligible: readonly DriverSettlement[];
  readonly omitted: readonly SettlementBatchLocalOmit[];
}

function selfActorReason(kind: SettlementBatchActionKind): string {
  if (kind === "disburse") {
    return "Lo armaste tú: no puedes registrar este pago";
  }
  return "Lo armaste tú: no puedes autorizarlo";
}

function wrongStatusReason(kind: SettlementBatchActionKind): string {
  if (kind === "disburse") {
    return "Este pago aún no está listo para registrar";
  }
  return "Este pago no está en autorización";
}

function missingRevisionReason(): string {
  return "Falta la revisión de autorización; recarga el listado";
}

/**
 * Parte la selección en elegibles vs omitidos (R6).
 * - self_actor: maker-checker UI (`blocked_own`)
 * - wrong_status: estado / permiso no permiten la acción
 * - concurrency (disburse): sin `approvalRevision` no se puede registrar
 */
export function partitionSettlementsForBatch(input: {
  settlements: readonly DriverSettlement[];
  kind: SettlementBatchActionKind;
  userId: string | null | undefined;
  selfApprovalPolicy: SelfApprovalPolicy | null | undefined;
  canUpdate: boolean;
  canExecute: boolean;
}): SettlementBatchPartition {
  const eligible: DriverSettlement[] = [];
  const omitted: SettlementBatchLocalOmit[] = [];

  for (const settlement of input.settlements) {
    if (input.kind === "approve" || input.kind === "reject") {
      const selfActionUi = resolveSettlementApproveUi(
        settlement,
        input.userId,
        input.selfApprovalPolicy,
      );
      if (selfActionUi === "blocked_own") {
        omitted.push({
          settlementId: settlement.id,
          settlementNumber: settlement.settlementNumber,
          employeeFullName: settlement.employeeFullName,
          reasonCode: "self_actor",
          reason: selfActorReason(input.kind),
        });
        continue;
      }
      if (
        !canApproveSettlement({
          settlement,
          canUpdate: input.canUpdate,
          selfActionUi,
        })
      ) {
        omitted.push({
          settlementId: settlement.id,
          settlementNumber: settlement.settlementNumber,
          employeeFullName: settlement.employeeFullName,
          reasonCode: "wrong_status",
          reason: wrongStatusReason(input.kind),
        });
        continue;
      }
      eligible.push(settlement);
      continue;
    }

    // disburse
    const selfActionUi = resolveSettlementDisburseUi(
      settlement,
      input.userId,
      input.selfApprovalPolicy,
    );
    if (selfActionUi === "blocked_own") {
      omitted.push({
        settlementId: settlement.id,
        settlementNumber: settlement.settlementNumber,
        employeeFullName: settlement.employeeFullName,
        reasonCode: "self_actor",
        reason: selfActorReason("disburse"),
      });
      continue;
    }
    if (
      !canDisburse({
        settlement,
        canExecute: input.canExecute,
        selfActionUi,
      })
    ) {
      omitted.push({
        settlementId: settlement.id,
        settlementNumber: settlement.settlementNumber,
        employeeFullName: settlement.employeeFullName,
        reasonCode: "wrong_status",
        reason: wrongStatusReason("disburse"),
      });
      continue;
    }
    if (!settlement.approvalRevision) {
      omitted.push({
        settlementId: settlement.id,
        settlementNumber: settlement.settlementNumber,
        employeeFullName: settlement.employeeFullName,
        reasonCode: "concurrency",
        reason: missingRevisionReason(),
      });
      continue;
    }
    eligible.push(settlement);
  }

  return { eligible, omitted };
}

/** Agrupa motivos de omitidos para toast/banner («n pagos salen del lote: …»). */
export function summarizeBatchOmits(
  omitted: readonly SettlementBatchLocalOmit[],
): string {
  if (omitted.length === 0) return "";
  const byReason = new Map<string, number>();
  for (const row of omitted) {
    byReason.set(row.reason, (byReason.get(row.reason) ?? 0) + 1);
  }
  const parts = [...byReason.entries()].map(([reason, count]) =>
    count === 1 ? reason : `${reason} (${count})`,
  );
  return parts.join("; ");
}

/**
 * SPEI vs efectivo para el Sheet (solo boolean hasClabe — nunca CLABE).
 * Si el mapa no conoce al empleado, asume SPEI (el API sigue siendo SoT).
 */
export function partitionSettlementsByClabe(
  settlements: readonly DriverSettlement[],
  hasClabeByEmployeeId: ReadonlyMap<string, boolean>,
): {
  spei: readonly DriverSettlement[];
  cash: readonly DriverSettlement[];
} {
  const spei: DriverSettlement[] = [];
  const cash: DriverSettlement[] = [];
  for (const s of settlements) {
    const hasClabe = hasClabeByEmployeeId.get(s.employeeId);
    if (hasClabe === false) cash.push(s);
    else spei.push(s);
  }
  return { spei, cash };
}

export function sumNetAmount(settlements: readonly DriverSettlement[]): number {
  return settlements.reduce((sum, s) => sum + s.netAmount, 0);
}
