import type { ReactNode, TableHTMLAttributes } from "react";
import { cn } from "@shared/lib/utils/cn";
import type {
  PlatformAutoChargeChipKind,
  PlatformSaasInvoiceOrigin,
  PlatformSaasInvoiceStatusType,
} from "../../../domain/entities";
import { platformCopy } from "../../copy/platformCopy";
import { opsCopy } from "../opsCopy";
import { OpsBadge, type OpsBadgeTone } from "../ui/OpsBadge";
import {
  OpsTableBody,
  OpsTableCell,
  OpsTableHead,
  OpsTableHeader,
  OpsTableRow,
} from "../ui/OpsTable";

/**
 * Tabla Money Ops (Ola 2) — AR densa, hairlines, sin Card blanca envolvente.
 */
export function OpsMoneyTable({
  className,
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="ops-table-wrap" data-testid="ops-money-table">
      <table className={cn("ops-table ops-money-table", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

function formatOpsAmountNumber(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export interface OpsMoneyAmountProps {
  cents: number | null | undefined;
  empty?: ReactNode;
  className?: string;
}

/**
 * M3 — monto mono alineado derecha + «MXN» muted.
 */
export function OpsMoneyAmount({
  cents,
  empty = "—",
  className,
}: OpsMoneyAmountProps) {
  if (cents == null) {
    return (
      <span
        className={cn("ops-money-amount ops-text-muted", className)}
        data-testid="ops-money-amount"
      >
        {empty}
      </span>
    );
  }

  return (
    <span
      className={cn("ops-money-amount", className)}
      data-testid="ops-money-amount"
      data-zero={cents === 0 ? "true" : undefined}
    >
      <span className="ops-font-mono tabular-nums ops-text">
        {formatOpsAmountNumber(cents)}
      </span>
      <span className="ops-money-currency ops-text-muted">
        {opsCopy.money.currency}
      </span>
    </span>
  );
}

export {
  OpsTableHeader as OpsMoneyTableHeader,
  OpsTableBody as OpsMoneyTableBody,
  OpsTableRow as OpsMoneyTableRow,
  OpsTableHead as OpsMoneyTableHead,
  OpsTableCell as OpsMoneyTableCell,
};

function statusTone(status: PlatformSaasInvoiceStatusType): OpsBadgeTone {
  if (status === "paid") return "ok";
  if (status === "void" || status === "draft") return "muted";
  return "default";
}

/** Pagado / Pendiente / Borrador / Anulado */
export function OpsArStatusBadge({
  status,
}: {
  status: PlatformSaasInvoiceStatusType;
}) {
  return (
    <OpsBadge tone={statusTone(status)} data-ops-ar-status={status}>
      {platformCopy.ar.status[status]}
    </OpsBadge>
  );
}

/** Auto-emitido (origen corrida de cierre) */
export function OpsInvoiceOriginBadge({
  origin,
}: {
  origin?: PlatformSaasInvoiceOrigin;
}) {
  if (origin !== "auto_period_issue") return null;
  const copy = platformCopy.ar.origin;
  return (
    <OpsBadge tone="accent" title={copy.autoHint} data-ops-ar-origin="auto">
      {copy.auto}
    </OpsBadge>
  );
}

function chargeTone(kind: PlatformAutoChargeChipKind): OpsBadgeTone {
  if (kind === "failed") return "danger";
  if (kind === "requires_action") return "warn";
  if (kind === "processing") return "default";
  if (kind === "charged") return "ok";
  return "muted";
}

/** Una señal de auto-cargo. Procesando va en tinta. Pagado no repite «cobrado». */
export function OpsAutoChargeBadge({
  kind,
  status,
}: {
  kind: PlatformAutoChargeChipKind | null | undefined;
  status?: PlatformSaasInvoiceStatusType;
}) {
  if (!kind) return null;
  if (status === "paid" && kind === "charged") return null;
  const copy = platformCopy.ar.chargeChip;
  const label =
    kind === "no_payment_method"
      ? copy.noPaymentMethod
      : kind === "requires_action"
        ? copy.requiresAction
        : copy[kind];
  return (
    <OpsBadge tone={chargeTone(kind)} data-ops-ar-charge={kind}>
      {label}
    </OpsBadge>
  );
}

export function OpsArStatusCluster({
  status,
  origin,
  chargeKind,
}: {
  status: PlatformSaasInvoiceStatusType;
  origin?: PlatformSaasInvoiceOrigin;
  chargeKind?: PlatformAutoChargeChipKind | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <OpsArStatusBadge status={status} />
      <OpsInvoiceOriginBadge origin={origin} />
      <OpsAutoChargeBadge kind={chargeKind} status={status} />
    </div>
  );
}
