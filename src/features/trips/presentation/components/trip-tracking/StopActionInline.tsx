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
  className?: string;
};

export function StopActionInline({
  label,
  action,
  onClick,
  pending = false,
  disabled = false,
  variant = "outline",
  className,
}: StopActionInlineProps) {
  const transitionId = useId();
  const transitionText = STOP_TRANSITION_COPY[action];

  return (
    <div className={cn("space-y-0.5", className)}>
      <Button
        type="button"
        size="sm"
        variant={variant}
        className="h-auto min-h-8 w-full justify-start whitespace-normal py-1.5 text-left text-xs sm:w-auto"
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
