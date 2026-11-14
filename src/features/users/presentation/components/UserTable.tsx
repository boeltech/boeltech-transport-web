/**
 * UserTable — listado Operate (`EntityListTable`, SoT §7 T1–T10).
 *
 * 6 cols: Nombre · Correo · Rol · Estado · Último acceso · Alta · ⋯.
 * Sort local (page). Empty → null. `framed={false}`.
 */

import { ROLE_LABELS } from "@shared/constants/roles";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListSortState,
  type EntityListStackedValue,
} from "@shared/ui/table";
import type {
  UserListItem,
  UserSortOptions,
  UserStatusType,
} from "../../domain";
import { usersCopy } from "../copy/usersCopy";
import { UserActions } from "./UserActions";
import { UserStatusBadge } from "../config/userStatusConfig";

const columnsCopy = usersCopy.list.columns;

/** @deprecated Prefer EntityListSortState.field tipado desde la page. */
export type UserSortableColumn = UserSortOptions["field"];

export interface UserTableProps {
  users: UserListItem[];
  isLoading: boolean;
  /** Href del detalle (link primario + fila). */
  primaryTo: (user: UserListItem) => string;
  /** Cola del listado (`location.state.from`). */
  primaryState?: (user: UserListItem) => unknown;
  sort: EntityListSortState;
  onSortChange: (next: EntityListSortState) => void;
  onStatusChange?: (id: string, status: UserStatusType) => void;
}

function buildColumns(
  props: Pick<UserTableProps, "onStatusChange">,
): EntityListColumnDef<UserListItem>[] {
  const { onStatusChange } = props;

  return [
    {
      id: "name",
      header: columnsCopy.name,
      kind: "primary",
      sortable: true,
      sortField: "first_name",
      accessor: (user): EntityListStackedValue => ({
        primary: `${user.firstName} ${user.lastName}`.trim(),
      }),
    },
    {
      id: "email",
      header: columnsCopy.email,
      kind: "meta",
      sortable: true,
      sortField: "email",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      accessor: (user) => user.email,
    },
    {
      id: "role",
      header: columnsCopy.role,
      kind: "meta",
      sortable: true,
      sortField: "role",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      accessor: (user) => ROLE_LABELS[user.role] ?? user.role,
    },
    {
      id: "status",
      header: columnsCopy.status,
      kind: "status",
      sortable: true,
      sortField: "status",
      accessor: (user) => (
        <UserStatusBadge status={user.status} size="sm" showIcon />
      ),
    },
    {
      id: "lastLogin",
      header: columnsCopy.lastLogin,
      kind: "meta",
      sortable: true,
      sortField: "last_login",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      accessor: (user) => formatDateTime(user.lastLogin),
    },
    {
      id: "createdAt",
      header: columnsCopy.createdAt,
      kind: "meta",
      sortable: true,
      sortField: "created_at",
      headerClassName: "hidden xl:table-cell",
      className: "hidden xl:table-cell",
      // Mismo formato que Último acceso (`formatDateTime` es-MX + CDMX).
      accessor: (user) => formatDateTime(user.createdAt),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (user) => (
        <UserActions
          userId={user.id}
          userName={`${user.firstName} ${user.lastName}`.trim()}
          status={user.status}
          onStatusChange={onStatusChange}
        />
      ),
    },
  ];
}

export function UserTable({
  users,
  isLoading,
  primaryTo,
  primaryState,
  sort,
  onSortChange,
  onStatusChange,
}: UserTableProps) {
  const columns = buildColumns({ onStatusChange });

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={users}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      primaryTo={primaryTo}
      primaryState={primaryState}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
