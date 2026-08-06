import { ROLE_LABELS } from "@shared/constants/roles";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { cn } from "@shared/lib/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Skeleton } from "@shared/ui/skeleton";
import type { UserListItem, UserSortOptions, UserStatusType } from "../../domain";
import { usersCopy } from "../copy/usersCopy";
import { UserActions } from "./UserActions";
import { UserStatusBadge } from "../config/userStatusConfig";

const columns = usersCopy.list.columns;

export type UserSortableColumn = UserSortOptions["field"];

interface UserTableProps {
  users: UserListItem[];
  isLoading: boolean;
  onView?: (id: string) => void;
  onStatusChange?: (id: string, status: UserStatusType) => void;
  sortField?: UserSortableColumn;
  sortDirection?: "asc" | "desc";
  onSortChange?: (field: UserSortableColumn) => void;
}

export function UserTable({
  users,
  isLoading,
  onView,
  onStatusChange,
  sortField,
  sortDirection,
  onSortChange,
}: UserTableProps) {
  const handleSort = (field: UserSortableColumn) => {
    onSortChange?.(field);
  };

  const renderSortableHead = (field: UserSortableColumn, label: string, className?: string) => {
    const active = sortField === field;
    const asc = sortDirection === "asc";
    return (
      <TableHead
        className={cn(
          onSortChange ? "cursor-pointer select-none hover:bg-muted/50" : undefined,
          className,
        )}
        onClick={onSortChange ? () => handleSort(field) : undefined}
      >
        <div className="flex items-center gap-1">
          {label}
          {active && onSortChange ? <span className="text-xs tabular-nums">{asc ? "↑" : "↓"}</span> : null}
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
              {renderSortableHead("first_name", columns.name)}
              {renderSortableHead("email", columns.email, "hidden md:table-cell")}
              {renderSortableHead("role", columns.role, "hidden lg:table-cell")}
              {renderSortableHead("status", columns.status)}
              {renderSortableHead(
                "last_login",
                columns.lastLogin,
                "hidden lg:table-cell",
              )}
              {renderSortableHead(
                "created_at",
                columns.createdAt,
                "hidden xl:table-cell",
              )}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
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
            {renderSortableHead("first_name", columns.name)}
            {renderSortableHead("email", columns.email, "hidden md:table-cell")}
            {renderSortableHead("role", columns.role, "hidden lg:table-cell")}
            {renderSortableHead("status", columns.status)}
            {renderSortableHead(
              "last_login",
              columns.lastLogin,
              "hidden lg:table-cell",
            )}
            {renderSortableHead(
              "created_at",
              columns.createdAt,
              "hidden xl:table-cell",
            )}
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className={onView ? "cursor-pointer hover:bg-muted/50" : undefined}
              onClick={onView ? () => onView(user.id) : undefined}
            >
              <TableCell className="font-medium">
                {`${user.firstName} ${user.lastName}`.trim()}
              </TableCell>
              <TableCell className="hidden md:table-cell">{user.email}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {ROLE_LABELS[user.role] ?? user.role}
              </TableCell>
              <TableCell>
                <UserStatusBadge status={user.status} size="sm" showIcon />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatDateTime(user.lastLogin)}
              </TableCell>
              <TableCell className="hidden xl:table-cell whitespace-nowrap text-muted-foreground">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <UserActions
                  userId={user.id}
                  userName={`${user.firstName} ${user.lastName}`.trim()}
                  status={user.status}
                  onStatusChange={onStatusChange}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
