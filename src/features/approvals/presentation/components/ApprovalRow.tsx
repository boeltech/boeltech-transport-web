import { TableCell, TableRow } from "@shared/ui/table";
import type { ApprovableItem } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import type { ApprovalRowDecisionProps } from "./ApprovalRowCells";
import { ApprovalRowTripExpense } from "./ApprovalRowTripExpense";
import { ApprovalRowCompensation } from "./ApprovalRowCompensation";
import { ApprovalRowAdvance } from "./ApprovalRowAdvance";

export interface ApprovalRowProps extends ApprovalRowDecisionProps {
  item: ApprovableItem;
  selected: boolean;
  selectable: boolean;
  onSelectChange: (checked: boolean) => void;
}

export function ApprovalRow(props: ApprovalRowProps) {
  switch (props.item.context.approvableType) {
    case "trip_expense":
      return <ApprovalRowTripExpense {...props} />;
    case "internal_staff_compensation":
      return <ApprovalRowCompensation {...props} />;
    case "driver_advance_request":
      return <ApprovalRowAdvance {...props} />;
    default:
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-muted-foreground">
            {approvalsCopy.inbox.unsupportedType}: {props.item.approvableType}
          </TableCell>
        </TableRow>
      );
  }
}
