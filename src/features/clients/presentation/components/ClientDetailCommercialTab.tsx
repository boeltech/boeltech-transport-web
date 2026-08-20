/**
 * Bloque de términos comerciales en el tab Cliente del detalle.
 * Crédito solo aquí (CreditExposureCard) — no en stats del shell.
 */

import type { ComponentType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Separator } from "@shared/ui/separator";
import { InfoRow, CreditExposureCard } from "@shared/ui/data-display";
import { CreditCard } from "lucide-react";

import { useClientCreditSummary } from "../../application";
import type { Client } from "../../domain";
import type { PaymentTermsConfig } from "../config/clientConfig";
import { clientDetailCopy } from "../copy/clientDetailCopy";

export interface ClientDetailCommercialTabProps {
  client: Client;
  paymentConfig: PaymentTermsConfig;
  PaymentIcon: ComponentType<{ className?: string }>;
  /** Deep-link a Cobros cuando el usuario puede cobrar (D7). */
  collectHref?: string;
}

const copy = clientDetailCopy.commercial;

export function ClientDetailCommercialTab({
  client,
  paymentConfig,
  PaymentIcon,
  collectHref,
}: ClientDetailCommercialTabProps) {
  const creditSummaryQuery = useClientCreditSummary(client.id);

  return (
    <div className="flex h-full flex-col gap-4">
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 shrink-0 text-primary" />
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          <InfoRow
            variant="inline"
            label={copy.paymentTerms}
            value={
              <Badge variant={paymentConfig.variant}>
                <PaymentIcon className="mr-1 h-3 w-3" />
                {paymentConfig.label}
              </Badge>
            }
          />
          {client.paymentTerms === "credit" ? (
            <>
              <Separator className="my-2" />
              <InfoRow
                variant="inline"
                label={copy.creditDays}
                value={copy.creditDaysValue(client.creditDays)}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      <CreditExposureCard
        variant="full"
        showBreakdown
        summary={creditSummaryQuery.data}
        isLoading={creditSummaryQuery.isLoading}
        isError={creditSummaryQuery.isError}
        collectHref={collectHref}
        className="flex-1"
      />
    </div>
  );
}
