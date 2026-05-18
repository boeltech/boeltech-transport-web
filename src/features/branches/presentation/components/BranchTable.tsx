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
import type { BranchListItem } from "../../domain";
import { BranchStatusBadge } from "../config/branchStatusConfig";
import { BranchActions } from "./BranchActions";

interface BranchTableProps {
  branches: BranchListItem[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
}

export function BranchTable({ branches, isLoading, onDelete }: BranchTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estatus</TableHead>
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
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Estatus</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => (
            <TableRow key={branch.id}>
              <TableCell className="font-medium">{branch.code}</TableCell>
              <TableCell>
                {branch.name}
                {branch.isMain ? (
                  <Badge
                    variant="outline"
                    className="ml-2 border-warning/40 text-warning-soft-foreground text-xs"
                  >
                    Principal
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell>{branch.city}, {branch.state}</TableCell>
              <TableCell>{branch.phone || "—"}</TableCell>
              <TableCell>
                <BranchStatusBadge status={branch.status} size="sm" showIcon />
              </TableCell>
              <TableCell>
                <BranchActions
                  branchId={branch.id}
                  branchName={branch.name}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
