import type { InvoiceStatus } from "@features/invoicing/domain";

export interface InvoiceStatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}

export const invoiceStatusConfig: Record<InvoiceStatus, InvoiceStatusConfig> = {
  draft: {
    label: "Borrador",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  stamped: {
    label: "Timbrada",
    variant: "default",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  cancellation_pending: {
    label: "Cancelación pendiente",
    variant: "outline",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  cancelled: {
    label: "Cancelada",
    variant: "destructive",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
};
