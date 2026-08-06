import { Ban, CheckCircle2, Loader2, Package, RotateCcw } from "lucide-react";
import { useId } from "react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import type { CargoManualAction } from "../../utils/cargoStatusActions";
import {
  CARGO_TRANSITION_COPY,
  type CargoTransitionAction,
} from "./transitionCopy";

const copy = tripDetailCopy.cargo;

const ACTION_META: Record<
  CargoManualAction,
  {
    label: string;
    icon: typeof Package;
    variant: "default" | "outline" | "destructive";
    transition: CargoTransitionAction;
  }
> = {
  pickup: {
    label: copy.action.pickup,
    icon: Package,
    variant: "outline",
    transition: "pickup",
  },
  deliver: {
    label: copy.action.deliver,
    icon: CheckCircle2,
    variant: "default",
    transition: "deliver",
  },
  return: {
    label: copy.action.return,
    icon: RotateCcw,
    variant: "outline",
    transition: "return",
  },
  cancel: {
    label: copy.action.cancel,
    icon: Ban,
    variant: "destructive",
    transition: "cancel",
  },
};

export type CargoActionInlineProps = {
  action: CargoManualAction;
  onClick: () => void;
  pending?: boolean;
  disabled?: boolean;
  title?: string;
  /** Microcopy bajo el botón; en detalle lean del hub va en `false`. */
  showTransition?: boolean;
  className?: string;
};

export function CargoActionInline({
  action,
  onClick,
  pending = false,
  disabled = false,
  title,
  showTransition = true,
  className,
}: CargoActionInlineProps) {
  const transitionId = useId();
  const meta = ACTION_META[action];
  const Icon = meta.icon;

  return (
    <div className={cn("space-y-0.5", className)}>
      <Button
        type="button"
        size="sm"
        variant={meta.variant}
        className="h-auto min-h-8 justify-start whitespace-normal py-1.5 text-left text-xs"
        disabled={disabled || pending}
        title={title}
        onClick={onClick}
        aria-describedby={showTransition ? transitionId : undefined}
      >
        {pending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : (
          <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
        )}
        <span className="font-medium">{meta.label}</span>
      </Button>
      {showTransition ? (
        <p id={transitionId} className="text-xs text-muted-foreground">
          {CARGO_TRANSITION_COPY[meta.transition]}
        </p>
      ) : null}
    </div>
  );
}
