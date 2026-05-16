/**
 * Extiende el esquema del wizard con la misma validación que el API (`createTripSchema` / `updateTripSchema`).
 * ADR-0043 WS-D.
 */
import { z } from "zod";

import {
  apiValidationPathToFormPath,
  validateCreateTripApiPayload,
  validateUpdateTripApiPayload,
} from "../validateTripApiPayload";
import { buildCreateTripInputFromWizardValues } from "../wizardToCreateTripInput";
import { buildUpdateTripInputFromWizardValues } from "../wizardToUpdateTripInput";

import { tripWizardSchema } from "./validation";

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
