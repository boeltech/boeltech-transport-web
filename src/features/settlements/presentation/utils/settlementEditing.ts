import { approvalGuardsFor, getApprovalGuardCode, type ApprovalGuards } from "@features/approvals";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverSettlement } from "../../domain/entities";
import type { SettlementStatus } from "../../domain/enums";
import {
  calculatedBaseFromStored,
  computeSettlementTotals,
  deriveManualItemIsDeduction,
  isManualSettlementItem,
  isManualSettlementItemType,
  normalizeManualItems,
  roundCents,
  type ManualSettlementItemInput,
} from "../../domain/settlementTotals";
import type { UpdateSettlementPayload } from "../../infrastructure/settlementsApi";
import { settlementsCopy } from "../copy/settlementsCopy";
import type {
  CustomSettlementItemFormValues,
  SettlementCorrectionFormValues,
} from "../validation/settlementSchemas";

const flowCopy = settlementsCopy.settlementFlow;

/** D21: estados con «Corregir» (con `settlements.update`). */
const CORRECTABLE_STATUSES: ReadonlyArray<SettlementStatus> = [
  "draft",
  "pending_approval",
  "approved",
];
/** D22.6: corregir partidas en estos estados reinicia o anula la autorización. */
const AUTHORIZATION_AT_RISK: ReadonlyArray<SettlementStatus> = ["pending_approval", "approved"];
/** D28: solo autorizada o pagada lleva firmas. */
const SIGNABLE_RECEIPT_STATUSES: ReadonlyArray<SettlementStatus> = ["approved", "disbursed"];

/** Cambió en el servidor: no se reintenta, se recarga (handoff F6 §6). */
const STALE_CODES = new Set(["SETTLEMENT_NOT_MUTABLE", "APPROVAL_MATERIAL_EDIT_LOCKED"]);

export function isSettlementStaleError(error: unknown): boolean {
  if (getApprovalGuardCode(error)) return true;
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && STALE_CODES.has(code);
}

export function isSettlementRevisionChangedError(error: unknown): boolean {
  return getApprovalGuardCode(error) === "APPROVAL_REVISION_CHANGED";
}

export function isSettlementCorrectable(status: SettlementStatus): boolean {
  return CORRECTABLE_STATUSES.includes(status);
}

export function isSettlementReturned(
  settlement: Pick<DriverSettlement, "status" | "approval">,
): boolean {
  return settlement.status === "draft" && settlement.approval?.flowStatus === "returned";
}

export function isReceiptSignable(status: SettlementStatus): boolean {
  return SIGNABLE_RECEIPT_STATUSES.includes(status);
}

/** Guardas ADR-0099; `undefined` si el registro no trae bloque (API previo). */
export function settlementGuards(settlement: DriverSettlement): ApprovalGuards | undefined {
  const guards = approvalGuardsFor(settlement);
  return Object.keys(guards).length > 0 ? guards : undefined;
}

/** E10: anticipos editables solo en borrador y si no se reservaron o descontaron al crear. */
export function canEditSettlementAdvances(settlement: DriverSettlement): boolean {
  return (
    settlement.status === "draft" &&
    !settlement.advancesReserved &&
    !settlement.advancesDeductedAtCreate
  );
}

export function manualItemsFromSettlement(
  settlement: DriverSettlement,
): CustomSettlementItemFormValues[] {
  return (settlement.items ?? []).flatMap((item) => {
    if (!isManualSettlementItem(item) || !isManualSettlementItemType(item.itemType)) return [];
    return [
      {
        itemType: item.itemType,
        description: item.description,
        amount: item.amount,
        ...(item.itemType === "adjustment" ? { isDeduction: item.isDeduction } : {}),
        tripId: item.tripId ?? null,
      },
    ];
  });
}

export function appliedAdvancesFromSettlement(
  settlement: DriverSettlement,
): { advanceId: string; amountToDeduct: number }[] {
  return (settlement.items ?? []).flatMap((item) =>
    item.itemType === "advance_deduction" && item.advanceId
      ? [{ advanceId: item.advanceId, amountToDeduct: item.amount }]
      : [],
  );
}

/** Viajes de esta liquidación (el selector de partidas no ofrece otros). */
export function settlementTripOptions(
  settlement: DriverSettlement,
): { tripId: string; tripCode: string }[] {
  const seen = new Map<string, string>();
  for (const item of settlement.items ?? []) {
    if (item.tripId && !seen.has(item.tripId)) {
      seen.set(item.tripId, item.tripCode ?? item.tripId.slice(0, 8));
    }
  }
  return Array.from(seen, ([tripId, tripCode]) => ({ tripId, tripCode }));
}

