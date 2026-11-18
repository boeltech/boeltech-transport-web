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
    // L-D4′: por carga = outline; Qué sigue (hub) overridea a default.
    variant: "outline",
    transition: "pickup",
  },
  deliver: {
    label: copy.action.deliver,
    icon: CheckCircle2,
    variant: "outline",
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
  /** Override (hub Qué sigue: un solo `default` ATF; nested usa meta outline). */
  variant?: "default" | "outline" | "destructive";
  /** Override tamaño; hub Qué sigue usa `default` en la primaria de vista. */
  size?: "default" | "sm" | "lg" | "icon";
  /** Etiqueta visible; por defecto meta de acción (p. ej. «Marcar recogida»). */
  label?: string;
  /** Microcopy contextual Cancelar≠Devolver (F3b); sustituye CARGO_TRANSITION_COPY. */
  transitionText?: string | null;
  className?: string;
};

export function CargoActionInline({
  action,
  onClick,
  pending = false,
  disabled = false,
  title,
  showTransition = true,
  variant,
  size = "sm",
  label,
  transitionText,
  className,
}: CargoActionInlineProps) {
  const transitionId = useId();
  const meta = ACTION_META[action];
  const Icon = meta.icon;
  const buttonVariant = variant ?? meta.variant;
  const buttonLabel = label ?? meta.label;
  const resolvedTransition =
    transitionText?.trim() || CARGO_TRANSITION_COPY[meta.transition];

  const showDisabledReason = Boolean(disabled && title && !showTransition);

  return (
    <div className={cn("space-y-0.5", className)}>
      <Button
        type="button"
        size={size}
        variant={buttonVariant}
        className={cn(
          "h-auto justify-start whitespace-normal text-left",
          size === "sm"
            ? "min-h-8 py-1.5 text-xs"
            : "min-h-9 py-2 text-sm sm:w-auto",
        )}
        disabled={disabled || pending}
        title={title}
        onClick={onClick}
        aria-label={
          disabled && title ? `${buttonLabel}. ${title}` : undefined
        }
        aria-describedby={
          showTransition || showDisabledReason ? transitionId : undefined
        }
      >
        {pending ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" />
        ) : (
          <Icon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
        )}
        <span className="font-medium">{buttonLabel}</span>
      </Button>
      {showTransition ? (
        <p id={transitionId} className="text-xs text-muted-foreground">
          {resolvedTransition}
        </p>
      ) : showDisabledReason ? (
        <p
          id={transitionId}
          className="text-xs text-muted-foreground"
          role="status"
        >
          {title}
        </p>
      ) : null}
    </div>
  );
}
