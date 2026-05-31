import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert/Alert";
import { cn } from "@shared/lib/utils/cn";

export interface FormValidationSummaryProps {
  messages: string[];
  title?: string;
  className?: string;
}

/**
 * Resumen visible de errores de validación (wizard / edición).
 * Mostrar solo tras un `trigger()` fallido, al pie del formulario.
 */
export function FormValidationSummary({
  messages,
  title = "Revisa los siguientes campos",
  className,
}: FormValidationSummaryProps) {
  if (messages.length === 0) return null;

  return (
    <Alert variant="destructive" className={cn("mb-4", className)}>
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
