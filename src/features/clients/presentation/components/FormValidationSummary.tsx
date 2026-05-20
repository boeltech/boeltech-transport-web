import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert/Alert";

export interface FormValidationSummaryProps {
  messages: string[];
  title?: string;
}

/**
 * Resumen visible de errores de validación (wizard / edición).
 */
export function FormValidationSummary({
  messages,
  title = "Revisa los siguientes campos",
}: FormValidationSummaryProps) {
  if (messages.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
          {messages.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
