import { invoicingCopy } from "../copy/invoicingCopy";
import { CopyableUuidSubtitle } from "./CopyableUuidSubtitle";

const copy = invoicingCopy.detail;

interface Props {
  receiverName: string;
  receiverRfc: string;
  cfdiUuid?: string | null;
}

export function InvoiceDetailHeaderSubtitle({
  receiverName,
  receiverRfc,
  cfdiUuid,
}: Props) {
  return (
    <div className="space-y-1">
      <p className="truncate text-sm text-muted-foreground">
        {copy.header.receiverSubtitle(receiverName, receiverRfc)}
      </p>
      {cfdiUuid ? <CopyableUuidSubtitle uuid={cfdiUuid} /> : null}
    </div>
  );
}
