/**
 * Toggle mostrar/ocultar contraseña (auth funnel + forms).
 */
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

type PasswordVisibilityToggleProps = {
  visible: boolean;
  onToggle: () => void;
  showLabel: string;
  hideLabel: string;
  className?: string;
};

export function PasswordVisibilityToggle({
  visible,
  onToggle,
  showLabel,
  hideLabel,
  className,
}: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2",
        className,
      )}
      aria-label={visible ? hideLabel : showLabel}
      tabIndex={-1}
    >
      {visible ? (
        <EyeOff className="h-4 w-4" aria-hidden />
      ) : (
        <Eye className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
