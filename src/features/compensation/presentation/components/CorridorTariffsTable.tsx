import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { CompensationActiveStatusBadge } from "../config/compensationStatusConfig";
import { Skeleton } from "@shared/ui/skeleton";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { RouteCorridorTariff } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import {
  type BranchNameMap,
  formatCorridorRouteHuman,
} from "../utils/formatCorridorRoute";
import { CorridorTariffActions } from "./CorridorTariffActions";

const copy = compensationCopy.corridors;

interface CorridorTariffsTableProps {
  corridors: RouteCorridorTariff[];
  isLoading?: boolean;
  branchNameMap?: BranchNameMap;
  duplicateIds?: ReadonlySet<string>;
  showActions?: boolean;
  onEdit?: (corridor: RouteCorridorTariff) => void;
  onActionComplete?: () => void;
}

export function CorridorTariffsTable({
  corridors,
  isLoading,
  branchNameMap,
  duplicateIds,
  showActions = false,
  onEdit,
  onActionComplete,
}: CorridorTariffsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border bg-card overflow-x-auto p-4">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.columns.name}</TableHead>
          <TableHead>{copy.columns.route}</TableHead>
          <TableHead className="text-right">{copy.columns.amount}</TableHead>
          <TableHead>{copy.columns.status}</TableHead>
          {showActions ? (
            <TableHead className="w-12 text-right">{copy.columns.actions}</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {corridors.map((corridor) => (
          <TableRow key={corridor.id}>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{corridor.name}</span>
                {duplicateIds?.has(corridor.id) ? (
                  <Badge variant="warning" tone="soft">
                    {copy.duplicateBadge}
                  </Badge>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatCorridorRouteHuman(corridor, branchNameMap)}
            </TableCell>
            <TableCell className="text-right tabular-nums whitespace-nowrap">
              {formatMxCurrency(corridor.fixedAmount)}
            </TableCell>
            <TableCell>
              <CompensationActiveStatusBadge isActive={corridor.isActive} />
            </TableCell>
            {showActions ? (
              <TableCell
                className="w-12 text-right whitespace-nowrap"
                onClick={(event) => event.stopPropagation()}
              >
                <CorridorTariffActions
                  corridor={corridor}
                  onEdit={onEdit}
                  onActionComplete={onActionComplete}
                />
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
