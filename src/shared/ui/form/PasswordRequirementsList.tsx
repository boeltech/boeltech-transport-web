import { Check, Circle } from "lucide-react";
import {
  getPasswordRequirementStatus,
  type PasswordRequirementStatus,
} from "@shared/utils/passwordRequirementStatus";
import { cn } from "@shared/lib/utils/cn";

const LABELS: { key: keyof PasswordRequirementStatus; label: string }[] = [
  { key: "minLength", label: "Al menos 8 caracteres" },
  { key: "hasUppercase", label: "Una letra mayúscula" },
  { key: "hasLowercase", label: "Una letra minúscula" },
  { key: "hasDigit", label: "Un número" },
];

export function PasswordRequirementsList({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  const status = getPasswordRequirementStatus(password);

  return (
    <ul
      className={cn("grid gap-1.5 text-sm sm:grid-cols-2", className)}
      aria-label="Requisitos de la contraseña"
    >
      {LABELS.map(({ key, label }) => {
        const met = status[key];
        return (
          <li
            key={key}
            className={cn(
              "flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors",
              met
                ? "border-success/40 bg-success-soft text-success-soft-foreground"
                : "border-border bg-muted/30 text-muted-foreground",
            )}
          >
            {met ? (
              <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
            ) : (
              <Circle className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            )}
            <span>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
