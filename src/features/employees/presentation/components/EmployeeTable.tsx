/**
 * EmployeeTable — listado Operate (`EntityListTable`, SoT §7 T1–T10).
 *
 * 6 cols: Empleado · Contacto · Departamento / puesto · Contrato ·
 * Ingreso · Estado · ⋯. Sort solo campos API (`first_name`, `department`,
 * `hire_date`, `status`). Empty → null (ListPageShell). `framed={false}`.
 */

import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListSortState,
  type EntityListStackedValue,
} from "@shared/ui/table";
import type { EmployeeListItem, EmployeeSortOptions } from "../../domain/entities";
import { EmployeeStatusBadge } from "../config/employeeStatusConfig";
import { EMPLOYMENT_TYPE_LABELS } from "../config/employeeConfig";
import { employeesCopy } from "../copy/employeesCopy";
import { EmployeeActions } from "./EmployeeActions";

const listCopy = employeesCopy.list.table;

export type EmployeeSortableColumn = EmployeeSortOptions["field"];

export interface EmployeeTableProps {
  employees: EmployeeListItem[];
  isLoading: boolean;
  /** Href del detalle (link primario + fila). */
  primaryTo: (employee: EmployeeListItem) => string;
  /** Cola del listado (`location.state.from`). */
  primaryState?: (employee: EmployeeListItem) => unknown;
  sort: EntityListSortState;
  onSortChange: (next: EntityListSortState) => void;
}

function buildColumns(): EntityListColumnDef<EmployeeListItem>[] {
  return [
    {
      id: "employee",
      header: listCopy.employee,
      kind: "primary",
      sortable: true,
      sortField: "first_name",
      accessor: (emp): EntityListStackedValue => ({
        primary: emp.fullName,
        secondary: emp.employeeNumber,
      }),
    },
    {
      id: "contact",
      header: listCopy.contact,
      kind: "stacked",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      accessor: (emp): EntityListStackedValue => ({
        primary: emp.email || undefined,
        secondary: emp.phone || undefined,
      }),
    },
    {
      id: "department",
      header: listCopy.department,
      kind: "stacked",
      sortable: true,
      sortField: "department",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      accessor: (emp): EntityListStackedValue => ({
        primary: emp.department || undefined,
        secondary: emp.position || undefined,
      }),
    },
    {
      id: "contract",
      header: listCopy.contract,
      kind: "meta",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      accessor: (emp) => EMPLOYMENT_TYPE_LABELS[emp.employmentType],
    },
    {
      id: "hireDate",
      header: listCopy.hireDate,
      kind: "date",
      sortable: true,
      sortField: "hire_date",
      headerClassName: "hidden xl:table-cell",
      className: "hidden xl:table-cell",
      accessor: (emp) => emp.hireDate,
    },
    {
      id: "status",
      header: listCopy.status,
      kind: "status",
      sortable: true,
      sortField: "status",
      accessor: (emp) => (
        <EmployeeStatusBadge status={emp.status} size="sm" showIcon />
      ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (emp) => <EmployeeActions employee={emp} />,
    },
  ];
}

export function EmployeeTable({
  employees,
  isLoading,
  primaryTo,
  primaryState,
  sort,
  onSortChange,
}: EmployeeTableProps) {
  const columns = buildColumns();

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={employees}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      primaryTo={primaryTo}
      primaryState={primaryState}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