function finiteAmount(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

/** Filas del editor (aún sin validar) → partidas para los totales en vivo. */
export function liveManualItems(
  rows: ReadonlyArray<Partial<CustomSettlementItemFormValues>>,
): ManualSettlementItemInput[] {
  return rows.flatMap((row) =>
    row.itemType
      ? [
          {
            itemType: row.itemType,
            description: row.description ?? "",
            amount: finiteAmount(row.amount),
            isDeduction: row.isDeduction,
            tripId: row.tripId ?? null,
          },
        ]
      : [],
  );
}

export interface SettlementTotalsView {
  perceptions: number;
  deductions: number;
  net: number;
}

export interface CorrectionTotals {
  before: SettlementTotalsView;
  after: SettlementTotalsView;
}

/** D22.5 / D23: totales antes (lo guardado) y después (réplica de `settlementTotals`). */
export function computeCorrectionTotals(
  settlement: DriverSettlement,
  values: {
    customItems: ReadonlyArray<Partial<CustomSettlementItemFormValues>>;
    advancesToApply?: ReadonlyArray<{ amountToDeduct?: unknown }>;
  },
  options: { advancesEditable: boolean },
): CorrectionTotals {
  const base = calculatedBaseFromStored(settlement);
  const advancesDeducted = options.advancesEditable
    ? roundCents(
        (values.advancesToApply ?? []).reduce(
          (sum, advance) => sum + finiteAmount(advance.amountToDeduct),
          0,
        ),
      )
    : base.advancesDeducted;
  const totals = computeSettlementTotals(
    { ...base, advancesDeducted },
    normalizeManualItems(liveManualItems(values.customItems)),
  );
  return {
    before: {
      perceptions: settlement.grossAmount,
      deductions: roundCents(settlement.totalAdvancesDeducted + settlement.totalOtherDeductions),
      net: settlement.netAmount,
    },
    after: {
      perceptions: totals.grossAmount,
      deductions: roundCents(totals.totalAdvancesDeducted + totals.totalOtherDeductions),
      net: totals.netAmount,
    },
  };
}

export function formatSignedManualAmount(item: ManualSettlementItemInput): string {
  const amount = formatMxCurrency(item.amount);
  return deriveManualItemIsDeduction(item)
    ? flowCopy.manualItems.signSubtracts(amount)
    : flowCopy.manualItems.signAdds(amount);
}

function manualItemLabel(item: ManualSettlementItemInput): string {
  const type = flowCopy.manualItems.types[item.itemType];
  const description = item.description.trim();
  return `${type}${description ? ` · ${description}` : ""}: ${formatSignedManualAmount(item)}`;
}

function manualItemSignature(item: ManualSettlementItemInput): string {
  return JSON.stringify([
    item.itemType,
    item.description.trim(),
    roundCents(item.amount),
    deriveManualItemIsDeduction(item),
    item.tripId ?? null,
  ]);
}

function normalizeNotes(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function sameAdvances(
  a: ReadonlyArray<{ advanceId: string; amountToDeduct: number }>,
  b: ReadonlyArray<{ advanceId: string; amountToDeduct: number }>,
): boolean {
  const key = (list: ReadonlyArray<{ advanceId: string; amountToDeduct: number }>) =>
    list
      .map((advance) => `${advance.advanceId}:${roundCents(advance.amountToDeduct)}`)
      .sort()
      .join("|");
  return key(a) === key(b);
}

export interface SettlementCorrectionDiff {
  /** «Nueva: Penalización · Faltante: −$300.00 al pago». */
  lines: string[];
  /** Cambian partidas o anticipos (pide «¿Guardar y volver a autorización?» fuera de borrador). */
  material: boolean;
  requiresConfirmation: boolean;
  /** `null` si no cambió nada. */
  payload: UpdateSettlementPayload | null;
}

/** Diff del Sheet contra lo guardado: arma el PATCH solo con lo que cambió. */
export function diffSettlementCorrection(
  settlement: DriverSettlement,
  values: SettlementCorrectionFormValues,
  options: { advancesEditable: boolean },
): SettlementCorrectionDiff {
  const payload: UpdateSettlementPayload = { expectedStatus: settlement.status };
  const lines: string[] = [];

  const before = manualItemsFromSettlement(settlement) as ManualSettlementItemInput[];
  const after: ManualSettlementItemInput[] = values.customItems.map((item) => ({
    itemType: item.itemType,
    description: item.description.trim(),
    amount: item.amount,
    isDeduction: item.isDeduction,
    tripId: item.tripId ?? null,
  }));
  const beforeKeys = before.map(manualItemSignature);
  const afterKeys = after.map(manualItemSignature);
  const itemsChanged =
    beforeKeys.length !== afterKeys.length ||
    beforeKeys.some((key, index) => key !== afterKeys[index]);
  if (itemsChanged) {
    payload.customItems = after;
    const remaining = [...afterKeys];
    before.forEach((item, index) => {
      const at = remaining.indexOf(beforeKeys[index]);
      if (at >= 0) remaining.splice(at, 1);
      else lines.push(flowCopy.confirm.removed(manualItemLabel(item)));
    });
    const original = [...beforeKeys];
    after.forEach((item, index) => {
      const at = original.indexOf(afterKeys[index]);
      if (at >= 0) original.splice(at, 1);
      else lines.push(flowCopy.confirm.added(manualItemLabel(item)));
    });
  }

  let advancesChanged = false;
  if (options.advancesEditable) {
    const nextAdvances = values.advancesToApply.map((advance) => ({
      advanceId: advance.advanceId,
      amountToDeduct: advance.amountToDeduct,
    }));
    advancesChanged = !sameAdvances(appliedAdvancesFromSettlement(settlement), nextAdvances);
    if (advancesChanged) payload.advancesToApply = nextAdvances;
  }

  const nextNotes = normalizeNotes(values.notes);
  if (nextNotes !== normalizeNotes(settlement.notes)) {
    payload.notes = nextNotes;
    lines.push(flowCopy.confirm.notesChanged);
  }

  const material = itemsChanged || advancesChanged;
  const hasAnyChange = Object.keys(payload).length > 1;
  return {
    lines,
    material,
    requiresConfirmation: material && AUTHORIZATION_AT_RISK.includes(settlement.status),
    payload: hasAnyChange ? payload : null,
  };
}
