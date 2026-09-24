import { CreditCard, MoreHorizontal, Banknote, Ban, Send } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { platformCopy } from "../copy/platformCopy";

interface PlatformArRowActionsProps {
  /** When true, shows Emitir (draft → open) instead of open-row actions. */
  isDraft?: boolean;
  canChargeStripe?: boolean;
  onIssueDraft?: () => void;
  issueDraftPending?: boolean;
  onCharge?: () => void;
  onMarkPaid?: () => void;
  onVoid?: () => void;
  /** default: dropdown (tabla). `buttons` = fila densa si se necesita. */
  variant?: "dropdown" | "buttons";
}

export function PlatformArRowActions({
  isDraft = false,
  canChargeStripe = false,
  onIssueDraft,
  issueDraftPending = false,
  onCharge,
  onMarkPaid,
  onVoid,
  variant = "dropdown",
}: PlatformArRowActionsProps) {
  const copy = platformCopy.ar.actions;

  if (isDraft) {
    if (!onIssueDraft) return null;
    if (variant === "buttons") {
      return (
        <Button
          size="sm"
          onClick={onIssueDraft}
          isLoading={issueDraftPending}
          disabled={issueDraftPending}
        >
          {issueDraftPending ? copy.issueDraftSubmitting : copy.issueDraft}
        </Button>
      );
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={copy.menuAria}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{copy.menuAria}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onIssueDraft}
            disabled={issueDraftPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {issueDraftPending ? copy.issueDraftSubmitting : copy.issueDraft}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "buttons") {
    return (
      <div className="flex flex-wrap gap-1">
        {canChargeStripe && onCharge ? (
          <Button size="sm" variant="secondary" onClick={onCharge}>
            {copy.chargeStripe}
          </Button>
        ) : null}
        {onMarkPaid ? (
          <Button size="sm" onClick={onMarkPaid}>
            {copy.markPaid}
          </Button>
        ) : null}
        {onVoid ? (
          <Button size="sm" variant="ghost" onClick={onVoid}>
            {copy.void}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={copy.menuAria}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{copy.menuAria}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canChargeStripe && onCharge ? (
          <DropdownMenuItem onClick={onCharge}>
            <CreditCard className="mr-2 h-4 w-4" />
            {copy.chargeStripe}
          </DropdownMenuItem>
        ) : null}
        {onMarkPaid ? (
          <DropdownMenuItem onClick={onMarkPaid}>
            <Banknote className="mr-2 h-4 w-4" />
            {copy.markPaid}
          </DropdownMenuItem>
        ) : null}
        {onVoid ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onVoid}
          >
            <Ban className="mr-2 h-4 w-4" />
            {copy.void}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
