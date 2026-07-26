import { Loader2 } from "lucide-react";
import { useId } from "react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import {
  STOP_TRANSITION_COPY,
  type StopTransitionAction,
} from "./transitionCopy";

export type StopActionInlineProps = {
  label: string;
  action: StopTransitionAction;
  onClick: () => void;
  pending?: boolean;
  disabled?: boolean;
  variant?: "default" | "outline";
  /** `lg` en el hub operativo (única CTA de parada del tab). */
  size?: "sm" | "default" | "lg";
  className?: string;
};

export function StopActionInline({
  label,
  action,
  onClick,
  pending = false,
  disabled = false,
  variant = "outline",
  size = "sm",
  className,
}: StopActionInlineProps) {
  const transitionId = useId();
  const transitionText = STOP_TRANSITION_COPY[action];
  const isProminent = size === "lg" || size === "default";

  return (
    <div className={cn("space-y-0.5", className)}>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn(
          "w-full justify-start whitespace-normal text-left sm:w-auto",
          isProminent
            ? "h-auto min-h-10 py-2.5 text-sm"
            : "h-auto min-h-8 py-1.5 text-xs",
        )}
        disabled={disabled || pending}
        onClick={onClick}
        aria-describedby={transitionId}
      >
        {pending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : null}
        <span className="font-medium">{label}</span>
      </Button>
      <p id={transitionId} className="text-xs text-muted-foreground">
        {transitionText}
      </p>
    </div>
  );
}
