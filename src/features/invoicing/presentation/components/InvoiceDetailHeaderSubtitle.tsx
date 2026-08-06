import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail;

interface Props {
  receiverName: string;
  receiverRfc: string;
  /** Nombre corto del emisor (Situación — D2). */
  issuerName?: string | null;
  /** Portal client: sin RFC en el subtítulo (fiscal secundario). */
  isClientPortal?: boolean;
}

/** Cliente facturado above-the-fold; folio fiscal vive en el expediente. */
export function InvoiceDetailHeaderSubtitle({
  receiverName,
  receiverRfc,
  issuerName,
  isClientPortal = false,
}: Props) {
  const issuer = issuerName?.trim();

  return (
    <div className="space-y-0.5">
      <p className="truncate text-sm text-muted-foreground">
        {isClientPortal
          ? receiverName
          : copy.header.receiverSubtitle(receiverName, receiverRfc)}
      </p>
      {!isClientPortal && issuer ? (
        <p className="truncate text-xs text-muted-foreground">
          {copy.header.issuerLine(issuer)}
        </p>
      ) : null}
    </div>
  );
}
