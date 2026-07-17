import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { cn } from "@shared/lib/utils/cn";
import type { BranchListItem } from "../../domain";
import { BranchStatusBadge } from "../config/branchStatusConfig";
import { formatBranchListLocation } from "../utils/branchAddressFormatters";
import { branchesCopy } from "../copy/branchesCopy";
import { BranchActions } from "./BranchActions";

interface BranchTableProps {
  branches: BranchListItem[];
  isLoading: boolean;
  showDeleted?: boolean;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  isDeleting?: boolean;
  isRestoring?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
}

export function BranchTable({
  branches,
  isLoading,
  showDeleted = false,
  onDelete,
  onRestore,
  isDeleting,
  isRestoring,
  sortBy,
  sortOrder,
  onSort,
}: BranchTableProps) {
  const navigate = useNavigate();
  const columns = branchesCopy.list.columns;

  const handleRowClick = (branchId: string) => {
    navigate(`/branches/${branchId}`);
  };

  const handleSort = (field: string) => {
    onSort?.(field);
  };

  const renderSortableHeader = (
    field: string,
    label: string,
    className?: string,
  ) => {
    const isActive = sortBy === field;
    const isAsc = sortOrder === "asc";

    return (
      <TableHead
        className={cn(
          onSort ? "cursor-pointer select-none hover:bg-muted/50" : undefined,
          className,
        )}
        onClick={onSort ? () => handleSort(field) : undefined}
      >
        <div className="flex items-center gap-1">
          {label}
          {onSort && isActive ? (
            <span className="text-xs">{isAsc ? "↑" : "↓"}</span>
          ) : null}
        </div>
      </TableHead>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{columns.code}</TableHead>
              <TableHead>{columns.name}</TableHead>
              <TableHead>{columns.city}</TableHead>
              <TableHead>{columns.contact}</TableHead>
              <TableHead>{columns.status}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
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
            {renderSortableHeader("code", columns.code)}
            {renderSortableHeader("name", columns.name)}
            {renderSortableHeader("city", columns.city)}
            <TableHead>{columns.contact}</TableHead>
            {renderSortableHeader("status", columns.status)}
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => (
            <TableRow
              key={branch.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(branch.id)}
            >
              <TableCell className="font-medium">{branch.code}</TableCell>
              <TableCell>
                {branch.name}
                {branch.isMain ? (
                  <Badge
                    variant="outline"
                    className="ml-2 border-warning/40 text-xs text-warning-soft-foreground"
                  >
                    {branchesCopy.card.mainBadge}
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell>{formatBranchListLocation(branch.city, branch.state) || "—"}</TableCell>
              <TableCell>{branch.phone || "—"}</TableCell>
              <TableCell>
                <BranchStatusBadge status={branch.status} size="sm" showIcon />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <BranchActions
                  branchId={branch.id}
                  branchName={branch.name}
                  isActive={!showDeleted && branch.isActive}
                  isMain={branch.isMain}
                  onDelete={onDelete}
                  onRestore={onRestore}
                  isDeleting={isDeleting}
                  isRestoring={isRestoring}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
