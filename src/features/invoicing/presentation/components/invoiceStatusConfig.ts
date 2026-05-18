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
import type { InvoiceStatus } from "@features/invoicing/domain";
import { InvoiceStatusLabels } from "@features/invoicing/domain";

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
  draft: createStatusConfig("neutral", {
    label: InvoiceStatusLabels.draft,
    icon: FileEdit,
    description: "Borrador sin timbrar",
  }),
  stamped: createStatusConfig("success", {
    label: InvoiceStatusLabels.stamped,
    icon: CheckCircle2,
    description: "CFDI timbrado ante el SAT",
  }),
  cancellation_pending: createStatusConfig("warning", {
    label: InvoiceStatusLabels.cancellation_pending,
    icon: Clock,
    description: "Cancelación en proceso ante el PAC",
  }),
  cancelled: createStatusConfig("destructive", {
    label: InvoiceStatusLabels.cancelled,
    icon: XCircle,
    description: "Factura cancelada",
  }),
};

/** @deprecated Usar `INVOICE_STATUS_CONFIG` */
export const invoiceStatusConfig = INVOICE_STATUS_CONFIG;

export const InvoiceStatusBadge =
  createStatusBadgeComponent(INVOICE_STATUS_CONFIG);

export function getInvoiceStatusConfig(status: InvoiceStatus): StatusConfig {
  return INVOICE_STATUS_CONFIG[status];
}
