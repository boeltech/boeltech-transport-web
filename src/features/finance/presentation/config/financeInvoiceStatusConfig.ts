import {
  CheckCircle2,
  Clock,
  FileEdit,
  XCircle,
} from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import type { FinanceInvoiceStatus } from "@features/finance/domain";
import { financeCopy } from "../copy";

const labels = financeCopy.invoices.statusLabels;

export const FINANCE_INVOICE_STATUS_CONFIG: Record<
  FinanceInvoiceStatus,
  StatusConfig
> = {
  draft: createStatusConfig("neutral", {
    label: labels.draft,
    icon: FileEdit,
    description: "Borrador pendiente de emitir",
  }),
  stamped: createStatusConfig("success", {
    label: labels.stamped,
    icon: CheckCircle2,
    description: "Factura emitida",
  }),
  cancellation_pending: createStatusConfig("warning", {
    label: labels.cancellation_pending,
    icon: Clock,
    description: "Cancelación en proceso",
  }),
  cancelled: createStatusConfig("destructive", {
    label: labels.cancelled,
    icon: XCircle,
    description: "Factura cancelada",
  }),
};

export const FinanceInvoiceStatusBadge =
  createStatusBadgeComponent(FINANCE_INVOICE_STATUS_CONFIG);
