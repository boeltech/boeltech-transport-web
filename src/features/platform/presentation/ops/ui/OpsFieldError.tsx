import { cn } from "@shared/lib/utils/cn";

/** Error bajo campo — tokens ops (evita Alert ERP en FormValidationSummary). */
export function OpsFieldError({
  fieldId,
  message,
  className,
}: {
  fieldId: string;
  message?: string;
  className?: string;
}) {
  if (!message) return null;
  return (
    <p
      id={`${fieldId}-error`}
      className={cn("ops-field-error", className)}
      role="alert"
    >
      {message}
    </p>
  );
}

export type OpsFormErrorEntry = string | { id: string; message: string };

function isLinkedError(
  entry: OpsFormErrorEntry,
): entry is { id: string; message: string } {
  return typeof entry !== "string";
}

export function OpsFormErrors({
  messages,
  title = "Revisa los siguientes campos",
  className,
}: {
  messages: OpsFormErrorEntry[];
  title?: string;
  className?: string;
}) {
  if (messages.length === 0) return null;
  return (
    <div className={cn("ops-form-errors", className)} role="alert">
      <p className="font-semibold">{title}</p>
      <ul>
        {messages.map((entry) =>
          isLinkedError(entry) ? (
            <li key={entry.id}>
              <button
                type="button"
                className="ops-form-error-jump ops-ring-accent"
                onClick={() => {
                  document.getElementById(entry.id)?.focus();
                }}
              >
                {entry.message}
              </button>
            </li>
          ) : (
            <li key={entry}>{entry}</li>
          ),
        )}
      </ul>
    </div>
  );
}
