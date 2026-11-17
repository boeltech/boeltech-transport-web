/**
 * Formulario único «Registrar cobro» — `/finance/collections/new` (F1).
 */

import { HandCoins } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import {
  FINANCE_COBROS_PATH,
  FINANCE_EFECTIVO_POR_COBRAR_PATH,
} from "@features/finance/application";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";

import { WithInvoiceCollectionForm } from "../components/WithInvoiceCollectionForm";
import { WithoutInvoiceCollectionForm } from "../components/WithoutInvoiceCollectionForm";
import { registerCollectionCopy } from "../copy/registerCollectionCopy";
import { parseRegisterCollectionSearch } from "../utils/registerCollectionQuery";

const copy = registerCollectionCopy;

export function RegisterCollectionPage() {
  const [searchParams] = useSearchParams();
  const query = parseRegisterCollectionSearch(searchParams);

  if (query.channel === "without_invoice" && query.clientId) {
    return (
      <WithoutInvoiceCollectionForm
        clientId={query.clientId}
        from={query.from}
        premarkedTripIds={query.tripIds}
      />
    );
  }

  if (
    query.channel === "with_invoice" &&
    (query.clientId || query.receiverRfc || query.invoiceIds.length > 0)
  ) {
    return (
      <WithInvoiceCollectionForm
        clientId={query.clientId}
        receiverRfc={query.receiverRfc}
        from={query.from}
        premarkedInvoiceIds={query.invoiceIds}
      />
    );
  }

  const fallbackHref =
    query.channel === "without_invoice"
      ? FINANCE_EFECTIVO_POR_COBRAR_PATH
      : FINANCE_COBROS_PATH;

  return (
    <FormPageShell
      isLoading={false}
      header={{
        backHref: fallbackHref,
        title: copy.title,
        icon: <HandCoins className="h-5 w-5" />,
      }}
    >
      <EmptyState
        icon={<HandCoins className="h-8 w-8" />}
        title={copy.missingClientTitle}
        description={copy.missingClientDescription}
      />
      <div className="mt-4 flex justify-center">
        <Button variant="outline" asChild>
          <Link to={fallbackHref}>{copy.cancel}</Link>
        </Button>
      </div>
    </FormPageShell>
  );
}
