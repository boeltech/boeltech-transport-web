import type { CreateTripInput, UpdateTripInput } from "@features/trips/domain";
import {
  createTripSchema,
  formatZodError,
  updateTripSchema,
} from "@boeltech/cfdi-domain/validadores/trips";
import { deepToSnake } from "@shared/api/utils/case-transformer";

export type TripApiPayloadValidation =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string> };

/**
 * Valida el mismo cuerpo que enviará `apiClient` (camelCase → snake_case)
 * contra los esquemas compartidos del backend.
 */
export function validateCreateTripApiPayload(
  input: CreateTripInput,
): TripApiPayloadValidation {
  const result = createTripSchema.safeParse(deepToSnake(input));
  if (result.success) return { ok: true };
  return { ok: false, fieldErrors: formatZodError(result.error) };
}

export function validateUpdateTripApiPayload(
  input: UpdateTripInput,
): TripApiPayloadValidation {
  const result = updateTripSchema.safeParse(deepToSnake(input));
  if (result.success) return { ok: true };
  return { ok: false, fieldErrors: formatZodError(result.error) };
}

/** Texto breve para toast (rutas snake_case alineadas con el API). */
export function summarizeTripApiPayloadErrors(
  fieldErrors: Record<string, string>,
  maxLines = 3,
): string {
  const lines = Object.entries(fieldErrors).map(([path, msg]) =>
    path ? `${path}: ${msg}` : msg,
  );
  if (lines.length === 0) return "Revisa los datos del viaje.";
  return lines.slice(0, maxLines).join(" · ");
}
