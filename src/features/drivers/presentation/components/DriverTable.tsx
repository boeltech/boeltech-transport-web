/**
 * DriverTable — listado Operate (`EntityListTable`, SoT §7 T1–T10).
 *
 * 7 cols: Conductor · Teléfono · Sucursal · Licencia · Vencimiento ·
 * Viajes · Estado · ⋯. Sort local vía page (API `DriverSortOptions`).
 * Empty → null (ListPageShell). `framed={false}`.
 */

import { AlertTriangle } from "lucide-react";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListSortState,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { formatDate, isExpiringSoon } from "@shared/utils/dateUtils";
import { formatBranchLabel } from "@shared/utils/branchSelectUtils";
import type { DriverListItem } from "../../domain";
import {
  LICENSE_TYPE_LABELS,
  getDriverLicenseJurisdiction,
  getDriverPrimaryCategoryLabel,
  getDriverPrimaryLicenseExpiry,
  getDriverPrimaryLicenseNumber,
} from "../../domain";
import { DriverStatusBadge } from "../config/driverStatusConfig";
import { employeePrimaryContactDisplay } from "../helpers/employeePrimaryContactDisplay";
import { driversCopy } from "../copy";
import { DriverActions } from "./DriverActions";

const listCopy = driversCopy.list.table;
const jurisdictionCopy = driversCopy.list.jurisdiction;
const rfcMissingChip = driversCopy.detail.alert.rfcMissing.chip;

export interface DriverTableProps {
  drivers: DriverListItem[];
  isLoading: boolean;
  /** Href del detalle (link primario + fila). */
  primaryTo: (driver: DriverListItem) => string;
  /** Cola del listado (`location.state.from`). */
  primaryState?: (driver: DriverListItem) => unknown;
  sort: EntityListSortState;
  onSortChange: (next: EntityListSortState) => void;
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function licenseJurisdictionLabel(
  driver: DriverListItem,
): string | null {
  const jurisdiction = getDriverLicenseJurisdiction(driver);
  if (jurisdiction === "both") return jurisdictionCopy.both;
  if (jurisdiction === "federal") return jurisdictionCopy.federal;
  if (jurisdiction === "state") return jurisdictionCopy.state;
  return null;
}

function buildColumns(
  props: Pick<DriverTableProps, "onView" | "onEdit" | "onDelete">,
): EntityListColumnDef<DriverListItem>[] {
  const { onView, onEdit, onDelete } = props;

  return [
    {
      id: "name",
      header: listCopy.name,
      kind: "primary",
      sortable: true,
      sortField: "employee_name",
      accessor: (driver): EntityListStackedValue => {
        const fullName = `${driver.employee.firstName} ${driver.employee.lastName}`;
        const rfcMissing = !driver.employee.rfc?.trim();
        return {
          primary: rfcMissing ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span>{fullName}</span>
              <Badge
                variant="warning"
                tone="soft"
                className="text-[10px] font-normal"
              >
                {rfcMissingChip}
              </Badge>
            </span>
          ) : (
            fullName
          ),
          secondary: driver.employee.email || undefined,
        };
      },
    },
    {
      id: "phone",
      header: listCopy.phone,
      kind: "meta",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      accessor: (driver) =>
        employeePrimaryContactDisplay(driver.employee) ?? null,
    },
    {
      id: "branch",
      header: listCopy.branch,
      kind: "meta",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      accessor: (driver) =>
        formatBranchLabel(
          driver.branchName ?? driver.employee.branchName,
          driver.branchCode ?? driver.employee.branchCode,
        ),
    },
    {
      id: "license",
      header: listCopy.license,
      kind: "stacked",
      headerClassName: "hidden md:table-cell",
      className: "hidden md:table-cell",
      accessor: (driver): EntityListStackedValue => {
        const number = getDriverPrimaryLicenseNumber(driver);
        const jurisdictionLabel = licenseJurisdictionLabel(driver);
        const categoryLabel = getDriverPrimaryCategoryLabel(
          driver,
          LICENSE_TYPE_LABELS,
        );
        if (!number) {
          return { primary: undefined };
        }
        return {
          primary: jurisdictionLabel ? (
            <span className="inline-flex flex-wrap items-center gap-1.5 font-mono text-[13px]">
              <span>{number}</span>
              <Badge
                variant="outline"
                className="font-sans text-[10px] font-normal"
              >
                {jurisdictionLabel}
              </Badge>
            </span>
          ) : (
            <span className="font-mono text-[13px]">{number}</span>
          ),
          secondary: categoryLabel || undefined,
        };
      },
    },
    {
      id: "expiration",
      header: listCopy.expiration,
      kind: "meta",
      sortable: true,
      sortField: "license_expiry",
      headerClassName: "hidden lg:table-cell",
      className: "hidden lg:table-cell",
      accessor: (driver) => {
        const expiry = getDriverPrimaryLicenseExpiry(driver);
        if (!expiry) return null;
        const expired = driver.isLicenseExpired;
        const expiringSoon = isExpiringSoon(expiry);
        return (
          <span className="inline-flex items-center gap-2">
            <span
              className={
                expired
                  ? "text-destructive"
                  : expiringSoon
                    ? "text-warning"
                    : undefined
              }
            >
              {formatDate(expiry)}
            </span>
            {(expiringSoon || expired) && (
              <AlertTriangle
                className={`h-4 w-4 ${
                  expired ? "text-destructive" : "text-warning"
                }`}
              />
            )}
          </span>
        );
      },
    },
    {
      id: "trips",
      header: listCopy.trips,
      kind: "number",
      sortable: true,
      sortField: "total_trips",
      headerClassName: "hidden xl:table-cell",
      className: "hidden xl:table-cell",
      accessor: (driver) => driver.totalTrips ?? 0,
    },
    {
      id: "status",
      header: listCopy.status,
      kind: "status",
      sortable: true,
      sortField: "status",
      accessor: (driver) => (
        <DriverStatusBadge status={driver.status} size="sm" showIcon />
      ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (driver) => (
        <DriverActions
          driver={driver}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    },
  ];
}

export function DriverTable({
  drivers,
  isLoading,
  primaryTo,
  primaryState,
  sort,
  onSortChange,
  onView,
  onEdit,
  onDelete,
}: DriverTableProps) {
  const columns = buildColumns({ onView, onEdit, onDelete });

  return (
    <EntityListTable
      framed={false}
      density="list"
      columns={columns}
      rows={drivers}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      primaryTo={primaryTo}
      primaryState={primaryState}
      sort={sort}
      onSortChange={onSortChange}
    />
  );
}
