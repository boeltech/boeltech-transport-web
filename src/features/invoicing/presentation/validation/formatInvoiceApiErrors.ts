import {
  getErrorMessage,
  isApiError,
  type ValidationFieldError,
} from "@shared/api/interceptors/error-handler";

type DomainValidationError = {
  code?: string;
  message: string;
  path?: string;
};

type CpReadinessDetail = {
  trip_code: string;
  issues: string[];
};

function isDomainValidationError(value: unknown): value is DomainValidationError {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as DomainValidationError).message === "string"
  );
}

function isCpReadinessDetail(value: unknown): value is CpReadinessDetail {
  return (
    typeof value === "object" &&
    value !== null &&
    "trip_code" in value &&
    "issues" in value &&
    Array.isArray((value as CpReadinessDetail).issues)
  );
}

function fromValidationFieldErrors(errors: ValidationFieldError[]): string[] {
  return errors.map((entry) =>
    entry.field && entry.field !== "general"
      ? `${entry.label}: ${entry.message}`
      : entry.message,
  );
}

function fromDetailsArray(details: unknown[]): string[] {
  if (details.length === 0) return [];

  if (details.every(isDomainValidationError)) {
    return details.map((entry) => entry.message);
  }

  if (details.every(isCpReadinessDetail)) {
    return details.flatMap((entry) =>
      entry.issues.map((issue) => `${entry.trip_code}: ${issue}`),
    );
  }

  return [];
}

/**
 * Mensajes legibles para FormValidationSummary tras errores 422 fiscales / validación API.
 */
export function formatInvoiceApiErrorMessages(error: unknown): string[] {
  if (isApiError(error)) {
    if (error.validationErrors.length > 0) {
      return fromValidationFieldErrors(error.validationErrors);
    }

    const rawDetails = error.details;
    if (Array.isArray(rawDetails)) {
      const fromArray = fromDetailsArray(rawDetails);
      if (fromArray.length > 0) return fromArray;
    }

    if (rawDetails && typeof rawDetails === "object" && !Array.isArray(rawDetails)) {
      const record = rawDetails as Record<string, unknown>;
      if (Array.isArray(record.issues)) {
        const fromIssues = fromDetailsArray(record.issues as unknown[]);
        if (fromIssues.length > 0) return fromIssues;
      }
      // Defense in depth: never surface PAC `raw` dumps if they leak in details.
      if (typeof record.raw === "string" && record.raw.length > 0) {
        if (error.message) return [error.message];
        if (typeof record.hint === "string" && record.hint.length > 0) {
          return [record.hint];
        }
      }
    }

    if (error.message) return [error.message];
  }

  const fallback = getErrorMessage(error);
  return fallback ? [fallback] : [];
}
