/**
 * Extiende el esquema del wizard con la misma validación que el API (`createTripSchema` / `updateTripSchema`).
 * ADR-0043 WS-D.
 */
import { z } from "zod";

import {
  validateCreateTripApiPayload,
  validateUpdateTripApiPayload,
} from "../validateTripApiPayload";
import { buildCreateTripInputFromWizardValues } from "../wizardToCreateTripInput";
import { buildUpdateTripInputFromWizardValues } from "../wizardToUpdateTripInput";

import { tripWizardSchema } from "./validation";

function snakeSegmentToCamel(segment: string): string {
  if (/^\d+$/.test(segment)) return segment;
  return segment.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Convierte paths de error del payload API (snake) a paths del formulario (camel). */
export function apiValidationPathToFormPath(path: string): (string | number)[] {
  return path.split(".").map((part) => {
    if (/^\d+$/.test(part)) return Number(part);
    return snakeSegmentToCamel(part);
  });
}

export const tripWizardSchemaWithCreateApiAlignment = tripWizardSchema.superRefine(
  (data, ctx) => {
    const createInput = buildCreateTripInputFromWizardValues(data);
    const check = validateCreateTripApiPayload(createInput);
    if (check.ok) return;
    for (const [path, msg] of Object.entries(check.fieldErrors)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: apiValidationPathToFormPath(path),
      });
    }
  },
);

export const tripWizardSchemaWithUpdateApiAlignment = tripWizardSchema.superRefine(
  (data, ctx) => {
    const updateInput = buildUpdateTripInputFromWizardValues(data);
    const check = validateUpdateTripApiPayload(updateInput);
    if (check.ok) return;
    for (const [path, msg] of Object.entries(check.fieldErrors)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: apiValidationPathToFormPath(path),
      });
    }
  },
);
