import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { invoicingCopy } from "../copy/invoicingCopy";

type DispatchBadgeMode = "compact" | "withDate";

interface InvoiceEmailDispatchBadgeProps {
  /** Solo se muestra en facturas timbradas. */
  status: string;
  dispatchSentAt: string | null | undefined;
  /**
   * Último estado de ítem de corrida automática (ADR-0083).
   * Si es `failed` y aún no hay envío exitoso, el listado muestra el fallo.
   */
  autoDispatchLastItemStatus?: string | null;
  /**
   * `compact` — listados («Enviada» / «No enviada» / «Envío auto falló»).
   * `withDate` — detalle («Enviada · {fecha}»).
   */
  mode?: DispatchBadgeMode;
  className?: string;
}

/**
 * Historial mínimo de envío por correo (H6 / F4 / F5 D9):
 * chip Enviada, No enviada o Envío auto falló.
 */
export function InvoiceEmailDispatchBadge({
  status,
  dispatchSentAt,
  autoDispatchLastItemStatus,
  mode = "compact",
  className,
}: InvoiceEmailDispatchBadgeProps) {
  if (status !== "stamped") return null;

  const sent = Boolean(dispatchSentAt);
  const autoFailed =
    !sent && autoDispatchLastItemStatus === "failed";

  if (autoFailed) {
    return (
      <Badge
        variant="destructive"
        tone="soft"
        title={invoicingCopy.send.listAutoFailTitle}
        className={cn("text-xs font-medium", className)}
      >
        {invoicingCopy.send.badgeAutoFail}
      </Badge>
    );
  }

  const label = sent
    ? mode === "withDate" && dispatchSentAt
      ? invoicingCopy.send.badgeSentOn(formatDate(dispatchSentAt))
      : invoicingCopy.send.badgeSent
    : invoicingCopy.send.badgeNotSent;

  const title = sent
    ? dispatchSentAt
      ? invoicingCopy.send.badgeSentOn(formatDate(dispatchSentAt))
      : invoicingCopy.send.listSentTitle
    : invoicingCopy.send.listNotSentTitle;

  return (
    <Badge
      variant={sent ? "success" : "neutral"}
      tone="soft"
      title={title}
      className={cn("text-xs font-medium", className)}
    >
      {label}
    </Badge>
  );
}
