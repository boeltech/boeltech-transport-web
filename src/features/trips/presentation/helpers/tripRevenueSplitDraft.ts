/**
 * Helpers de draft local del sheet de prorrateo (ADR-0081).
 * Hidratación por revisión servidor + validación vía @boeltech/cfdi-domain.
 */
import { z } from "zod";
import {
  validateRevenueSplitLegs,
  type ValidationError,
} from "@boeltech/cfdi-domain";
import type { TripRevenueSplit } from "@features/trips/domain";

export type RevenueSplitDraftLeg = {
  clientId: string;
  sharePercent: string;
};

export type TripRevenueSplitFormLeg = {
  clientId: string;
  sharePercent: number;
};

export type TripRevenueSplitFormValues = {
  basisAmount: number;
  tripClientId: string;
  legs: TripRevenueSplitFormLeg[];
  /** `"none"` o índice de porción como string (`"0"`, `"1"`, …). */
  cpCarrier: string;
  activateOnSave: boolean;
};

/** Clave estable para decidir si re-hidratar el form (no la identidad del objeto Query). */
export function getSplitHydrationRevision(
  split: TripRevenueSplit | null | undefined,
): string {
  if (split == null) return "none";
  return `${split.id}:${split.updatedAt}`;
}

/**
 * Valida porciones del draft UI con la misma regla del paquete que usa el API.
 * sharePercent vacío o no numérico se envía como NaN → SPLIT_SHARE_PERCENT_INVALID.
 */
export function validateTripRevenueSplitDraftLegs(
  legs: readonly {
    clientId: string;
    sharePercent: string | number;
  }[],
): { ok: true } | { ok: false; error: ValidationError } {
  const result = validateRevenueSplitLegs(
    legs.map((leg) => ({
      clientId: leg.clientId,
      sharePercent: Number(leg.sharePercent),
    })),
  );
  if (result.ok) return { ok: true };
  return { ok: false, error: result.error };
}

export function initialFormLegs6040(
  tripClientId?: string | null,
): TripRevenueSplitFormLeg[] {
  const firstClientId = tripClientId?.trim() ? tripClientId : "";
  return [
    { clientId: firstClientId, sharePercent: 60 },
    { clientId: "", sharePercent: 40 },
  ];
}

export function buildEmptyRevenueSplitFormValues(
  tripClientId?: string | null,
  basisAmount = 0,
): TripRevenueSplitFormValues {
  return {
    basisAmount,
    tripClientId: tripClientId?.trim() ? tripClientId : "",
    legs: initialFormLegs6040(tripClientId),
    cpCarrier: "none",
    activateOnSave: true,
  };
}

export function buildRevenueSplitFormValuesFromSplit(
  split: TripRevenueSplit,
  tripClientId?: string | null,
): TripRevenueSplitFormValues {
  const cpIndex = split.legs.findIndex((leg) => leg.suggestedCartaPorte);
  return {
    basisAmount: Number(split.basisAmount) || 0,
    tripClientId: tripClientId?.trim()
      ? tripClientId
      : (split.legs[0]?.clientId ?? ""),
    legs: split.legs.map((leg) => ({
      clientId: leg.clientId,
      sharePercent: Number(leg.sharePercent) || 0,
    })),
    cpCarrier: cpIndex >= 0 ? String(cpIndex) : "none",
    activateOnSave: split.status !== "active",
  };
}

const formLegSchema = z.object({
  clientId: z.string(),
  // Vacío/no numérico → NaN para que el paquete emita SPLIT_SHARE_PERCENT_INVALID (copy UI).
  sharePercent: z.preprocess((value) => {
    if (value === "" || value == null) return Number.NaN;
    if (typeof value === "number") return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }, z.custom<number>((value) => typeof value === "number")),
});

/**
 * Traduce `ValidationError.path` del paquete (`legs[i].clientId` /
 * `legs[i].sharePercent` / `legs`) a path RHF.
 * Errores de suma u raíz `legs` → primer % para foco/summary usable.
 */
