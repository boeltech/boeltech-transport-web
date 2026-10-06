import {
  ADVANCE_CATEGORY_LABELS,
  DISBURSEMENT_METHOD_LABELS,
  type AdvanceCategory,
  type AdvanceStatus,
  type DisbursementMethod,
} from "../../domain/enums";
import type { DriverAdvance } from "../../domain/entities";
import type { UpdateDriverAdvancePayload } from "../../infrastructure/settlementsApi";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { getApprovalGuardCode } from "@features/approvals/domain";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  ADVANCE_NOTE_MAX_LENGTH,
  type DriverAdvanceEditValues,
} from "../validation/settlementSchemas";

const flowCopy = settlementsCopy.advanceFlow;

/** D17: estados con edición (el resto: solo nota tras entregar, o nada). */
const EDITABLE_STATUSES: ReadonlyArray<AdvanceStatus> = [
  "draft",
  "pending_approval",
  "pending_disbursement",
];
const DISBURSED_STATUSES: ReadonlyArray<AdvanceStatus> = [
  "disbursed",
  "partially_applied",
  "fully_applied",
];
/** D18: un cambio material en estos estados anula o reinicia la autorización. */
const AUTHORIZATION_AT_RISK: ReadonlyArray<AdvanceStatus> = [
  "pending_approval",
  "pending_disbursement",
];

/** El anticipo cambió en el servidor: no se reintenta, se recarga (handoff F6 §6). */
const STALE_CODES = new Set(["ADVANCE_NOT_MUTABLE", "APPROVAL_MATERIAL_EDIT_LOCKED"]);

export function isAdvanceStaleError(error: unknown): boolean {
  if (getApprovalGuardCode(error)) return true;
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && STALE_CODES.has(code);
}

export function isAdvanceEditable(status: AdvanceStatus): boolean {
  return EDITABLE_STATUSES.includes(status);
}

export function isAdvanceDisbursed(status: AdvanceStatus): boolean {
  return DISBURSED_STATUSES.includes(status);
}

export function isAdvanceReturned(advance: Pick<DriverAdvance, "status" | "approval">): boolean {
  return advance.status === "draft" && advance.approval?.flowStatus === "returned";
}

export interface AdvanceEditChange {
  field: keyof DriverAdvanceEditValues;
  label: string;
  from: string;
  to: string;
}

export interface AdvanceEditDiff {
  changes: AdvanceEditChange[];
  /** Hay cambio en operador, monto, categoría, método o viaje. */
  material: boolean;
  /** Pedirá «¿Guardar y volver a autorización?» antes del PATCH. */
  requiresConfirmation: boolean;
  /** `null` si no cambió nada. */
  payload: UpdateDriverAdvancePayload | null;
}

function normalizeText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function normalizeTripId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "" || trimmed === "__none__") return null;
  return trimmed;
}

function categoryLabel(value: string): string {
  return ADVANCE_CATEGORY_LABELS[value as AdvanceCategory] ?? value;
}

function methodLabel(value: string): string {
  return DISBURSEMENT_METHOD_LABELS[value as DisbursementMethod] ?? value;
}

/**
 * Diff del Sheet contra el anticipo vigente: arma el PATCH solo con lo que
 * cambió y las líneas «Monto: $8,000 → $12,000» del diálogo D18.
 */
export function diffAdvanceEdit(
  advance: DriverAdvance,
  values: DriverAdvanceEditValues,
  labelsOverride?: {
    employee?: { from: string; to: string };
    trip?: { from: string; to: string };
  },
): AdvanceEditDiff {
  const payload: UpdateDriverAdvancePayload = { expectedStatus: advance.status };
  const changes: AdvanceEditChange[] = [];
  const labels = flowCopy.fieldLabels;
  const tripNone = settlementsCopy.advancesDialog.tripNone;

  if (advance.status === "draft" && values.employeeId && values.employeeId !== advance.employeeId) {
    payload.employeeId = values.employeeId;
    changes.push({
      field: "employeeId",
      label: labels.employeeId,
      from: labelsOverride?.employee?.from ?? advance.employeeFullName ?? "—",
      to: labelsOverride?.employee?.to ?? "—",
    });
  }
  if (Number(values.amount) !== advance.amount) {
    payload.amount = Number(values.amount);
    changes.push({
      field: "amount",
      label: labels.amount,
      from: formatMxCurrency(advance.amount),
      to: formatMxCurrency(Number(values.amount)),
    });
  }
  if (values.category !== advance.category) {
    payload.category = values.category;
    changes.push({
      field: "category",
      label: labels.category,
      from: categoryLabel(advance.category),
      to: categoryLabel(values.category),
    });
  }
  if (values.paymentMethod !== advance.paymentMethod) {
    payload.paymentMethod = values.paymentMethod;
    changes.push({
      field: "paymentMethod",
      label: labels.paymentMethod,
      from: methodLabel(advance.paymentMethod),
      to: methodLabel(values.paymentMethod),
    });
  }

  const nextTripId = normalizeTripId(values.tripId);
  const prevTripId = advance.tripId;
  if (nextTripId !== prevTripId) {
    payload.tripId = nextTripId;
    changes.push({
      field: "tripId",
      label: labels.tripId,
      from: labelsOverride?.trip?.from ?? advance.tripCode ?? tripNone,
      to: labelsOverride?.trip?.to ?? (nextTripId ? nextTripId : tripNone),
    });
  }

  const material = changes.length > 0;

  const nextReference = normalizeText(values.bankReference);
  if (nextReference !== normalizeText(advance.bankReference)) {
    payload.bankReference = nextReference;
  }
  const nextNotes = normalizeText(values.notes);
  if (nextNotes !== normalizeText(advance.notes)) {
    payload.notes = nextNotes;
  }

  const hasAnyChange = Object.keys(payload).length > 1;
  return {
    changes,
    material,
    requiresConfirmation: material && AUTHORIZATION_AT_RISK.includes(advance.status),
    payload: hasAnyChange ? payload : null,
  };
}

/** Firma vigente para las pistas y el diálogo D18 (último paso firmado). */
export function lastAdvanceSignature(advance: DriverAdvance): {
  name: string;
  role: string | null;
  decidedAt: string | null;
} | null {
  const steps = advance.approval?.signedSteps ?? [];
  const last = steps.length > 0 ? steps[steps.length - 1] : null;
  if (last?.fullName) {
    return { name: last.fullName, role: last.role, decidedAt: last.decidedAt };
  }
  if (advance.status === "pending_disbursement" && advance.approvedByName) {
    return { name: advance.approvedByName, role: null, decidedAt: advance.approvedAt ?? null };
  }
  return null;
}

/**
 * D19: la web arma `notas_previas + "\n— {fecha}: " + texto`; el API exige que
 * la nota nueva empiece con la anterior.
 */
export function appendAdvanceNote(
  previous: string | null | undefined,
  addition: string,
  dateLabel: string,
): string {
  const entry = `— ${dateLabel}: ${addition.trim()}`;
  const base = previous ?? "";
  return base ? `${base}\n${entry}` : entry;
}

export function remainingNoteCharacters(
  previous: string | null | undefined,
  addition: string,
  dateLabel: string,
): number {
  return ADVANCE_NOTE_MAX_LENGTH - appendAdvanceNote(previous, addition, dateLabel).length;
}
