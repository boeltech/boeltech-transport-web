import { Link } from "react-router-dom";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import type { CobrosFollowThrough } from "../utils/cobrosFollowThrough";

const copy = financeCopy.cobros;

function folio(serie: string, folioNumber: number): string {
  return `${serie}-${folioNumber}`;
}

function repStatusLabel(status: string): string {
  const labels = copy.exceptions.statusLabels as Record<string, string>;
  return labels[status] ?? status;
}

interface FinanceCobrosFollowThroughAlertProps {
  followThrough: CobrosFollowThrough;
}

export function FinanceCobrosFollowThroughAlert({
  followThrough,
}: FinanceCobrosFollowThroughAlertProps) {
  return (
    <AlertWithIcon variant="info" title={copy.followThrough.title}>
      <div className="space-y-3">
        <p>
          {copy.followThrough.description(formatMxCurrency(followThrough.amount))}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary" className="font-mono">
            {copy.rfcChip(followThrough.receiverRfc)}
          </Badge>
          <span>
            {copy.followThrough.repStatusLabel}:{" "}
            <span className="font-medium">
              {repStatusLabel(followThrough.repStatus)}
            </span>
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium">{copy.followThrough.invoicesTitle}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {followThrough.invoices.map((invoice) => {
              const label = folio(invoice.serie, invoice.folio);
              return (
                <li key={invoice.id}>
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    aria-label={copy.followThrough.openInvoice(label)}
                  >
                    {label}
                  </Link>
                  <span className="ml-1 tabular-nums text-muted-foreground">
                    {formatMxCurrency(invoice.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">{copy.followThrough.hint}</p>
      </div>
    </AlertWithIcon>
  );
}
