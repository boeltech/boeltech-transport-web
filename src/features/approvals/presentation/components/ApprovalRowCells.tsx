import { Check, MoreHorizontal } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { TableCell } from "@shared/ui/table";
import {
  showsSelfApprovedBadge,
  type ApprovableItem,
  type ApprovalActionUi,
  type SelfActionUi,
} from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import { deriveApprovalActionUi } from "../utils/approvalRowActions";
import { ApprovalActionStateChip, ApprovalFlowLines } from "./ApprovalFlowIndicators";
import { SelfApprovedBadge } from "./SelfApprovalIndicators";

const copy = approvalsCopy.inbox;
const flowCopy = approvalsCopy.flow;

/** Props de decisión compartidas por todas las filas de la bandeja. */
export interface ApprovalRowDecisionProps {
  canUpdate: boolean;
  /** ADR-0098: resultado de `resolveSelfActionUi` (default `normal`). */
  selfActionUi?: SelfActionUi;
  /** ADR-0099: resultado de `resolveApprovalActionUi`; si falta se deriva del ítem. */
  actionUi?: ApprovalActionUi;
  onApprove: () => void;
  onReject: () => void;
  onReturn?: () => void;
  onHistory?: () => void;
}

export function ApprovalStatusCell({
  statusLabel,
  item,
}: {
  statusLabel: string;
  item: Pick<ApprovableItem, "status" | "selfApproved" | "approval">;
}) {
  const selfApproved = showsSelfApprovedBadge({
    kind: "approvable",
    status: item.status,
    selfSegregatedApproval: item.selfApproved,
  });
  return (
    <TableCell>
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="secondary">{statusLabel}</Badge>
        {selfApproved ? <SelfApprovedBadge /> : null}
      </div>
      <ApprovalFlowLines approval={item.approval} />
    </TableCell>
  );
}

function deferOpen(open: (() => void) | undefined) {
  if (!open) return undefined;
  return () => {
    window.setTimeout(open, 0);
  };
}

/**
 * Handoff F6 D8 + CEO-4: ✓ Aprobar a un clic; Devolver, Rechazar e historial
 * en ⋯. Sin acción: chip de estado + ⋯ con solo «Ver historial».
 */
export function ApprovalActionsCell({
  item,
  canUpdate,
  selfActionUi = "normal",
  actionUi,
  onApprove,
  onReject,
  onReturn,
  onHistory,
}: ApprovalRowDecisionProps & { item: ApprovableItem }) {
  const resolved = actionUi ?? deriveApprovalActionUi(item, canUpdate, selfActionUi);
  const canAct = resolved.kind === "act";
  const openReturn = canAct ? deferOpen(onReturn) : undefined;
  const openReject = canAct ? deferOpen(onReject) : undefined;
  const openHistory = deferOpen(onHistory);
  const hasMenu = Boolean(openReturn || openReject || openHistory);

  return (
    <TableCell className="text-right">
      <div className="flex items-center justify-end gap-1">
        {canAct ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onApprove}
            aria-label={copy.actions.approve}
            title={copy.actions.approve}
          >
            <Check className="h-4 w-4 text-success" />
          </Button>
        ) : (
          <ApprovalActionStateChip actionUi={resolved} />
        )}
        {hasMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={flowCopy.menu.more}
                title={flowCopy.menu.more}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {openReturn ? (
                <DropdownMenuItem onSelect={openReturn}>
                  {flowCopy.menu.return}
                </DropdownMenuItem>
              ) : null}
              {openReject ? (
                <DropdownMenuItem
                  onSelect={openReject}
                  className="text-destructive focus:text-destructive"
                >
                  {flowCopy.menu.reject}
                </DropdownMenuItem>
              ) : null}
              {(openReturn || openReject) && openHistory ? (
                <DropdownMenuSeparator />
              ) : null}
              {openHistory ? (
                <DropdownMenuItem onSelect={openHistory}>
                  {flowCopy.menu.history}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </TableCell>
  );
}