export function mapRevenueSplitValidationErrorToRhfPath(
  error: ValidationError,
): Array<string | number> {
  const raw = error.path?.trim() ?? "";

  const fieldMatch = raw.match(
    /^legs\[(\d+)\]\.(clientId|sharePercent)$/,
  );
  if (fieldMatch) {
    return ["legs", Number(fieldMatch[1]), fieldMatch[2]];
  }

  const legMatch = raw.match(/^legs\[(\d+)\]$/);
  if (legMatch) {
    return ["legs", Number(legMatch[1]), "clientId"];
  }

  if (
    raw === "legs" ||
    raw === "" ||
    error.code === "SPLIT_SHARES_INVALID" ||
    error.code === "SPLIT_MIN_LEGS" ||
    error.code === "SPLIT_MAX_LEGS" ||
    error.code === "SPLIT_MULTIPLE_CARTA_PORTE_BEARERS"
  ) {
    return ["legs", 0, "sharePercent"];
  }

  if (error.code === "SPLIT_SHARE_PERCENT_INVALID") {
    return ["legs", 0, "sharePercent"];
  }

  if (
    error.code === "SPLIT_LEG_CLIENT_REQUIRED" ||
    error.code === "SPLIT_LEG_CLIENT_DUPLICATE"
  ) {
    return ["legs", 0, "clientId"];
  }

  return ["legs", 0, "sharePercent"];
}

export type TripRevenueSplitFormValidationMessages = {
  tripClientRequired: string;
  tripClientNotInLegs: string;
  minLegs: string;
  maxLegs: string;
  clientRequired: string;
  clientDuplicate: string;
  sharePercentInvalid: string;
  sharesInvalid: (sum: string) => string;
  multipleCartaPorte: string;
  unknown: string;
};

function roundShareSumForDisplay(sum: number): string {
  const rounded = Math.round(sum * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * Traduce `ValidationError.code` del paquete a copy de producto (UI).
 * No reutilizar `error.message` del dominio en pantalla.
 */
export function mapRevenueSplitValidationErrorToUserMessage(
  error: ValidationError,
  messages: TripRevenueSplitFormValidationMessages,
  context?: { shareSum?: number },
): string {
  switch (error.code) {
    case "SPLIT_MIN_LEGS":
      return messages.minLegs;
    case "SPLIT_MAX_LEGS":
      return messages.maxLegs;
    case "SPLIT_LEG_CLIENT_REQUIRED":
      return messages.clientRequired;
    case "SPLIT_LEG_CLIENT_DUPLICATE":
      return messages.clientDuplicate;
    case "SPLIT_SHARE_PERCENT_INVALID":
      return messages.sharePercentInvalid;
    case "SPLIT_SHARES_INVALID": {
      const sum =
        typeof context?.shareSum === "number" && Number.isFinite(context.shareSum)
          ? context.shareSum
          : 0;
      return messages.sharesInvalid(roundShareSumForDisplay(sum));
    }
    case "SPLIT_MULTIPLE_CARTA_PORTE_BEARERS":
      return messages.multipleCartaPorte;
    default:
      return messages.unknown;
  }
}

/**
 * Schema UX del sheet. Reglas de porciones (duplicados, suma, etc.) vía paquete
 * en `superRefine` — no duplicar SAT/reglas de negocio localmente.
 */
export function createTripRevenueSplitFormSchema(
  messages: TripRevenueSplitFormValidationMessages,
) {
  return z
    .object({
      basisAmount: z.coerce.number().min(0),
      tripClientId: z.string(),
      legs: z.array(formLegSchema).min(2).max(10),
      cpCarrier: z.string(),
      activateOnSave: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const legsResult = validateTripRevenueSplitDraftLegs(data.legs);
      if (!legsResult.ok) {
        const shareSum = data.legs.reduce(
          (acc, leg) => acc + (Number(leg.sharePercent) || 0),
          0,
        );
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: mapRevenueSplitValidationErrorToUserMessage(
            legsResult.error,
            messages,
            { shareSum },
          ),
          path: mapRevenueSplitValidationErrorToRhfPath(legsResult.error),
        });
      }

      if (data.activateOnSave && !data.tripClientId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.tripClientRequired,
          path: ["tripClientId"],
        });
      }

      if (
        data.tripClientId.trim() &&
        !data.legs.some((leg) => leg.clientId === data.tripClientId)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: messages.tripClientNotInLegs,
          path: ["tripClientId"],
        });
      }
    });
}

export type TripRevenueSplitFormSchema = ReturnType<
  typeof createTripRevenueSplitFormSchema
>;
