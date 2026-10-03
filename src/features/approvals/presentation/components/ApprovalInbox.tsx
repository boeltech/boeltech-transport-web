import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Checkbox } from "@shared/ui/checkbox";
import { Skeleton } from "@shared/ui/skeleton";
import {
  resolveApprovableActionUi,
  resolveApprovableSelfActionUi,
  type ApprovableItem,
  type SelfApprovalPolicy,
} from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import { isApprovableSelectable } from "../utils/approvalRowActions";
import { ApprovalRow } from "./ApprovalRow";

const copy = approvalsCopy.inbox.table;

const TABLE_HEADERS = [
  { key: "select", label: copy.select, className: "w-10" },
  { key: "type", label: copy.type },
  { key: "trip", label: copy.trip },
  { key: "category", label: copy.category },
  { key: "description", label: copy.description },
  { key: "amount", label: copy.amount, className: "text-right" },
  { key: "date", label: copy.date },
  { key: "status", label: copy.status },
  { key: "actions", label: copy.actions, className: "text-right" },
];

export interface ApprovalInboxProps {
  items: ApprovableItem[];
  isLoading: boolean;
  selectedIds: Set<string>;
  canUpdate: boolean;
  /** Usuario actual — detecta solicitudes propias y pasos ya firmados. */
  currentUserId?: string | null;
  /** Capacidades de autoacción del API (ADR-0098); sin cargar = fail-closed. */
  selfApprovalPolicy?: SelfApprovalPolicy | null;
  onToggleItem: (item: ApprovableItem, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onApprove: (item: ApprovableItem) => void;
  onReject: (item: ApprovableItem) => void;
  /** ADR-0099 «Devolver para corregir». */
  onReturn?: (item: ApprovableItem) => void;
  /** ADR-0099 «Ver historial». */
  onHistory?: (item: ApprovableItem) => void;
  maxSelection?: number;
}

export function ApprovalInbox({
  items,
  isLoading,
  selectedIds,
  canUpdate,
  currentUserId,
  selfApprovalPolicy,
  onToggleItem,
  onToggleAll,
  onApprove,
  onReject,
  onReturn,
  onHistory,
  maxSelection = 50,
}: ApprovalInboxProps) {
  const canSelectItem = (item: ApprovableItem) =>
    isApprovableSelectable(item, canUpdate, currentUserId, selfApprovalPolicy);
  const selectableItems = items.filter(canSelectItem);
  const allSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) => selectedIds.has(item.id));
  const someSelected =
    selectableItems.some((item) => selectedIds.has(item.id)) && !allSelected;

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {TABLE_HEADERS.map((header) => (
                <TableHead key={header.key} className={header.className}>
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={TABLE_HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              {canUpdate && selectableItems.length > 0 ? (
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={(checked) => onToggleAll(checked === true)}
                  aria-label={copy.select}
                />
              ) : null}
            </TableHead>
            {TABLE_HEADERS.slice(1).map((header) => (
              <TableHead key={header.key} className={header.className}>
                {header.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const selfActionUi = resolveApprovableSelfActionUi(
              item,
              currentUserId,
              selfApprovalPolicy,
            );
            const actionUi = resolveApprovableActionUi(
              item,
              currentUserId,
              selfApprovalPolicy,
              canUpdate,
            );
            const selectable =
              canSelectItem(item) &&
              (selectedIds.has(item.id) || selectedIds.size < maxSelection);

            return (
              <ApprovalRow
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                selectable={selectable}
                canUpdate={canUpdate}
                selfActionUi={selfActionUi}
                actionUi={actionUi}
                onSelectChange={(checked) => onToggleItem(item, checked)}
                onApprove={() => onApprove(item)}
                onReject={() => onReject(item)}
                onReturn={onReturn ? () => onReturn(item) : undefined}
                onHistory={onHistory ? () => onHistory(item) : undefined}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
