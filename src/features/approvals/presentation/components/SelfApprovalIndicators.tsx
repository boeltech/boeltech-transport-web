import { Badge } from "@shared/ui/badge";
import { DropdownMenuItem } from "@shared/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.selfApproval;

type OwnRequestKind = "approve" | "disburse";

function ownTooltipFor(kind: OwnRequestKind): string {
  return kind === "disburse" ? copy.ownDisburseTooltip : copy.ownTooltip;
}

function BadgeWithTooltip({
  label,
  tooltip,
  variant,
}: {
  label: string;
  tooltip: string;
  variant: "neutral" | "info";
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Badge variant={variant} tone="soft" className="whitespace-nowrap">
              {label}
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** ADR-0098 UX3: el bloqueo se explica antes del clic, no con un toast. */
export function OwnRequestChip({ kind = "approve" }: { kind?: OwnRequestKind }) {
  return (
    <BadgeWithTooltip
      label={copy.ownChip}
      tooltip={ownTooltipFor(kind)}
      variant="neutral"
    />
  );
}

/** ADR-0098 UX4: evidencia visible de autoaprobación. */
export function SelfApprovedBadge({ label = copy.badge }: { label?: string }) {
  return (
    <BadgeWithTooltip label={label} tooltip={copy.badgeTooltip} variant="info" />
  );
}

/** Fila deshabilitada de menú: dos líneas en lugar de tooltip. */
export function OwnRequestMenuItem({
  kind = "approve",
}: {
  kind?: OwnRequestKind;
}) {
  return (
    <DropdownMenuItem disabled className="flex-col items-start gap-0.5">
      <span>{copy.ownChip}</span>
      <span className="text-xs text-muted-foreground">
        {ownTooltipFor(kind)}
      </span>
    </DropdownMenuItem>
  );
}
